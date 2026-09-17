/**
 * Dados fixos do JOVI Flow: a grade horaria, os sub-modos da camera, as etapas
 * do processamento, o conteudo de exemplo (usado quando o modo ao vivo esta
 * desligado ou a rede falha) e as plataformas de envio.
 *
 * O acervo de pastas e aulas NAO mora aqui: ele e estado do app, em
 * data/acervo.ts e store/AcervoContext.tsx.
 */

// Import de tipo apenas: nao gera require em tempo de execucao, o que mantem esta
// camada de dados pura e testavel fora do bundle.
import type { MaterialCommunityIcons } from '@expo/vector-icons';

/** Nome de icone valido, no lugar dos emoji do plano original. Ver DESIGN.md. */
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
 *  O Flow nao adivinha a materia: ele confirma com o horario. */
/**
 * Grade real do Vitor, do curso de Engenharia de Software na FIAP Paulista, noturno.
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

/**
 * A aula que esta acontecendo AGORA, ou null.
 *
 * Devolver null de proposito. A versao anterior devolvia sempre um slot, e a
 * tela exibia "Confirmado pela sua grade" mesmo num domingo a tarde, em casa,
 * afirmando uma confirmacao que nunca aconteceu. Preferimos admitir que nao
 * sabemos a mentir com confianca.
 */
export function aulaAgora(agora = new Date()): Slot | null {
  const dia = agora.getDay();
  const min = agora.getHours() * 60 + agora.getMinutes();
  return (
    gradeHoraria.find((s) => s.dia === dia && min >= toMin(s.inicio) && min <= toMin(s.fim)) ?? null
  );
}

function toMin(h: string): number {
  const [horas = 0, minutos = 0] = h.split(':').map(Number);
  return horas * 60 + minutos;
}

/** A proxima aula da grade, varrendo a semana para a frente a partir de agora.
 *  Usado no Inicio, onde a pergunta e "qual e a proxima", nao "onde estou". */
export function proximaAula(agora = new Date()): { slot: Slot; emAula: boolean } {
  const atual = aulaAgora(agora);
  if (atual) return { slot: atual, emAula: true };

  const dia = agora.getDay();
  const min = agora.getHours() * 60 + agora.getMinutes();

  // Procura ainda hoje, depois nos proximos seis dias, e por fim volta ao topo.
  for (let avanco = 0; avanco < 7; avanco += 1) {
    const d = (dia + avanco) % 7;
    const candidatos = gradeHoraria
      .filter((s) => s.dia === d && (avanco > 0 || toMin(s.inicio) > min))
      .sort((a, b) => toMin(a.inicio) - toMin(b.inicio));
    const proximo = candidatos[0];
    if (proximo) return { slot: proximo, emAula: false };
  }

  return { slot: gradeHoraria[0], emAula: false };
}

/**
 * Como o Flow chegou na materia desta captura.
 *
 * Tres estados, do mais forte para o mais fraco. O primeiro e o diferencial do
 * projeto; o terceiro e a admissao honesta de que a grade nao ajuda aqui, o que
 * cobre o caso do estudante revisando em casa, num sabado, longe da faculdade.
 */
export type ContextoCaptura =
  | { tipo: 'em-aula'; slot: Slot }
  | { tipo: 'disciplina-conhecida'; slot: Slot }
  | { tipo: 'assunto-novo' };

function normalizar(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function casaExato(alvo: string, s: Slot): boolean {
  return normalizar(s.materia) === alvo || normalizar(s.disciplina) === alvo;
}

function casaParcial(alvo: string, s: Slot): boolean {
  return normalizar(s.disciplina).startsWith(alvo) || alvo.startsWith(normalizar(s.materia));
}

export function contextoDaCaptura(
  materiaDetectada: string,
  agora = new Date()
): ContextoCaptura {
  const alvo = normalizar(materiaDetectada);

  // So confirma pela grade quando a materia da foto e a da aula de agora. Antes
  // bastava haver aula no horario: a tela dizia "Confirmado pela sua grade:
  // Computational Thinking" em cima de uma foto de Front-End Design.
  const emAula = aulaAgora(agora);
  if (emAula && alvo !== '' && (casaExato(alvo, emAula) || casaParcial(alvo, emAula))) {
    return { tipo: 'em-aula', slot: emAula };
  }

  // Fora de aula, ou com outra materia na foto, a grade ainda serve, nao como
  // relogio, mas como vocabulario das disciplinas que este estudante cursa.
  if (alvo !== '') {
    // Ordem importa. A busca por substring casava "Design" com "Software &
    // Total Experience Design" de segunda, que vem antes na grade, e a tela
    // mostrava a disciplina errada. Casamento exato tem precedencia.
    const exato = gradeHoraria.find((s) => casaExato(alvo, s));
    if (exato) return { tipo: 'disciplina-conhecida', slot: exato };

    const parcial = gradeHoraria.find((s) => casaParcial(alvo, s));
    if (parcial) return { tipo: 'disciplina-conhecida', slot: parcial };
  }

  return { tipo: 'assunto-novo' };
}

export type Etapa = { id: string; label: string; detalhe: string };

/**
 * Os modos que a camera do JOVI V50 tem de verdade, na traducao oficial em
 * portugues da ficha tecnica da JOVI Brasil (camera principal traseira).
 *
 * Isto nao e enfeite: a lista existe para a folha "Mais" mostrar a camera real
 * do aparelho, e para a banca ver que "Documento em Ultra HD" ja e um modo da
 * JOVI. O Modo Aula nao inventa capacidade nova, ele especializa essa.
 */
export type ModoJovi = {
  nome: string;
  icone: NomeIcone;
  /** true quando o modo existe neste prototipo. */
  noPrototipo?: boolean;
  /** Texto curto abaixo do nome, quando ha algo a dizer. */
  nota?: string;
};

export const modosJovi: ModoJovi[] = [
  { nome: 'Aula', icone: 'school-outline', noPrototipo: true, nota: 'O Flow' },
  { nome: 'Foto', icone: 'camera-outline', noPrototipo: true },
  { nome: 'Retrato', icone: 'account-outline', noPrototipo: true },
  { nome: 'Noite', icone: 'weather-night', noPrototipo: true },
  { nome: 'Vídeo', icone: 'video-outline', noPrototipo: true },
  { nome: 'Documento em Ultra HD', icone: 'file-document-outline', nota: 'Base do Aula' },
  { nome: 'Microfilme', icone: 'movie-open-outline' },
  { nome: 'Alta Resolução', icone: 'image-size-select-actual' },
  { nome: 'Panorâmica', icone: 'panorama-horizontal-outline' },
  { nome: 'Câmera Lenta', icone: 'motion-play-outline' },
  { nome: 'Intervalo', icone: 'timelapse' },
  { nome: 'Superlua', icone: 'moon-waning-crescent' },
  { nome: 'Astro', icone: 'star-outline' },
  { nome: 'Profissional', icone: 'tune-variant' },
  { nome: 'Instantâneo', icone: 'flash-outline' },
  { nome: 'Comida', icone: 'silverware-fork-knife' },
  { nome: 'Visualização Dupla', icone: 'square-outline' },
  { nome: 'Foto em Movimento', icone: 'circle-double' },
];

export type Chip = { id: string; icone: NomeIcone; label: string };

export type SubModo = {
  id: string;
  nome: string;
  /** Os avisos do visor sobre esta superficie, com o genero certo: quando ele
   *  troca para Aula sozinho, quando ela entra inteira no enquadramento e
   *  quando sai. Os dois ultimos sao falados pelo leitor de tela. */
  reconhecido: string;
  enquadrado: string;
  saiu: string;
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
    reconhecido: 'Lousa reconhecida',
    enquadrado: 'Lousa inteira enquadrada',
    saiu: 'A lousa saiu do enquadramento',
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
    reconhecido: 'Slide reconhecido',
    enquadrado: 'Slide inteiro enquadrado',
    saiu: 'O slide saiu do enquadramento',
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
    reconhecido: 'Caderno reconhecido',
    enquadrado: 'Caderno inteiro enquadrado',
    saiu: 'O caderno saiu do enquadramento',
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

/**
 * Leitura tecnica do ganho da captura, renderizada com numeral monoespacado no
 * estilo de visor de camera. Ver DESIGN.md.
 *
 * Sao ESTIMATIVAS ilustrativas do processamento, e a tela diz isso. Numa tela
 * onde todo o resto passou a ser leitura real, apresentar estes valores como
 * medicao seria o unico ponto sem resposta se a banca perguntar como foram
 * obtidos, e contaminaria a credibilidade do que e verdadeiro.
 */
export const ganhosCaptura = [
  { label: 'Nitidez do texto', valor: '+62%' },
  { label: 'Reflexo removido', valor: '3 pontos' },
  { label: 'Inclinação', valor: '-12°' },
];

export const conteudoIdentificado = {
  materia: 'Design',
  tema: 'Front-End Design · Layout',
  topico: 'Flexbox: eixos, alinhamento e distribuição',
  textoExtraido: [
    'FLEXBOX',
    '',
    '.container { display: flex }',
    '',
    'flex-direction: row | column',
    '   define o eixo principal',
    '',
    'justify-content  ->  eixo principal',
    'align-items      ->  eixo cruzado',
    '',
    'flex: 1  ==  flex: 1 1 0%',
  ].join('\n'),
};

/** Pasta de destino do exemplo. Dois niveis: materia e subpasta. */
export const caminhoSalvar: [string, string] = ['Design', 'Front-End Design'];

export const resumoIA = [
  'Flexbox é um modelo de layout de uma dimensão: você organiza os itens em linha ou em coluna, nunca nas duas ao mesmo tempo.',
  'display: flex transforma o elemento em container, e todos os filhos diretos passam a ser itens flexíveis.',
  'flex-direction define qual é o eixo principal: row deixa na horizontal, column na vertical.',
  'justify-content distribui os itens no eixo principal; align-items alinha no eixo cruzado. Trocar a direção troca o papel das duas.',
  'Nos itens, flex-grow controla o quanto cresce, flex-shrink o quanto encolhe e flex-basis o tamanho de partida.',
  'gap cria espaçamento entre os itens sem precisar de margin, e flex-wrap permite quebrar em várias linhas.',
];

export type Flashcard = { p: string; r: string };

export const flashcards: Flashcard[] = [
  { p: 'O que display: flex faz?', r: 'Transforma o elemento em flex container. Todos os filhos diretos viram flex items.' },
  { p: 'Flexbox trabalha em quantas dimensões?', r: 'Uma. Linha ou coluna. Para as duas ao mesmo tempo existe o Grid.' },
  { p: 'O que flex-direction define?', r: 'Qual é o eixo principal: row deixa horizontal, column deixa vertical.' },
  { p: 'justify-content atua em qual eixo?', r: 'No eixo principal, o mesmo que flex-direction definiu.' },
  { p: 'align-items atua em qual eixo?', r: 'No eixo cruzado, sempre perpendicular ao principal.' },
  { p: 'O que acontece com justify-content se eu mudar para column?', r: 'Ele passa a distribuir na vertical, porque o eixo principal mudou.' },
  { p: 'Para que serve flex-grow?', r: 'Define o quanto o item cresce quando sobra espaço no container.' },
  { p: 'O que significa flex: 1?', r: 'É o atalho de flex: 1 1 0%: cresce, encolhe e parte do tamanho zero.' },
  { p: 'Qual a diferença entre gap e margin no Flexbox?', r: 'gap cria espaço entre os itens sem afetar as bordas externas; margin afeta cada item individualmente.' },
  { p: 'O que faz flex-wrap: wrap?', r: 'Permite que os itens quebrem para a linha seguinte quando não couberem.' },
];

export type Questao = { q: string; alt: string[]; certa: number };

export const questoes: Questao[] = [
  {
    q: 'Com flex-direction: column, qual propriedade distribui os itens na vertical?',
    alt: ['align-items', 'justify-content', 'flex-wrap', 'align-content'],
    certa: 1,
  },
  {
    q: 'O que flex: 1 significa por extenso?',
    alt: ['flex: 1 0 auto', 'flex: 1 1 0%', 'flex: 0 1 100%', 'flex: 1 1 auto'],
    certa: 1,
  },
  {
    q: 'Qual delas NÃO é um valor válido de justify-content?',
    alt: ['space-between', 'space-evenly', 'baseline', 'center'],
    certa: 2,
  },
];

/* ------------------------------------------------------------ integracoes */

export type Plataforma = {
  id: string;
  nome: string;
  icone: NomeIcone;
  papel: string;
  conectadaPorPadrao: boolean;
  /** Envia sozinho, sem perguntar. Fica ligado so onde o conteudo continua
   *  sendo privado do estudante. Publicar para a turma ou commitar num
   *  repositorio e coisa que sai do controle dele, entao pergunta antes. */
  automaticaPorPadrao: boolean;
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
    automaticaPorPadrao: true,
  },
  {
    id: 'classroom',
    nome: 'Google Classroom',
    icone: 'google-classroom',
    papel: 'Publica o material para a turma',
    conectadaPorPadrao: true,
    automaticaPorPadrao: false,
  },
  {
    id: 'github',
    nome: 'GitHub',
    icone: 'github',
    papel: 'Commita anotações no repositório da matéria',
    conectadaPorPadrao: true,
    automaticaPorPadrao: false,
  },
  {
    id: 'notion',
    nome: 'Notion',
    icone: 'note-text-outline',
    papel: 'Cria a página de estudo já formatada',
    conectadaPorPadrao: false,
    automaticaPorPadrao: false,
  },
  {
    id: 'teams',
    nome: 'Microsoft Teams',
    icone: 'microsoft-teams',
    papel: 'Envia para o canal da disciplina',
    conectadaPorPadrao: false,
    automaticaPorPadrao: false,
  },
];
