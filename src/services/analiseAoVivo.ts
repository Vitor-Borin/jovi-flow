/**
 * Modo ao vivo: le a foto capturada de verdade, em vez de usar o conteudo
 * simulado. Este e o UNICO ponto do aplicativo que toca a rede.
 *
 * ARQUITETURA — duas chamadas paralelas, e nao uma
 *
 * Medido contra a API real, sobre a mesma lousa:
 *
 *   so classificar (49 tokens de saida)     Sonnet 5   2,1s
 *   transcrever tudo (682 tokens de saida)  Sonnet 5   8,2s
 *
 * O gargalo e a GERACAO da resposta, nao a rede. E a parte cara de gerar — a
 * transcricao inteira — e justamente a que aparece embaixo da tela, num card com
 * rolagem. Materia, tema e topico ficam no topo e sao os primeiros que alguem le.
 *
 * Entao o trabalho e dividido:
 *
 *   classificar   imagem de 768px  (~21 KB)   ~1,7s   -> preenche o topo da tela
 *   transcrever   imagem de 1568px (~250 KB)  ~8,2s   -> preenche o texto extraido
 *
 * A classificacao usa imagem pequena de proposito: medido, ela acerta igual com
 * 768px e com 1568px, e 21 KB sobem mesmo num wifi congestionado de campus. A
 * parte que depende de banda boa e a que ninguem esta olhando ainda.
 *
 * Se qualquer uma falhar, aquela parte cai no conteudo de exemplo sem quebrar a
 * demonstracao. As duas sao independentes.
 *
 * Por que fetch e nao o SDK oficial: o SDK da Anthropic e feito para Node e
 * navegador, e adiciona-lo ao bundle do Expo Go traria risco de resolucao de
 * modulo no Metro. O fetch e nativo, nao custa dependencia e deixa controlar o
 * tempo limite com precisao.
 */

import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const VERSAO_API = '2023-06-01';

/** Sonnet 5 e o ponto de equilibrio medido: classifica em ~2s e transcreve em
 *  ~8s, contra ~5s e ~11,5s do Opus 5, com a mesma leitura correta. */
const MODELO = 'claude-sonnet-5';

/** Teto de cada chamada. Generoso de proposito: nenhuma delas bloqueia a
 *  navegacao, entao esperar mais so aumenta a chance de o conteudo real chegar. */
export const LIMITE_CLASSIFICACAO_MS = 12000;
export const LIMITE_TRANSCRICAO_MS = 20000;

/** Lado maior de cada imagem. A de transcricao usa 1568px porque e a faixa para
 *  a qual a API de visao ja reduz internamente — mandar mais nao melhora nada. */
const PX_CLASSIFICACAO = 768;
const PX_TRANSCRICAO = 1568;
const QUALIDADE_ENVIO = 0.82;

export type ClassificacaoAoVivo = {
  materia: string;
  tema: string;
  topico: string;
};

export type TranscricaoAoVivo = {
  textoExtraido: string;
  resumo: string[];
};

export type Resultado<T> =
  | { estado: 'ok'; dados: T; ms: number }
  | { estado: 'sem-chave' }
  | { estado: 'sem-foto' }
  | { estado: 'tempo-esgotado' }
  | { estado: 'falha'; motivo: string };

const PROMPT_CLASSIFICACAO = [
  'Olhe esta foto de lousa, slide ou caderno de um estudante universitário brasileiro.',
  '',
  'Responda SOMENTE com JSON válido, sem cercas de código e sem texto ao redor:',
  '{"materia":"...","tema":"...","topico":"..."}',
  '',
  '- materia: a área de estudo em uma ou duas palavras. Ex.: Design, Programação, Matemática.',
  '- tema: a disciplina ou assunto maior.',
  '- topico: o assunto específico da imagem, em uma linha curta.',
  '',
  'Tudo em português do Brasil.',
].join('\n');

const PROMPT_TRANSCRICAO = [
  'Transcreva fielmente todo o texto desta foto de lousa, slide ou caderno e resuma o conteúdo.',
  '',
  'Responda SOMENTE com JSON válido, sem cercas de código e sem texto ao redor:',
  '{"textoExtraido":"...","resumo":["...","..."]}',
  '',
  '- textoExtraido: a transcrição fiel, preservando as quebras de linha do original.',
  '- resumo: de 4 a 6 frases curtas, cada uma completa em si.',
  '',
  'Tudo em português do Brasil. Não invente conteúdo que não está na imagem.',
].join('\n');

type BlocoTexto = { type: string; text?: string };
type RespostaApi = { content?: BlocoTexto[] };

export function temChaveConfigurada(): boolean {
  const c = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  return typeof c === 'string' && c.length > 0;
}

/**
 * Reduz a foto e devolve em base64. `ladoMaior` menor = upload menor: e o que
 * torna a classificacao viavel mesmo com rede ruim.
 */
export async function prepararImagem(
  uri: string,
  largura: number,
  altura: number,
  ladoMaior: number
): Promise<string | null> {
  try {
    const maior = Math.max(largura, altura);
    const acoes =
      maior > ladoMaior
        ? [largura >= altura ? { resize: { width: ladoMaior } } : { resize: { height: ladoMaior } }]
        : [];

    const r = await manipulateAsync(uri, acoes, {
      base64: true,
      compress: QUALIDADE_ENVIO,
      format: SaveFormat.JPEG,
    });
    return r.base64 ?? null;
  } catch (erro) {
    console.log('[JOVI Flow] falha ao preparar a imagem:', erro);
    return null;
  }
}

export const PX = { classificacao: PX_CLASSIFICACAO, transcricao: PX_TRANSCRICAO };

/** Extrai o primeiro objeto JSON da resposta, tolerando texto em volta. */
function extrairJson(bruto: string): unknown {
  const i = bruto.indexOf('{');
  const f = bruto.lastIndexOf('}');
  if (i === -1 || f === -1 || f <= i) return null;
  try {
    return JSON.parse(bruto.slice(i, f + 1));
  } catch {
    return null;
  }
}

function texto(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** Uma tentativa de chamada. O retry fica na camada de cima. */
async function chamarUmaVez(
  b64: string,
  prompt: string,
  maxTokens: number,
  limiteMs: number
): Promise<{ ok: true; texto: string } | { ok: false; resultado: Resultado<never> }> {
  const chave = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (typeof chave !== 'string' || chave.length === 0) {
    return { ok: false, resultado: { estado: 'sem-chave' } };
  }

  const controlador = new AbortController();
  const relogio = setTimeout(() => controlador.abort(), limiteMs);

  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      signal: controlador.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': chave,
        'anthropic-version': VERSAO_API,
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: maxTokens,
        // A tarefa e ler e classificar, nao raciocinar. Esforco baixo corta
        // varios segundos sem prejudicar a leitura — medido.
        output_config: { effort: 'low' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    if (!r.ok) {
      const corpo = await r.text();
      return {
        ok: false,
        resultado: { estado: 'falha', motivo: `HTTP ${r.status}: ${corpo.slice(0, 160)}` },
      };
    }

    const json = (await r.json()) as RespostaApi;
    return {
      ok: true,
      texto: (json.content ?? [])
        .filter((b) => b.type === 'text')
        .map((b) => b.text ?? '')
        .join('\n'),
    };
  } catch (erro) {
    if (erro instanceof Error && erro.name === 'AbortError') {
      return { ok: false, resultado: { estado: 'tempo-esgotado' } };
    }
    return {
      ok: false,
      resultado: {
        estado: 'falha',
        motivo: erro instanceof Error ? erro.message : 'erro desconhecido',
      },
    };
  } finally {
    clearTimeout(relogio);
  }
}

/**
 * Chama com uma repeticao em caso de falha de rede. Wifi de campus derruba
 * conexao com frequencia, e uma segunda tentativa imediata costuma passar —
 * mas nao repete quando o problema e de chave ou de formato, que repetir nao
 * resolve.
 */
async function chamarComRetentativa(
  b64: string,
  prompt: string,
  maxTokens: number,
  limiteMs: number
): Promise<{ ok: true; texto: string; ms: number } | { ok: false; resultado: Resultado<never> }> {
  const inicio = Date.now();
  const primeira = await chamarUmaVez(b64, prompt, maxTokens, limiteMs);
  if (primeira.ok) return { ...primeira, ms: Date.now() - inicio };

  const estado = primeira.resultado.estado;
  if (estado === 'sem-chave' || estado === 'sem-foto') return primeira;

  console.log('[JOVI Flow] primeira tentativa falhou, repetindo uma vez:', estado);
  const segunda = await chamarUmaVez(b64, prompt, maxTokens, limiteMs);
  if (segunda.ok) return { ...segunda, ms: Date.now() - inicio };
  return segunda;
}

export async function classificarCaptura(
  b64: string | null
): Promise<Resultado<ClassificacaoAoVivo>> {
  if (b64 === null || b64.length === 0) return { estado: 'sem-foto' };

  const r = await chamarComRetentativa(
    b64,
    PROMPT_CLASSIFICACAO,
    300,
    LIMITE_CLASSIFICACAO_MS
  );
  if (!r.ok) return r.resultado;

  const d = extrairJson(r.texto);
  if (typeof d !== 'object' || d === null) {
    return { estado: 'falha', motivo: 'resposta fora do formato' };
  }
  const o = d as Record<string, unknown>;

  const materia = texto(o.materia);
  if (materia === '') return { estado: 'falha', motivo: 'materia ausente' };

  const tema = texto(o.tema);
  const topico = texto(o.topico);

  return {
    estado: 'ok',
    ms: r.ms,
    dados: {
      materia,
      tema: tema === '' ? materia : tema,
      topico: topico === '' ? tema : topico,
    },
  };
}

export async function transcreverCaptura(
  b64: string | null
): Promise<Resultado<TranscricaoAoVivo>> {
  if (b64 === null || b64.length === 0) return { estado: 'sem-foto' };

  const r = await chamarComRetentativa(b64, PROMPT_TRANSCRICAO, 2000, LIMITE_TRANSCRICAO_MS);
  if (!r.ok) return r.resultado;

  const d = extrairJson(r.texto);
  if (typeof d !== 'object' || d === null) {
    return { estado: 'falha', motivo: 'resposta fora do formato' };
  }
  const o = d as Record<string, unknown>;

  const textoExtraido = texto(o.textoExtraido);
  if (textoExtraido === '') return { estado: 'falha', motivo: 'transcricao vazia' };

  const resumo = Array.isArray(o.resumo)
    ? o.resumo.map(texto).filter((l) => l.length > 0)
    : [];

  return { estado: 'ok', ms: r.ms, dados: { textoExtraido, resumo } };
}
