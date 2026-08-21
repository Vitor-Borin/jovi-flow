/**
 * Camada de dados simulada do JOVI Flow.
 * Nada aqui chama rede: o prototipo roda 100% offline por decisao de projeto,
 * para que a demonstracao na banca nao dependa do Wi-Fi do campus.
 */

// Import de tipo apenas: nao gera require em tempo de execucao, o que mantem esta
// camada de dados pura e testavel fora do bundle.
import type { MaterialCommunityIcons } from '@expo/vector-icons';

/** Nome de icone valido. Substitui os emoji do plano original — ver DESIGN.md. */
export type NomeIcone = keyof typeof MaterialCommunityIcons.glyphMap;

export type Slot = {
  dia: number; // 0 = domingo
  inicio: string;
  fim: string;
  /** Area de estudo. E o primeiro nivel da arvore de pastas. */
  materia: string;
  /** Nome da disciplina como aparece no cronograma da faculdade. */
  disciplina: string;
  sala: string;
  /** Aula remota nao tem sala fisica. */
  remoto?: boolean;
};

/** Diferencial: a grade horaria do estudante da contexto a camera.
 *  O Flow nao adivinha a materia — ele confirma com o horario. */
/**
 * Grade real do Vitor — Engenharia de Software, FIAP Paulista, noturno.
 * Copiada do cronograma de aulas da faculdade, sem inventar horario nem sala.
 * E o que torna a confirmacao por contexto verificavel por qualquer pessoa na
 * sala no dia da apresentacao.
 */
export const gradeHoraria: Slot[] = [
  { dia: 1, inicio: '19:20', fim: '21:00', materia: 'Negócios', disciplina: 'Storytelling e Inspiração Empreendedora', sala: 'Remoto', remoto: true },
  { dia: 1, inicio: '21:15', fim: '22:55', materia: 'Engenharia de Software', disciplina: 'Software & Total Experience Design', sala: 'Remoto', remoto: true },

  { dia: 2, inicio: '19:20', fim: '21:00', materia: 'Desenvolvimento', disciplina: 'Web Development', sala: 'LAB 405' },
  { dia: 2, inicio: '21:15', fim: '22:55', materia: 'Sistemas', disciplina: 'Edge Computing & Computer Systems', sala: 'LAB 405' },

  { dia: 3, inicio: '19:20', fim: '21:00', materia: 'Matemática', disciplina: 'Differentiated Problem Solving', sala: 'LAB 302' },
  { dia: 3, inicio: '21:15', fim: '22:55', materia: 'Programação', disciplina: 'Computational Thinking with Python', sala: 'LAB 302' },

  { dia: 4, inicio: '19:20', fim: '21:00', materia: 'Design', disciplina: 'Front-End Design', sala: 'LAB 402' },
  { dia: 4, inicio: '21:15', fim: '22:55', materia: 'Programação', disciplina: 'Computational Thinking with Python', sala: 'LAB 402' },
];

/** Slot usado fora de horario de aula: quinta, Front-End Design — o mesmo da
 *  apresentacao, para o card seguir coerente se o horario escorregar. */
const SLOT_PADRAO: Slot = {
  dia: 4,
  inicio: '19:20',
  fim: '21:00',
  materia: 'Design',
  disciplina: 'Front-End Design',
  sala: 'LAB 402',
};

/** Sempre devolve um slot para a demo funcionar em qualquer dia/hora. */
export function slotAtual(agora = new Date()): { slot: Slot; aoVivo: boolean } {
  const dia = agora.getDay();
  const min = agora.getHours() * 60 + agora.getMinutes();
  const toMin = (h: string) => {
    const [horas = 0, minutos = 0] = h.split(':').map(Number);
    return horas * 60 + minutos;
  };
  const emAula = gradeHoraria.find(
    (s) => s.dia === dia && min >= toMin(s.inicio) && min <= toMin(s.fim)
  );
  if (emAula) return { slot: emAula, aoVivo: true };
  return { slot: SLOT_PADRAO, aoVivo: false };
}

export type Etapa = { id: string; label: string; detalhe: string };

/** Etapas de otimizacao da CAMERA (antes da IA).
 *  E o que amarra o projeto ao brief da JOVI: o Modo Aula muda como a camera captura. */
export const etapasCamera: Etapa[] = [
  { id: 'frames', label: 'Combinando 4 frames', detalhe: 'Reduz ruído e tremida' },
  { id: 'reflexo', label: 'Suprimindo reflexo', detalhe: 'Remove brilho do quadro' },
  { id: 'deskew', label: 'Corrigindo perspectiva', detalhe: 'Deixa a lousa reta' },
  { id: 'texto', label: 'Realçando traço de caneta', detalhe: 'Contraste otimizado' },
];

export type Chip = { id: string; icone: NomeIcone; label: string };

export type SubModo = {
  id: string;
  nome: string;
  icone: NomeIcone;
  /** O problema optico especifico que este sub-modo resolve. */
  problema: string;
  chips: Chip[];
};

/**
 * [D1] Lousa, slide e caderno sao problemas opticos opostos: a lousa reflete a
 * janela, o slide e uma fonte de luz numa sala escura e o caderno tem sombra da
 * propria mao. Um "modo documento" generico trata os tres igual e falha nos tres.
 */
export const subModos: SubModo[] = [
  {
    id: 'lousa',
    nome: 'Lousa',
    icone: 'presentation',
    problema: 'Reflexo da janela e giz apagado, capturados de lado',
    chips: [
      { id: 'reflexo', icone: 'flare', label: 'Anti-reflexo' },
      { id: 'perspectiva', icone: 'perspective-less', label: 'Perspectiva' },
      { id: 'traco', icone: 'fountain-pen-tip', label: 'Traço realçado' },
      { id: 'frames', icone: 'layers-triple-outline', label: '4 frames' },
    ],
  },
  {
    id: 'slide',
    nome: 'Slide',
    icone: 'projector-screen-outline',
    problema: 'Projeção estourada em sala escura, com cintilação',
    chips: [
      { id: 'contraste', icone: 'contrast-box', label: 'Brilho compensado' },
      { id: 'cintilacao', icone: 'flash-off', label: 'Anti-cintilação' },
      { id: 'recorte', icone: 'crop', label: 'Recorte da tela' },
      { id: 'fonte', icone: 'format-size', label: 'Texto pequeno' },
    ],
  },
  {
    id: 'caderno',
    nome: 'Caderno',
    icone: 'notebook-outline',
    problema: 'Sombra da própria mão e papel curvado sobre a mesa',
    chips: [
      { id: 'sombra', icone: 'gradient-vertical', label: 'Sombra removida' },
      { id: 'curva', icone: 'vector-curve', label: 'Papel achatado' },
      { id: 'dedo', icone: 'eraser', label: 'Dedo removido' },
      { id: 'manuscrito', icone: 'signature-freehand', label: 'Manuscrito' },
    ],
  },
];

/** Etapas de leitura/IA (depois da camera). */
export const etapasIA: Etapa[] = [
  { id: 'ocr', label: 'Identificando texto', detalhe: 'OCR do conteúdo' },
  { id: 'contexto', label: 'Reconhecendo contexto', detalhe: 'Cruzando com sua grade' },
  { id: 'organiza', label: 'Organizando conteúdo', detalhe: 'Matéria › Tema › Aula' },
  { id: 'fim', label: 'Finalizando', detalhe: 'Preparando ações' },
];

/** Leitura tecnica do ganho da captura. Renderizada com numeral monoespacado,
 *  no estilo de visor de camera — ver DESIGN.md. */
export const ganhosCaptura = [
  { label: 'Nitidez do texto', valor: '+62%' },
  { label: 'Reflexo removido', valor: '3 pontos' },
  { label: 'Inclinação', valor: '-12°' },
];

export const conteudoIdentificado = {
  materia: 'Matemática',
  tema: 'Cálculo — Função',
  topico: 'Definição e tipos de função',
  textoExtraido: [
    '1. Definição',
    'É uma relação que associa cada elemento de um conjunto A a exatamente um elemento de um conjunto B.',
    '',
    'f: A → B',
    'x ↦ f(x)',
    '',
    '2. Exemplos',
    'f(x) = 2x + 1',
    'f(x) = x² - 4',
    'f(x) = 1/x , x ≠ 0',
    '',
    '3. Tipos de função',
    '• Função Afim:       f(x) = ax + b   (a ≠ 0)',
    '• Função Quadrática: f(x) = ax² + bx + c  (a ≠ 0)',
    '• Função Constante:  f(x) = c',
    '• Função Identidade: f(x) = x',
  ].join('\n'),
};

export const caminhoSalvar = ['Matemática', 'Cálculo', 'Funções'];

export const resumoIA = [
  'Função é uma relação que associa cada elemento de um conjunto A a exatamente um elemento de um conjunto B.',
  'Representação: f: A → B  e  x ↦ f(x).',
  'Função Afim: f(x) = ax + b, com a ≠ 0 — gráfico é uma reta.',
  'Função Quadrática: f(x) = ax² + bx + c, com a ≠ 0 — gráfico é uma parábola.',
  'Função Constante: f(x) = c — valor de saída não depende de x.',
  'Função Identidade: f(x) = x — cada entrada devolve ela mesma.',
];

export type Flashcard = { p: string; r: string };

export const flashcards: Flashcard[] = [
  {
    p: 'O que é uma função?',
    r: 'Uma relação que associa cada elemento de um conjunto A a exatamente um elemento de um conjunto B.',
  },
  { p: 'Qual a forma geral da função afim?', r: 'f(x) = ax + b, com a ≠ 0. O gráfico é uma reta.' },
  {
    p: 'Qual a forma geral da função quadrática?',
    r: 'f(x) = ax² + bx + c, com a ≠ 0. O gráfico é uma parábola.',
  },
  {
    p: 'O que caracteriza a função constante?',
    r: 'f(x) = c — a saída é sempre a mesma, independente de x.',
  },
  { p: 'O que é a função identidade?', r: 'f(x) = x — cada entrada devolve ela mesma.' },
  {
    p: 'Na notação f: A → B, o que é A?',
    r: 'A é o domínio: o conjunto de todas as entradas possíveis.',
  },
  {
    p: 'Por que f(x) = 1/x exige x ≠ 0?',
    r: 'Porque a divisão por zero não é definida, então 0 fica fora do domínio.',
  },
  {
    p: 'O gráfico de f(x) = ax + b é o quê?',
    r: 'Uma reta, com inclinação dada por a e intercepto em b.',
  },
  { p: 'O que significa x ↦ f(x)?', r: 'Que o elemento x é levado (mapeado) ao elemento f(x).' },
  {
    p: 'Uma função pode levar um x a dois valores diferentes?',
    r: 'Não. Cada elemento do domínio tem exatamente uma imagem.',
  },
];

export type Questao = { q: string; alt: string[]; certa: number };

export const questoes: Questao[] = [
  { q: 'Dada f(x) = 2x + 1, calcule f(3).', alt: ['5', '7', '6', '8'], certa: 1 },
  {
    q: 'Qual dessas é uma função quadrática?',
    alt: ['f(x) = 3x + 2', 'f(x) = x² - 4', 'f(x) = 5', 'f(x) = x'],
    certa: 1,
  },
  {
    q: 'Para f(x) = 1/x, qual valor NÃO pertence ao domínio?',
    alt: ['1', '-1', '0', '2'],
    certa: 2,
  },
];

export type Aula = { id: string; titulo: string; data: string; hora: string; novo?: boolean };

/** A aula que o usuario acabou de capturar, com a data e a hora reais do momento.
 *  Usada na arvore de destino e no topo de Meus Estudos, com o selo de nova. */
export function aulaCapturada(agora = new Date()): Aula {
  const dois = (n: number) => String(n).padStart(2, '0');
  const dia = dois(agora.getDate());
  const mes = dois(agora.getMonth() + 1);
  return {
    id: 'nova',
    titulo: `Função — Aula ${dia}/${mes}`,
    data: `${dia}/${mes}/${agora.getFullYear()}`,
    hora: `${dois(agora.getHours())}:${dois(agora.getMinutes())}`,
    novo: true,
  };
}
export type Subpasta = { nome: string; aulas: Aula[] };
export type Pasta = { nome: string; icone: NomeIcone; subpastas: Subpasta[] };

export const biblioteca: Pasta[] = [
  {
    nome: 'Matemática',
    icone: 'function-variant',
    subpastas: [
      {
        nome: 'Cálculo',
        aulas: [
          { id: 'a1', titulo: 'Função — Aula 18/08', data: '18/08/2026', hora: '10:32' },
          { id: 'a2', titulo: 'Função Afim — Aula 11/08', data: '11/08/2026', hora: '09:15' },
          { id: 'a3', titulo: 'Limites — Aula 04/08', data: '04/08/2026', hora: '10:20' },
        ],
      },
    ],
  },
  {
    nome: 'Física',
    icone: 'atom-variant',
    subpastas: [
      {
        nome: 'Mecânica Geral',
        aulas: [
          { id: 'b1', titulo: 'Torque — Aula 19/08', data: '19/08/2026', hora: '20:40' },
          { id: 'b2', titulo: 'Momento de inércia — Aula 12/08', data: '12/08/2026', hora: '20:35' },
        ],
      },
    ],
  },
  {
    nome: 'Computação',
    icone: 'code-braces',
    subpastas: [
      {
        nome: 'Estruturas de Dados',
        aulas: [
          { id: 'c1', titulo: 'Listas encadeadas — Aula 17/08', data: '17/08/2026', hora: '19:22' },
          { id: 'c2', titulo: 'Complexidade — Aula 10/08', data: '10/08/2026', hora: '19:18' },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------ integracoes */

export type Plataforma = {
  id: string;
  nome: string;
  icone: NomeIcone;
  papel: string;
  conectadaPorPadrao: boolean;
};

/** A missao do Flow e facilitar a vida do estudante, e boa parte disso e nao
 *  obrigar ele a reabrir o conteudo em outro lugar. Estas sao as plataformas que
 *  um universitario de engenharia ja usa no dia a dia. */
export const plataformas: Plataforma[] = [
  {
    id: 'drive',
    nome: 'Google Drive',
    icone: 'google-drive',
    papel: 'Salva a aula na pasta da disciplina',
    conectadaPorPadrao: true,
  },
  {
    id: 'classroom',
    nome: 'Google Classroom',
    icone: 'google-classroom',
    papel: 'Publica o material para a turma',
    conectadaPorPadrao: true,
  },
  {
    id: 'github',
    nome: 'GitHub',
    icone: 'github',
    papel: 'Commita anotações no repositório da matéria',
    conectadaPorPadrao: true,
  },
  {
    id: 'notion',
    nome: 'Notion',
    icone: 'note-text-outline',
    papel: 'Cria a página de estudo já formatada',
    conectadaPorPadrao: false,
  },
  {
    id: 'teams',
    nome: 'Microsoft Teams',
    icone: 'microsoft-teams',
    papel: 'Envia para o canal da disciplina',
    conectadaPorPadrao: false,
  },
];

/* ------------------------------------------------- economia de armazenamento */

/** Uma das dores levantadas na pesquisa do grupo e a falta de espaco no celular.
 *  O Flow guarda texto e uma imagem tratada, e nao a foto original de 12 MP. */
export const economia = {
  /** Tamanho tipico de uma foto de 12 MP, em MB. */
  fotoOriginalMb: 4.2,
  /** Texto reconhecido mais miniatura tratada, em KB. */
  salvoKb: 38,
  /**
   * Capturas de um semestre. Base do calculo: 5 aulas por semana, 16 semanas,
   * e cerca de 5 fotos de quadro por aula. Numero conservador de proposito —
   * inflar aqui seria facil e destruiria a credibilidade se a banca perguntar.
   */
  capturasPorSemestre: 400,
};

/** Formata em MB ou GB conforme a grandeza, com virgula decimal. */
function tamanho(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1).replace('.', ',')} GB`;
  return `${Math.round(mb)} MB`;
}

export function economiaFormatada() {
  const fotoKb = economia.fotoOriginalMb * 1024;
  const fator = Math.round(fotoKb / economia.salvoKb);
  const comFlowMb = (economia.salvoKb * economia.capturasPorSemestre) / 1024;
  const semFlowMb = economia.fotoOriginalMb * economia.capturasPorSemestre;
  return {
    fator,
    capturas: economia.capturasPorSemestre,
    porAula: `${economia.salvoKb} KB`,
    porAulaSemFlow: `${economia.fotoOriginalMb.toFixed(1).replace('.', ',')} MB`,
    semestre: tamanho(comFlowMb),
    semestreSemFlow: tamanho(semFlowMb),
  };
}
