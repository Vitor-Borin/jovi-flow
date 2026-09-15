/**
 * Acervo do estudante: as pastas e as aulas capturadas.
 *
 * Ate a Sprint 3 a biblioteca era uma lista fixa no codigo, e a captura nova era
 * inserida por calculo na hora de desenhar a tela. Duas fotos viravam uma aula,
 * renomear nao renomeava e fechar o app zerava tudo. Agora o acervo e estado de
 * verdade, gravado no aparelho (ver store/AcervoContext), e este arquivo guarda
 * os tipos, as funcoes puras e o conteudo de exemplo da primeira abertura.
 */

import type { Flashcard, NomeIcone, Questao } from './mock';
import { aulaAgora } from './mock';

/** Uma foto dentro de uma aula. Uma aula pode ter varias: a sessao pela grade
 *  junta as fotos tiradas durante a mesma aula do horario. */
export type Pagina = {
  id: string;
  /** Caminho da foto copiada para o diretorio de documentos. Nulo nas aulas de
   *  exemplo e quando a camera nao estava disponivel. */
  fotoUri: string | null;
  hora: string;
  subModo: string;
  textoExtraido: string;
};

/** Como esta aula foi agrupada.
 *
 *  `grade`: a foto foi tirada durante uma aula do horario do estudante, e a
 *  chave e o dia mais o slot. `livre`: fora do horario, vale a mesma pasta no
 *  mesmo dia com pouco tempo entre as fotos. */
export type Sessao =
  | {
      tipo: 'grade';
      chave: string;
      disciplina: string;
      sala: string;
      remoto: boolean;
      inicio: string;
      fim: string;
    }
  | { tipo: 'livre'; chave: string };

export type Aula = {
  id: string;
  titulo: string;
  materia: string;
  tema: string;
  topico: string;
  /** [materia da pasta, subpasta]. Dois niveis, sempre. */
  pasta: [string, string];
  /** dd/mm/aaaa da primeira pagina. */
  data: string;
  /** hh:mm da primeira pagina. */
  hora: string;
  criadaEm: number;
  atualizadaEm: number;
  sessao: Sessao | null;
  paginas: Pagina[];
  resumo: string[];
  flashcards: Flashcard[];
  questoes: Questao[];
  /** true quando o conteudo foi lido da foto pela IA, e nao do exemplo. */
  aoVivo: boolean;
  resumoSalvo: boolean;
};

export type PastaDef = { materia: string; nome: string; icone: NomeIcone };

export type Acervo = { pastas: PastaDef[]; aulas: Aula[] };

/** Arvore derivada para a aba Estudos: materia > subpasta > aulas. */
export type Subpasta = { nome: string; aulas: Aula[] };
export type Pasta = { nome: string; icone: NomeIcone; subpastas: Subpasta[] };

/** Duas fotos fora do horario da grade contam como a mesma aula se cairem na
 *  mesma pasta, no mesmo dia, com menos de meia hora entre elas. */
export const MS_SESSAO_LIVRE = 30 * 60 * 1000;

/* ---------------------------------------------------------------- utilidades */

export function idNovo(prefixo: string): string {
  return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const dois = (n: number) => String(n).padStart(2, '0');

export function dataBR(d: Date): string {
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function horaBR(d: Date): string {
  return `${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

export function dataISO(d: Date): string {
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

/** Encurta o topico para caber num titulo de aula. "Flexbox: eixos, alinhamento
 *  e distribuicao" vira "Flexbox". */
export function tituloDaCaptura(topico: string): string {
  const corte = topico.split(/[:.]/)[0] ?? topico;
  const limpo = corte.trim();
  return limpo.length > 32 ? `${limpo.slice(0, 32).trimEnd()}...` : limpo;
}

export function mesmaPasta(a: [string, string], b: [string, string]): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/** Texto de todas as paginas, com um separador quando ha mais de uma. */
export function textoDaAula(aula: Aula): string {
  if (aula.paginas.length <= 1) return aula.paginas[0]?.textoExtraido ?? '';
  return aula.paginas
    .map((p, i) => `— Página ${i + 1} · ${p.hora} —\n${p.textoExtraido}`)
    .join('\n\n');
}

export function ordenarAulas(aulas: Aula[]): Aula[] {
  return [...aulas].sort((a, b) => b.atualizadaEm - a.atualizadaEm);
}

function normalizar(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/** Icone da pasta pela area de estudo. Serve para a pasta que a IA cria numa
 *  captura de assunto novo nascer com um icone que faz sentido. */
export function iconeDaMateria(materia: string): NomeIcone {
  const m = normalizar(materia);
  if (m.includes('design')) return 'palette-outline';
  if (m.includes('programa') || m.includes('python') || m.includes('web')) return 'code-tags';
  if (m.includes('matem') || m.includes('calc')) return 'function-variant';
  if (m.includes('sistema') || m.includes('rede') || m.includes('edge')) return 'server-outline';
  if (m.includes('negoc') || m.includes('empreend')) return 'briefcase-outline';
  if (m.includes('engenharia') || m.includes('software')) return 'cog-outline';
  if (m.includes('fisic')) return 'atom';
  if (m.includes('quimic')) return 'flask-outline';
  if (m.includes('biolog')) return 'leaf';
  if (m.includes('hist') || m.includes('geograf')) return 'earth';
  return 'folder-outline';
}

/** Materia > subpasta > aulas, na ordem em que as pastas foram criadas e com as
 *  aulas mais recentes primeiro. Aula cuja pasta nao existe na lista de pastas
 *  (nao deveria acontecer) ainda aparece, para nada sumir da tela. */
export function arvore(acervo: Acervo): Pasta[] {
  const pastas: Pasta[] = [];
  const garantir = (materia: string, sub: string, icone: NomeIcone): Subpasta => {
    let pasta = pastas.find((p) => p.nome === materia);
    if (!pasta) {
      pasta = { nome: materia, icone, subpastas: [] };
      pastas.push(pasta);
    }
    let subpasta = pasta.subpastas.find((s) => s.nome === sub);
    if (!subpasta) {
      subpasta = { nome: sub, aulas: [] };
      pasta.subpastas.push(subpasta);
    }
    return subpasta;
  };

  acervo.pastas.forEach((p) => garantir(p.materia, p.nome, p.icone));
  ordenarAulas(acervo.aulas).forEach((aula) => {
    garantir(aula.pasta[0], aula.pasta[1], iconeDaMateria(aula.pasta[0])).aulas.push(aula);
  });
  return pastas;
}

/** "Materia › Subpasta" de cada pasta. Vai no prompt de classificacao para a IA
 *  reaproveitar uma pasta em vez de inventar um nome novo a cada captura. */
export function caminhosExistentes(acervo: Acervo): string[] {
  return arvore(acervo).flatMap((p) => p.subpastas.map((s) => `${p.nome} › ${s.nome}`));
}

export function contarAulas(acervo: Acervo): number {
  return acervo.aulas.length;
}

export function contarMaterias(acervo: Acervo): number {
  return arvore(acervo).length;
}

/* ------------------------------------------------------------------ sessao */

/** A sessao em que uma captura feita agora cairia. */
export function sessaoDeAgora(pasta: [string, string], agora = new Date()): Sessao {
  const slot = aulaAgora(agora);
  if (slot) {
    return {
      tipo: 'grade',
      chave: `grade:${dataISO(agora)}:${slot.dia}-${slot.inicio}`,
      disciplina: slot.disciplina,
      sala: slot.sala,
      remoto: slot.remoto === true,
      inicio: slot.inicio,
      fim: slot.fim,
    };
  }
  return { tipo: 'livre', chave: `livre:${dataISO(agora)}:${pasta[0]}/${pasta[1]}` };
}

/** A aula ja existente que receberia esta captura como pagina nova, ou nulo.
 *
 *  Regra: mesma chave de sessao e mesma pasta. A pasta entra na regra porque o
 *  estudante pode ter trocado o destino na tela Organizar, e nesse caso ele
 *  quer uma aula separada, nao uma pagina a mais. Na sessao livre vale tambem
 *  o limite de tempo. */
export function aulaDaSessao(
  acervo: Acervo,
  sessao: Sessao,
  pasta: [string, string],
  agora = new Date()
): Aula | null {
  const candidata = acervo.aulas.find(
    (a) => a.sessao?.chave === sessao.chave && mesmaPasta(a.pasta, pasta)
  );
  if (!candidata) return null;
  if (sessao.tipo === 'livre' && agora.getTime() - candidata.atualizadaEm > MS_SESSAO_LIVRE) {
    return null;
  }
  return candidata;
}

/* --------------------------------------------------------- conteudo inicial */

/**
 * O acervo da primeira abertura. Cinco aulas de exemplo com conteudo completo,
 * para as pastas nao estarem vazias e para toda aula aberta ter resumo, cartoes
 * e questoes. As datas e as disciplinas batem com a grade real do estudante.
 */
type Exemplo = {
  id: string;
  titulo: string;
  materia: string;
  tema: string;
  topico: string;
  pasta: [string, string];
  data: string;
  hora: string;
  texto: string;
  resumo: string[];
  flashcards: Flashcard[];
  questoes: Questao[];
};

const EXEMPLOS: Exemplo[] = [
  {
    id: 'ex-grid',
    titulo: 'Grid e Bento Layout · Aula 14/08',
    materia: 'Design',
    tema: 'Front-End Design · Layout',
    topico: 'CSS Grid: linhas, colunas e o bento layout',
    pasta: ['Design', 'Front-End Design'],
    data: '14/08/2026',
    hora: '19:38',
    texto: [
      'CSS GRID',
      '',
      '.container { display: grid }',
      'grid-template-columns: 1fr 2fr 1fr',
      'gap: 16px',
      '',
      'BENTO -> blocos de tamanhos diferentes',
      '.destaque { grid-column: span 2 }',
      '.alto { grid-row: span 2 }',
      '',
      'minmax(200px, 1fr)  ->  coluna segura',
    ].join('\n'),
    resumo: [
      'CSS Grid é um modelo de layout de duas dimensões: define linhas e colunas ao mesmo tempo, diferente do Flexbox.',
      'grid-template-columns declara as colunas; a unidade fr divide o espaço que sobra em frações proporcionais.',
      'Bento layout é uma grade de blocos de tamanhos diferentes, feita com grid-column: span e grid-row: span.',
      'gap dá o respiro entre os blocos sem usar margin, e minmax() mantém cada coluna dentro de um intervalo seguro.',
    ],
    flashcards: [
      { p: 'Qual a diferença central entre Grid e Flexbox?', r: 'Grid trabalha em duas dimensões (linhas e colunas). Flexbox trabalha em uma só.' },
      { p: 'O que a unidade fr faz?', r: 'Divide o espaço que sobra no container em frações proporcionais entre as colunas.' },
      { p: 'Como um bloco ocupa duas colunas num bento?', r: 'Com grid-column: span 2 no próprio item.' },
    ],
    questoes: [
      {
        q: 'Qual propriedade define as colunas de uma grade?',
        alt: ['grid-gap', 'grid-template-columns', 'flex-direction', 'grid-area'],
        certa: 1,
      },
      {
        q: 'O que minmax(200px, 1fr) garante?',
        alt: [
          'Que a coluna some abaixo de 200px',
          'Que a coluna nunca fica menor que 200px nem maior que uma fração',
          'Que a coluna tem sempre 200px',
          'Que a grade vira Flexbox',
        ],
        certa: 1,
      },
    ],
  },
  {
    id: 'ex-tipografia',
    titulo: 'Tipografia e escala · Aula 07/08',
    materia: 'Design',
    tema: 'Front-End Design · Tipografia',
    topico: 'Escala tipográfica, hierarquia e legibilidade',
    pasta: ['Design', 'Front-End Design'],
    data: '07/08/2026',
    hora: '19:26',
    texto: [
      'TIPOGRAFIA',
      '',
      'escala modular: 16 -> 20 -> 25 -> 31 (x1.25)',
      'line-height: 1.4 a 1.6 no corpo',
      'medida ideal: 45 a 75 caracteres por linha',
      '',
      'hierarquia = tamanho + peso + espaço',
      'no maximo 2 familias por interface',
    ].join('\n'),
    resumo: [
      'Uma escala tipográfica define os tamanhos de texto por uma razão fixa, em vez de números soltos.',
      'A altura de linha do corpo fica entre 1,4 e 1,6 para o texto respirar sem se soltar.',
      'A medida ideal de uma linha é de 45 a 75 caracteres; mais que isso cansa o olho.',
      'Hierarquia nasce da combinação de tamanho, peso e espaço, e não só de aumentar a fonte.',
    ],
    flashcards: [
      { p: 'O que é uma escala modular?', r: 'Uma sequência de tamanhos de fonte gerada por uma razão fixa, como 1,25.' },
      { p: 'Qual a medida ideal de uma linha de texto?', r: 'Entre 45 e 75 caracteres.' },
      { p: 'Quantas famílias tipográficas por interface?', r: 'No máximo duas.' },
    ],
    questoes: [
      {
        q: 'Qual altura de linha é recomendada para texto corrido?',
        alt: ['0,8 a 1,0', '1,4 a 1,6', '2,0 a 2,5', 'Sempre 1,0'],
        certa: 1,
      },
      {
        q: 'O que cria hierarquia tipográfica?',
        alt: ['Só o tamanho', 'Só a cor', 'Tamanho, peso e espaço', 'Só o itálico'],
        certa: 2,
      },
    ],
  },
  {
    id: 'ex-listas',
    titulo: 'Listas e repetição · Aula 20/08',
    materia: 'Programação',
    tema: 'Computational Thinking with Python',
    topico: 'Listas, for e while em Python',
    pasta: ['Programação', 'Computational Thinking with Python'],
    data: '20/08/2026',
    hora: '21:32',
    texto: [
      'LISTAS',
      'notas = [7.5, 8.0, 6.5]',
      'notas.append(9.0)',
      'len(notas) -> 4',
      '',
      'for n in notas:',
      '    print(n)',
      '',
      'while i < len(notas):',
      '    i += 1',
    ].join('\n'),
    resumo: [
      'Lista é uma coleção ordenada e mutável: aceita adicionar, remover e trocar itens.',
      'append adiciona no fim; len devolve quantos itens existem.',
      'for percorre cada item da lista sem precisar de índice.',
      'while repete enquanto a condição for verdadeira, e precisa de algo que a torne falsa um dia.',
    ],
    flashcards: [
      { p: 'O que append faz?', r: 'Adiciona um item no fim da lista.' },
      { p: 'Quando usar for em vez de while?', r: 'Quando você já sabe sobre o que vai iterar, como cada item de uma lista.' },
      { p: 'O que acontece se a condição do while nunca vira falsa?', r: 'Laço infinito.' },
    ],
    questoes: [
      {
        q: 'Qual função devolve o tamanho de uma lista?',
        alt: ['size()', 'count()', 'len()', 'length()'],
        certa: 2,
      },
      {
        q: 'O que notas.append(9.0) faz?',
        alt: ['Substitui o primeiro item', 'Adiciona 9.0 no fim', 'Remove o 9.0', 'Ordena a lista'],
        certa: 1,
      },
    ],
  },
  {
    id: 'ex-decisao',
    titulo: 'Estruturas de decisão · Aula 19/08',
    materia: 'Programação',
    tema: 'Computational Thinking with Python',
    topico: 'if, elif e else',
    pasta: ['Programação', 'Computational Thinking with Python'],
    data: '19/08/2026',
    hora: '21:28',
    texto: [
      'DECISAO',
      '',
      'if media >= 7:',
      '    print("aprovado")',
      'elif media >= 5:',
      '    print("recuperacao")',
      'else:',
      '    print("reprovado")',
      '',
      'and / or / not',
    ].join('\n'),
    resumo: [
      'if testa uma condição e executa o bloco só quando ela é verdadeira.',
      'elif encadeia outras condições; a primeira verdadeira vence e as demais são ignoradas.',
      'else cobre tudo o que não caiu em nenhuma condição anterior.',
      'and, or e not combinam condições; a ordem dos testes muda o resultado.',
    ],
    flashcards: [
      { p: 'Quando o else executa?', r: 'Quando nenhuma condição anterior foi verdadeira.' },
      { p: 'O que acontece se duas condições do elif forem verdadeiras?', r: 'Só a primeira executa.' },
      { p: 'O que not faz?', r: 'Inverte o valor lógico da condição.' },
    ],
    questoes: [
      {
        q: 'Com media = 6, qual mensagem aparece no código da lousa?',
        alt: ['aprovado', 'recuperacao', 'reprovado', 'Nenhuma'],
        certa: 1,
      },
      {
        q: 'Qual operador exige que as duas condições sejam verdadeiras?',
        alt: ['or', 'not', 'and', 'elif'],
        certa: 2,
      },
    ],
  },
  {
    id: 'ex-modelagem',
    titulo: 'Modelagem de problemas · Aula 19/08',
    materia: 'Matemática',
    tema: 'Differentiated Problem Solving',
    topico: 'Traduzir um problema em variáveis e restrições',
    pasta: ['Matemática', 'Differentiated Problem Solving'],
    data: '19/08/2026',
    hora: '19:41',
    texto: [
      'MODELAGEM',
      '',
      '1. o que se pede?  -> variavel',
      '2. o que se sabe?  -> dados',
      '3. o que limita?   -> restricoes',
      '',
      'Ex.: 2x + 3y = 120, x >= 0, y >= 0',
      'validar: a resposta faz sentido no contexto?',
    ].join('\n'),
    resumo: [
      'Modelar é traduzir o enunciado em variáveis, dados conhecidos e restrições antes de calcular.',
      'A pergunta do problema vira a variável; o que está no enunciado vira dado; o que limita vira restrição.',
      'Toda resposta precisa ser validada de volta no contexto: quantidade negativa ou fracionada pode não fazer sentido.',
      'Um modelo bom é o mais simples que ainda representa o problema.',
    ],
    flashcards: [
      { p: 'Qual o primeiro passo da modelagem?', r: 'Identificar o que se pede e transformar em variável.' },
      { p: 'O que é uma restrição?', r: 'Um limite que a solução precisa respeitar, como x maior ou igual a zero.' },
      { p: 'Por que validar a resposta no contexto?', r: 'Porque um número correto na conta pode não fazer sentido no problema real.' },
    ],
    questoes: [
      {
        q: 'No modelo 2x + 3y = 120 com x, y ≥ 0, o que x ≥ 0 representa?',
        alt: ['Um dado', 'Uma restrição', 'A resposta', 'Uma variável'],
        certa: 1,
      },
      {
        q: 'O que fazer depois de resolver a equação?',
        alt: ['Nada', 'Validar se faz sentido no contexto', 'Trocar as variáveis', 'Refazer o enunciado'],
        certa: 1,
      },
    ],
  },
];

function paraTimestamp(data: string, hora: string): number {
  const [d = 1, m = 1, a = 2026] = data.split('/').map(Number);
  const [h = 0, mi = 0] = hora.split(':').map(Number);
  return new Date(a, m - 1, d, h, mi).getTime();
}

export function acervoInicial(): Acervo {
  const pastas: PastaDef[] = [
    { materia: 'Design', nome: 'Front-End Design', icone: 'palette-outline' },
    { materia: 'Programação', nome: 'Computational Thinking with Python', icone: 'code-tags' },
    { materia: 'Matemática', nome: 'Differentiated Problem Solving', icone: 'function-variant' },
  ];
  const aulas: Aula[] = EXEMPLOS.map((e) => {
    const t = paraTimestamp(e.data, e.hora);
    return {
      id: e.id,
      titulo: e.titulo,
      materia: e.materia,
      tema: e.tema,
      topico: e.topico,
      pasta: e.pasta,
      data: e.data,
      hora: e.hora,
      criadaEm: t,
      atualizadaEm: t,
      sessao: null,
      paginas: [{ id: `${e.id}-p1`, fotoUri: null, hora: e.hora, subModo: 'lousa', textoExtraido: e.texto }],
      resumo: e.resumo,
      flashcards: e.flashcards,
      questoes: e.questoes,
      aoVivo: false,
      resumoSalvo: true,
    };
  });
  return { pastas, aulas };
}

/** Confere o que veio do armazenamento antes de usar. Formato estranho vale
 *  como acervo ausente: melhor recomecar dos exemplos do que quebrar a tela. */
export function acervoValido(v: unknown): v is Acervo {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.pastas) || !Array.isArray(o.aulas)) return false;
  return o.aulas.every((a) => {
    if (typeof a !== 'object' || a === null) return false;
    const x = a as Record<string, unknown>;
    return (
      typeof x.id === 'string' &&
      typeof x.titulo === 'string' &&
      Array.isArray(x.pasta) &&
      x.pasta.length === 2 &&
      Array.isArray(x.paginas) &&
      Array.isArray(x.resumo) &&
      Array.isArray(x.flashcards) &&
      Array.isArray(x.questoes)
    );
  });
}
