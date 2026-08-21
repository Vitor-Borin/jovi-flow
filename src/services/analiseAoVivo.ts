/**
 * Modo ao vivo: manda a foto capturada para a API da Anthropic e devolve o
 * conteudo realmente reconhecido, em vez do conteudo simulado.
 *
 * Este e o UNICO ponto do aplicativo que toca a rede. Todo o resto continua
 * offline por decisao de projeto. Se qualquer coisa aqui falhar — sem chave,
 * sem internet, resposta lenta, JSON invalido — a funcao devolve um resultado
 * de falha e quem chama volta para o conteudo simulado, sem quebrar a demo.
 *
 * Por que fetch e nao o SDK oficial: o SDK da Anthropic e feito para Node e
 * navegador, e adiciona-lo ao bundle do Expo Go traria risco de resolucao de
 * modulo no Metro a poucos dias da apresentacao. O fetch e nativo, tem zero
 * dependencia e permite controlar o tempo limite com precisao.
 */

import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const VERSAO_API = '2023-06-01';
const MODELO = 'claude-opus-5';

/**
 * Teto absoluto da chamada.
 *
 * A animacao de processamento dura cerca de 6,4s e a chamada roda escondida
 * atras dela, entao o modo ao vivo nunca adiciona espera percebida. O teto e
 * maior que a animacao de proposito: se a resposta chegar depois, ela ainda
 * substitui o conteudo de exemplo na tela seguinte, em vez de ser descartada.
 */
export const LIMITE_MS = 15000;

/** Lado maior da imagem enviada, em pixels. A API de visao ja reduz para essa
 *  faixa internamente — mandar mais nao melhora a leitura, so pesa o upload. */
const LADO_MAIOR_PX = 1568;

/** Qualidade do JPEG enviado. Alta de proposito: o ganho de tamanho ja veio do
 *  redimensionamento, e artefato de compressao prejudica a leitura do texto. */
const QUALIDADE_ENVIO = 0.82;

export type ConteudoReconhecido = {
  materia: string;
  tema: string;
  topico: string;
  textoExtraido: string;
  resumo: string[];
};

export type ResultadoAnalise =
  | { estado: 'ok'; conteudo: ConteudoReconhecido; ms: number }
  | { estado: 'sem-chave' }
  | { estado: 'sem-foto' }
  | { estado: 'tempo-esgotado' }
  | { estado: 'falha'; motivo: string };

const INSTRUCAO = [
  'Você recebe a foto de uma lousa, slide, caderno ou folha que um estudante',
  'universitário brasileiro acabou de fotografar em aula.',
  '',
  'Responda SOMENTE com um objeto JSON válido, sem cercas de código e sem',
  'nenhum texto antes ou depois, no formato:',
  '{"materia":"...","tema":"...","topico":"...","textoExtraido":"...","resumo":["...","..."]}',
  '',
  '- materia: a área de estudo, em uma ou duas palavras. Ex.: Design, Matemática, Programação.',
  '- tema: a disciplina ou assunto maior. Ex.: "Front-End Design — Layout".',
  '- topico: o assunto específico da imagem, em uma linha.',
  '- textoExtraido: a transcrição fiel do que está escrito, preservando quebras de linha.',
  '- resumo: de 4 a 6 frases curtas resumindo o conteúdo, cada uma completa em si.',
  '',
  'Escreva tudo em português do Brasil. Se a imagem estiver ilegível, preencha',
  'os campos com o que for possível deduzir e não invente conteúdo que não existe.',
].join('\n');

type BlocoTexto = { type: string; text?: string };
type RespostaApi = { content?: BlocoTexto[] };

/**
 * Prepara a foto para envio: reduz o lado maior para LADO_MAIOR_PX e recodifica
 * em JPEG.
 *
 * Nao e so economia de banda. A API de visao ja reduz internamente qualquer
 * imagem para essa faixa, entao mandar 4032px de largura sobe muito byte a mais
 * para chegar exatamente no mesmo lugar. Redimensionar aqui deixa o upload
 * varias vezes menor E preserva mais detalhe do texto do que simplesmente
 * comprimir a foto inteira com qualidade baixa — artefato de compressao em
 * resolucao alta atrapalha a leitura do traco fino de caneta.
 */
export async function prepararImagem(
  uri: string,
  largura: number,
  altura: number
): Promise<string | null> {
  try {
    const maior = Math.max(largura, altura);
    const acoes =
      maior > LADO_MAIOR_PX
        ? [
            largura >= altura
              ? { resize: { width: LADO_MAIOR_PX } }
              : { resize: { height: LADO_MAIOR_PX } },
          ]
        : [];

    const resultado = await manipulateAsync(uri, acoes, {
      base64: true,
      compress: QUALIDADE_ENVIO,
      format: SaveFormat.JPEG,
    });

    return resultado.base64 ?? null;
  } catch (erro) {
    console.log('[JOVI Flow] falha ao preparar a imagem:', erro);
    return null;
  }
}

export function temChaveConfigurada(): boolean {
  return typeof process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY === 'string'
    && process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY.length > 0;
}

/** Extrai o primeiro objeto JSON da resposta, tolerando texto ao redor. */
function extrairJson(bruto: string): unknown {
  const inicio = bruto.indexOf('{');
  const fim = bruto.lastIndexOf('}');
  if (inicio === -1 || fim === -1 || fim <= inicio) return null;
  try {
    return JSON.parse(bruto.slice(inicio, fim + 1));
  } catch {
    return null;
  }
}

function textoDe(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

function validar(dados: unknown): ConteudoReconhecido | null {
  if (typeof dados !== 'object' || dados === null) return null;
  const d = dados as Record<string, unknown>;

  const materia = textoDe(d.materia);
  const tema = textoDe(d.tema);
  const topico = textoDe(d.topico);
  const textoExtraido = textoDe(d.textoExtraido);

  const resumo = Array.isArray(d.resumo)
    ? d.resumo.map(textoDe).filter((linha) => linha.length > 0)
    : [];

  // Sem materia ou sem texto, a tela seguinte ficaria vazia: melhor cair no simulado.
  if (materia === '' || textoExtraido === '') return null;

  return {
    materia,
    tema: tema === '' ? materia : tema,
    topico: topico === '' ? tema : topico,
    textoExtraido,
    resumo,
  };
}

export async function analisarCaptura(
  fotoBase64: string | null,
  limiteMs: number = LIMITE_MS
): Promise<ResultadoAnalise> {
  const chave = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (typeof chave !== 'string' || chave.length === 0) return { estado: 'sem-chave' };
  if (fotoBase64 === null || fotoBase64.length === 0) return { estado: 'sem-foto' };

  const controlador = new AbortController();
  const relogio = setTimeout(() => controlador.abort(), limiteMs);
  const inicio = Date.now();

  try {
    const resposta = await fetch(ENDPOINT, {
      method: 'POST',
      signal: controlador.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': chave,
        'anthropic-version': VERSAO_API,
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 2000,
        // Esforco baixo: a tarefa e transcrever e classificar, nao raciocinar.
        // Mantem a resposta rapida o bastante para caber atras da animacao.
        output_config: { effort: 'low' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: fotoBase64 },
              },
              { type: 'text', text: INSTRUCAO },
            ],
          },
        ],
      }),
    });

    if (!resposta.ok) {
      const corpo = await resposta.text();
      return { estado: 'falha', motivo: `HTTP ${resposta.status}: ${corpo.slice(0, 180)}` };
    }

    const json = (await resposta.json()) as RespostaApi;
    const texto = (json.content ?? [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('\n');

    const conteudo = validar(extrairJson(texto));
    if (conteudo === null) return { estado: 'falha', motivo: 'resposta fora do formato esperado' };

    return { estado: 'ok', conteudo, ms: Date.now() - inicio };
  } catch (erro) {
    if (erro instanceof Error && erro.name === 'AbortError') return { estado: 'tempo-esgotado' };
    return { estado: 'falha', motivo: erro instanceof Error ? erro.message : 'erro desconhecido' };
  } finally {
    clearTimeout(relogio);
  }
}
