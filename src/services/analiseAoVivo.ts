/**
 * Modo ao vivo: le a foto capturada de verdade, em vez de usar o conteudo
 * simulado. Este e o UNICO ponto do aplicativo que toca a rede.
 *
 * ARQUITETURA: tres chamadas paralelas, e nao uma
 *
 * Medido contra a API real, sobre a mesma lousa:
 *
 *   so classificar (49 tokens de saida)     Sonnet 5   2,1s
 *   transcrever tudo (682 tokens de saida)  Sonnet 5   8,2s
 *
 * O gargalo e a GERACAO da resposta, nao a rede. A parte cara de gerar, que e a
 * transcricao inteira, e justamente a que aparece embaixo da tela, num card com
 * rolagem. Materia, tema e topico ficam no topo e sao os primeiros que alguem le.
 *
 * Entao o trabalho e dividido:
 *
 *   classificar   imagem de 768px  (~21 KB)   ~1,7s   -> preenche o topo da tela
 *   transcrever   imagem de 1568px (~250 KB)  ~8,2s   -> preenche o texto extraido
 *   estudar       imagem de 1568px (~250 KB)  ~8s     -> flashcards e questoes
 *
 * A terceira existe porque, sem ela, a revisao e as questoes mostravam sempre o
 * exemplo de Flexbox, fosse la o que estivesse na lousa. Ela e independente das
 * outras duas: se falhar, so os cartoes caem no exemplo.
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
import * as SecureStore from 'expo-secure-store';

import type { Flashcard, Questao } from '../data/mock';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const VERSAO_API = '2023-06-01';

/** Sonnet 5 e o ponto de equilibrio medido: classifica em ~2s e transcreve em
 *  ~8s, contra ~5s e ~11,5s do Opus 5, com a mesma leitura correta. */
const MODELO = 'claude-sonnet-5';

/** Teto de cada chamada. Generoso de proposito: nenhuma delas bloqueia a
 *  navegacao, entao esperar mais so aumenta a chance de o conteudo real chegar. */
export const LIMITE_CLASSIFICACAO_MS = 12000;
export const LIMITE_TRANSCRICAO_MS = 20000;
export const LIMITE_ESTUDO_MS = 20000;

/** Lado maior de cada imagem. A de transcricao usa 1568px porque e a faixa para
 *  a qual a API de visao ja reduz internamente. Mandar mais nao melhora nada. */
const PX_CLASSIFICACAO = 768;
const PX_TRANSCRICAO = 1568;
const QUALIDADE_ENVIO = 0.82;

/** Aulas salvas enviadas para a IA achar a relacionada. As mais recentes: e onde
 *  a continuacao de um assunto costuma estar, e a lista nao cresce sem fim. */
const MAX_AULAS_PARA_RELACIONAR = 30;

/** Se a foto pegou todo o conteudo escrito. Nao e sobre o tamanho da letra: a
 *  classificacao ve a foto reduzida. E sobre borda cortando, foco e reflexo. */
export type Leitura = 'completa' | 'parcial' | 'ilegivel';

/** Uma aula que o estudante ja fotografou e que esta foto continua. */
export type AulaRelacionada = { aulaId: string; motivo: string };

/** O que a classificacao recebe de cada aula salva para achar a relacionada. */
export type AulaParaRelacionar = { id: string; data: string; titulo: string; topico: string };

export type ClassificacaoAoVivo = {
  materia: string;
  tema: string;
  topico: string;
  /** Caminho de pasta onde a aula sera salva: [materia, subpasta]. */
  pasta: [string, string];
  /** true quando nenhuma pasta existente servia e uma nova foi proposta. */
  pastaNova: boolean;
  leitura: Leitura;
  /** O que faltou na foto e onde, numa frase. Vazio quando a leitura e completa. */
  problema: string;
  /** So aula que existe no acervo: o id devolvido e conferido contra a lista
   *  enviada, e o que nao bate e descartado. Nulo quando nada se relaciona. */
  relacionada: AulaRelacionada | null;
};

export type TranscricaoAoVivo = {
  textoExtraido: string;
  resumo: string[];
};

export type EstudoAoVivo = {
  flashcards: Flashcard[];
  questoes: Questao[];
};

export type Resultado<T> =
  | { estado: 'ok'; dados: T; ms: number }
  | { estado: 'sem-chave' }
  | { estado: 'sem-foto' }
  | { estado: 'tempo-esgotado' }
  | { estado: 'falha'; motivo: string };

/** O sub-modo escolhido na camera entra no prompt: lousa, slide e caderno tem
 *  problemas de leitura diferentes, e dizer qual e ajuda a leitura de verdade.
 *  Sem isso o seletor seria um controle decorativo, que o DESIGN.md proibe. */
const DICA_SUBMODO: Record<string, string> = {
  lousa: 'É a foto de uma lousa ou quadro branco, possivelmente com reflexo de janela e escrita à mão.',
  slide: 'É a foto de um slide projetado numa sala escura, possivelmente estourado de brilho.',
  caderno: 'É a foto de um caderno ou folha sobre a mesa, possivelmente com sombra e escrita à mão.',
};

/**
 * A classificacao faz tres trabalhos na mesma chamada de ~2 s, porque e a unica
 * que chega a tempo de mudar o que o estudante faz na hora:
 *
 * - onde salvar (materia, tema, topico e pasta);
 * - se a foto pegou tudo: com a resposta em 2 s ainda da para tirar outra antes
 *   de o professor apagar a lousa;
 * - qual aula ja fotografada esta foto continua, a memoria da camera.
 */
function promptClassificacao(
  subModo: string,
  pastas: string[],
  aulas: AulaParaRelacionar[]
): string {
  return [
    'Olhe esta foto de material de estudo de um estudante universitário brasileiro.',
    DICA_SUBMODO[subModo] ?? '',
    '',
    'Estas são as pastas que já existem no aplicativo dele:',
    ...pastas.map((p) => `- ${p}`),
    '',
    ...(aulas.length > 0
      ? [
          'Estas são aulas que ele já fotografou (id | data | título | assunto):',
          ...aulas.map((a) => `- ${a.id} | ${a.data} | ${a.titulo} | ${a.topico}`),
          '',
        ]
      : []),
    'Responda SOMENTE com JSON válido, sem cercas de código e sem texto ao redor:',
    '{"materia":"...","tema":"...","topico":"...","pasta":["...","..."],"pastaNova":false,"leitura":"completa","problema":"","relacionada":null,"motivo":""}',
    '',
    '- materia: a área de estudo em uma ou duas palavras. Ex.: Design, Programação, Matemática.',
    '- tema: a disciplina ou assunto maior.',
    '- topico: o assunto específico da imagem, em uma linha curta.',
    '- pasta: onde salvar, como caminho de exatamente dois níveis: [área, disciplina ou assunto maior].',
    '  Se UMA das pastas existentes acima couber para este conteúdo, repita exatamente',
    '  os nomes dela, separando os níveis no array, e devolva pastaNova como false.',
    '  Só proponha nomes novos quando nenhuma das existentes fizer sentido. Nesse',
    '  caso devolva pastaNova como true.',
    '- leitura: "completa" se todo o conteúdo escrito aparece inteiro na foto; "parcial" se',
    '  parte dele ficou cortada pela borda da foto, fora de foco, escondida por reflexo ou por',
    '  alguém na frente; "ilegivel" se quase nada dá para ler. Não julgue pelo tamanho da',
    '  letra: esta imagem foi reduzida de propósito.',
    '- problema: vazio se a leitura é completa. Senão, uma frase curta dizendo o que faltou e',
    '  onde. Ex.: "A parte de baixo da lousa ficou cortada."',
    '- relacionada: o id de UMA aula da lista acima cujo conteúdo esta foto continua, aprofunda',
    '  ou usa como base. A relação tem de ser de conteúdo, e não só a mesma matéria. Se nenhuma',
    '  servir, ou se não houver lista, null.',
    '- motivo: vazio se relacionada é null. Senão, uma frase curta com a relação entre os dois',
    '  conteúdos.',
    '',
    'Tudo em português do Brasil.',
  ]
    .filter((l) => l !== '')
    .join('\n');
}

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

const PROMPT_ESTUDO = [
  'Esta é a foto de uma lousa, slide ou caderno de aula. Crie material de revisão SOMENTE com o que está na imagem.',
  '',
  'Responda SOMENTE com JSON válido, sem cercas de código e sem texto ao redor:',
  '{"flashcards":[{"p":"pergunta","r":"resposta"}],"questoes":[{"q":"enunciado","alt":["a","b","c","d"],"certa":0}]}',
  '',
  '- flashcards: de 5 a 8 cartões. Pergunta curta na frente, resposta de uma ou duas frases no verso.',
  '- questoes: 3 questões de múltipla escolha, cada uma com exatamente 4 alternativas plausíveis,',
  '  e "certa" é o índice (0 a 3) da alternativa correta. Varie a posição da correta.',
  '',
  'Tudo em português do Brasil. Não invente conteúdo que não está na imagem.',
].join('\n');

type BlocoTexto = { type: string; text?: string };
type RespostaApi = { content?: BlocoTexto[] };

/**
 * A chave mora no cofre do aparelho (Keychain no iPhone), colada uma vez em
 * Ajustes. Ela nao vem mais do .env: variavel EXPO_PUBLIC entra no pacote que
 * o computador serve pela rede, e qualquer um no mesmo Wi-Fi conseguiria ler.
 * Assim a chave tambem nao depende de qual computador roda o servidor.
 */
const CHAVE_NO_COFRE = 'jovi-flow.chave-anthropic';

let chaveGuardada: string | null = null;

async function cofreDisponivel(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Le a chave do cofre para a memoria. Chamado uma vez, na abertura do app. */
/**
 * A chave sem nada que a colagem tenha trazido junto.
 *
 * Espaco, quebra de linha e caractere invisivel no meio da chave viram valor
 * invalido de cabecalho HTTP, e o fetch nem sai do aparelho: o app dizia "nao
 * deu para falar com a Anthropic" sem nunca ter falado com ninguem. Chave da
 * Anthropic e so texto ASCII visivel, entao o resto sai fora.
 */
function limparChave(valor: string): string {
  return valor.replace(/[^!-~]/g, '');
}

/** Diz no log o tamanho e o comeco da chave, nunca o conteudo dela. */
function registrarChave(origem: string, bruta: string, limpa: string): void {
  const sujeira = bruta.length - limpa.length;
  console.log(
    `[JOVI Flow] chave ${origem}: ${limpa.length} caracteres` +
      `${sujeira > 0 ? `, ${sujeira} invisiveis removidos` : ''}` +
      `, ${limpa.startsWith('sk-ant-') ? 'comeca com sk-ant-' : 'SEM o comeco sk-ant-'}`
  );
}

export async function carregarChaveGuardada(): Promise<boolean> {
  try {
    if (await cofreDisponivel()) {
      const valor = await SecureStore.getItemAsync(CHAVE_NO_COFRE);
      const limpa = valor === null ? '' : limparChave(valor);
      chaveGuardada = limpa.length > 0 ? limpa : null;
      if (valor !== null) registrarChave('do cofre', valor, limpa);
    }
  } catch (erro) {
    console.log('[JOVI Flow] nao deu para ler a chave do cofre:', erro);
  }
  return chaveGuardada !== null;
}

/** Guarda a chave. Devolve se ela ficou no cofre ou so na memoria: sem cofre
 *  (no navegador, por exemplo) ela vale ate o app fechar. */
export async function guardarChave(valor: string): Promise<'cofre' | 'memoria'> {
  chaveGuardada = limparChave(valor);
  registrarChave('colada', valor, chaveGuardada);
  try {
    if (await cofreDisponivel()) {
      await SecureStore.setItemAsync(CHAVE_NO_COFRE, chaveGuardada);
      return 'cofre';
    }
  } catch (erro) {
    console.log('[JOVI Flow] nao deu para gravar a chave no cofre:', erro);
  }
  return 'memoria';
}

export async function esquecerChave(): Promise<void> {
  chaveGuardada = null;
  try {
    if (await cofreDisponivel()) await SecureStore.deleteItemAsync(CHAVE_NO_COFRE);
  } catch (erro) {
    console.log('[JOVI Flow] nao deu para apagar a chave do cofre:', erro);
  }
}

function chaveAtual(): string | null {
  return chaveGuardada;
}

export function temChaveConfigurada(): boolean {
  return chaveAtual() !== null;
}

export type Verificacao =
  | 'valida'
  | 'recusada'
  /** A chave vale, mas a conta nao tem credito para gastar. */
  | 'sem-credito'
  | 'indisponivel'
  | 'sem-chave';

/** Teto do teste da chave. A lista de modelos responde em menos de meio segundo
 *  numa rede boa; 15 s cobre rede de evento sem o teste morrer antes da hora. */
const LIMITE_TESTE_MS = 15000;

/**
 * Confere a chave com a Anthropic sem gastar nada: listar modelos nao consome
 * token. Serve para descobrir antes da apresentacao, e nao no palco, que a
 * chave foi revogada ou digitada errada.
 */
export async function verificarChave(): Promise<Verificacao> {
  const chave = chaveAtual();
  if (chave === null) return 'sem-chave';

  const controlador = new AbortController();
  const relogio = setTimeout(() => controlador.abort(), LIMITE_TESTE_MS);
  const inicio = Date.now();
  try {
    // O teste faz a MESMA chamada do app, com a resposta mais curta possivel.
    // Antes ele pedia a lista de modelos, e ela exige o cabecalho de workspace
    // quando a chave nao esta presa a um: chave boa era reprovada por isso.
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
        max_tokens: 1,
        messages: [{ role: 'user', content: 'oi' }],
      }),
    });
    // O motivo vai para o log: a tela tem espaco para uma frase, e o log tem a
    // resposta da Anthropic inteira.
    const corpo = r.ok ? '' : (await r.text().catch(() => '')).slice(0, 200);
    console.log(
      `[JOVI Flow] teste da chave: HTTP ${r.status} em ${Date.now() - inicio}ms${corpo ? ` · ${corpo}` : ''}`
    );
    if (r.ok) return 'valida';
    if (r.status === 401 || r.status === 403) return 'recusada';
    if (/credit balance|insufficient|billing/i.test(corpo)) return 'sem-credito';
    return 'indisponivel';
  } catch (erro) {
    const demorou = Date.now() - inicio >= LIMITE_TESTE_MS;
    console.log(
      `[JOVI Flow] teste da chave falhou em ${Date.now() - inicio}ms:`,
      demorou ? `passou de ${LIMITE_TESTE_MS}ms e foi cancelado` : erro
    );
    return 'indisponivel';
  } finally {
    clearTimeout(relogio);
  }
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
  const chave = chaveAtual();
  if (chave === null) {
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
        // varios segundos sem prejudicar a leitura. Medido.
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
 * conexao com frequencia, e uma segunda tentativa imediata costuma passar,
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

function semAcento(t: string): string {
  return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export async function classificarCaptura(
  b64: string | null,
  subModo: string,
  pastas: string[],
  aulasSalvas: AulaParaRelacionar[]
): Promise<Resultado<ClassificacaoAoVivo>> {
  if (b64 === null || b64.length === 0) return { estado: 'sem-foto' };

  const aulas = aulasSalvas.slice(0, MAX_AULAS_PARA_RELACIONAR);
  const r = await chamarComRetentativa(
    b64,
    promptClassificacao(subModo, pastas, aulas),
    600,
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

  const pastaBruta = Array.isArray(o.pasta) ? o.pasta.map(texto).filter((n) => n.length > 0) : [];
  const temaFinal = tema === '' ? materia : tema;
  // Sempre dois niveis. Se a IA mandou tres, o terceiro era o tema, que ja vai
  // no titulo da aula; se mandou um so, a subpasta e o proprio tema.
  const pasta: [string, string] =
    pastaBruta.length >= 2
      ? [pastaBruta[0] ?? materia, pastaBruta[1] ?? temaFinal]
      : [materia, temaFinal];

  // Qualquer coisa fora de "parcial" e "ilegivel" conta como completa: na
  // duvida, o app nao manda o estudante tirar outra foto.
  const leituraBruta = semAcento(texto(o.leitura));
  const leitura: Leitura =
    leituraBruta === 'parcial' || leituraBruta === 'ilegivel' ? leituraBruta : 'completa';

  // A memoria so aponta para aula que existe: id fora da lista e descartado.
  const idRelacionada = texto(o.relacionada);
  const motivo = texto(o.motivo);
  const relacionada =
    motivo !== '' && aulas.some((a) => a.id === idRelacionada)
      ? { aulaId: idRelacionada, motivo }
      : null;

  return {
    estado: 'ok',
    ms: r.ms,
    dados: {
      materia,
      tema: temaFinal,
      topico: topico === '' ? temaFinal : topico,
      pasta,
      pastaNova: o.pastaNova === true,
      leitura,
      problema: leitura === 'completa' ? '' : texto(o.problema),
      relacionada,
    },
  };
}

export async function transcreverCaptura(
  b64: string | null,
  subModo: string
): Promise<Resultado<TranscricaoAoVivo>> {
  if (b64 === null || b64.length === 0) return { estado: 'sem-foto' };

  const dica = DICA_SUBMODO[subModo];
  const prompt = dica === undefined ? PROMPT_TRANSCRICAO : `${dica}

${PROMPT_TRANSCRICAO}`;

  const r = await chamarComRetentativa(b64, prompt, 2000, LIMITE_TRANSCRICAO_MS);
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

export async function gerarEstudo(
  b64: string | null,
  subModo: string
): Promise<Resultado<EstudoAoVivo>> {
  if (b64 === null || b64.length === 0) return { estado: 'sem-foto' };

  const dica = DICA_SUBMODO[subModo];
  const prompt = dica === undefined ? PROMPT_ESTUDO : `${dica}\n\n${PROMPT_ESTUDO}`;

  const r = await chamarComRetentativa(b64, prompt, 2000, LIMITE_ESTUDO_MS);
  if (!r.ok) return r.resultado;

  const d = extrairJson(r.texto);
  if (typeof d !== 'object' || d === null) {
    return { estado: 'falha', motivo: 'resposta fora do formato' };
  }
  const o = d as Record<string, unknown>;

  const flashcards: Flashcard[] = Array.isArray(o.flashcards)
    ? o.flashcards
        .map((f) => {
          const x = (typeof f === 'object' && f !== null ? f : {}) as Record<string, unknown>;
          return { p: texto(x.p), r: texto(x.r) };
        })
        .filter((f) => f.p !== '' && f.r !== '')
    : [];

  const questoes: Questao[] = Array.isArray(o.questoes)
    ? o.questoes
        .map((q) => {
          const x = (typeof q === 'object' && q !== null ? q : {}) as Record<string, unknown>;
          const alt = Array.isArray(x.alt) ? x.alt.map(texto).filter((a) => a !== '') : [];
          const certa = typeof x.certa === 'number' ? Math.trunc(x.certa) : -1;
          return { q: texto(x.q), alt, certa };
        })
        .filter((q) => q.q !== '' && q.alt.length === 4 && q.certa >= 0 && q.certa < 4)
    : [];

  if (flashcards.length === 0 && questoes.length === 0) {
    return { estado: 'falha', motivo: 'material vazio' };
  }
  return { estado: 'ok', ms: r.ms, dados: { flashcards, questoes } };
}
