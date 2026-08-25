/**
 * Camada de dados simulada do JOVI Flow.
 * Nada aqui chama rede: o prototipo roda 100% offline por decisao de projeto,
 * para que a demonstracao na banca nao dependa do Wi-Fi do campus.
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

export function contextoDaCaptura(
  materiaDetectada: string,
  agora = new Date()
): ContextoCaptura {
  const emAula = aulaAgora(agora);
  if (emAula) return { tipo: 'em-aula', slot: emAula };

  // Fora de aula a grade ainda serve, nao como relogio, mas como vocabulario
  // das disciplinas que este estudante cursa.
  const alvo = normalizar(materiaDetectada);
  if (alvo !== '') {
    // Ordem importa. A busca por substring casava "Design" com "Software &
    // Total Experience Design" de segunda, que vem antes na grade, e a tela
    // mostrava a disciplina errada. Casamento exato tem precedencia.
    const exato = gradeHoraria.find(
      (s) => normalizar(s.materia) === alvo || normalizar(s.disciplina) === alvo
    );
    if (exato) return { tipo: 'disciplina-conhecida', slot: exato };

    const parcial = gradeHoraria.find((s) => {
      const d = normalizar(s.disciplina);
      return d.startsWith(alvo) || alvo.startsWith(normalizar(s.materia));
    });
    if (parcial) return { tipo: 'disciplina-conhecida', slot: parcial };
  }

  return { tipo: 'assunto-novo' };
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

export const caminhoSalvar = ['Design', 'Front-End Design', 'Layout'];

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

export type Aula = { id: string; titulo: string; data: string; hora: string; novo?: boolean };

/** Encurta o topico para caber num titulo de aula. "Flexbox: eixos, alinhamento
 *  e distribuicao" vira "Flexbox". */
export function tituloDaCaptura(topico: string): string {
  const corte = topico.split(/[:.]/)[0] ?? topico;
  const limpo = corte.trim();
  return limpo.length > 32 ? `${limpo.slice(0, 32).trimEnd()}...` : limpo;
}

/** A aula que o usuario acabou de capturar, com a data e a hora reais do momento.
 *  Usada na arvore de destino e no topo de Meus Estudos, com o selo de nova.
 *  O titulo vem da leitura da IA quando o modo ao vivo esta ligado, para a aba
 *  Estudos mostrar o que foi capturado de verdade, e nao um assunto fixo. */
export function aulaCapturada(topico = conteudoIdentificado.topico, agora = new Date()): Aula {
  const dois = (n: number) => String(n).padStart(2, '0');
  const dia = dois(agora.getDate());
  const mes = dois(agora.getMonth() + 1);
  return {
    id: 'nova',
    titulo: `${tituloDaCaptura(topico)} · Aula ${dia}/${mes}`,
    data: `${dia}/${mes}/${agora.getFullYear()}`,
    hora: `${dois(agora.getHours())}:${dois(agora.getMinutes())}`,
    novo: true,
  };
}
export type Subpasta = { nome: string; aulas: Aula[] };
export type Pasta = { nome: string; icone: NomeIcone; subpastas: Subpasta[] };

export const biblioteca: Pasta[] = [
  {
    nome: 'Design',
    icone: 'palette-outline',
    subpastas: [
      {
        nome: 'Front-End Design',
        aulas: [
          { id: 'a1', titulo: 'Grid e Bento Layout · Aula 14/08', data: '14/08/2026', hora: '19:38' },
          { id: 'a2', titulo: 'Tipografia e escala · Aula 07/08', data: '07/08/2026', hora: '19:26' },
        ],
      },
    ],
  },
  {
    nome: 'Programação',
    icone: 'language-python',
    subpastas: [
      {
        nome: 'Computational Thinking with Python',
        aulas: [
          { id: 'b1', titulo: 'Listas e repetição · Aula 20/08', data: '20/08/2026', hora: '21:32' },
          { id: 'b2', titulo: 'Estruturas de decisão · Aula 19/08', data: '19/08/2026', hora: '21:28' },
        ],
      },
    ],
  },
  {
    nome: 'Matemática',
    icone: 'function-variant',
    subpastas: [
      {
        nome: 'Differentiated Problem Solving',
        aulas: [
          { id: 'c1', titulo: 'Modelagem de problemas · Aula 19/08', data: '19/08/2026', hora: '19:41' },
        ],
      },
    ],
  },
];

/** Caminhos de pasta que ja existem. Vao no prompt de classificacao para a IA
 *  reaproveitar um em vez de inventar um nome novo a cada captura. Sem isso,
 *  cinco fotos do mesmo assunto viram cinco pastas diferentes, que e exatamente
 *  a bagunca que o app existe para resolver. */
export function pastasExistentes(): string[] {
  return biblioteca.flatMap((p) => p.subpastas.map((sub) => `${p.nome} › ${sub.nome}`));
}

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
   * e cerca de 5 fotos de quadro por aula. Numero conservador de proposito,
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
