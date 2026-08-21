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
  materia: string;
  disciplina: string;
  sala: string;
};

/** Diferencial: a grade horaria do estudante da contexto a camera.
 *  O Flow nao adivinha a materia — ele confirma com o horario. */
export const gradeHoraria: Slot[] = [
  { dia: 1, inicio: '08:00', fim: '09:40', materia: 'Física', disciplina: 'Mecânica II', sala: 'B-204' },
  { dia: 2, inicio: '10:00', fim: '11:40', materia: 'Matemática', disciplina: 'Cálculo I', sala: 'A-312' },
  { dia: 3, inicio: '08:00', fim: '09:40', materia: 'Química', disciplina: 'Orgânica I', sala: 'C-101' },
  { dia: 4, inicio: '10:00', fim: '11:40', materia: 'Matemática', disciplina: 'Cálculo I', sala: 'A-312' },
  { dia: 5, inicio: '14:00', fim: '15:40', materia: 'Física', disciplina: 'Mecânica II', sala: 'B-204' },
];

/** Slot usado fora de horario de aula. Terca, 10:00, Calculo I — o cenario que o
 *  pitch demonstra. Declarado a parte para nunca depender de indice solto. */
const SLOT_PADRAO: Slot = {
  dia: 2,
  inicio: '10:00',
  fim: '11:40',
  materia: 'Matemática',
  disciplina: 'Cálculo I',
  sala: 'A-312',
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
        nome: 'Mecânica II',
        aulas: [
          { id: 'b1', titulo: 'Torque — Aula 17/08', data: '17/08/2026', hora: '08:40' },
          { id: 'b2', titulo: 'Momento de inércia — Aula 10/08', data: '10/08/2026', hora: '08:35' },
        ],
      },
    ],
  },
  {
    nome: 'Química',
    icone: 'flask-outline',
    subpastas: [
      {
        nome: 'Orgânica I',
        aulas: [
          { id: 'c1', titulo: 'Hidrocarbonetos — Aula 19/08', data: '19/08/2026', hora: '08:12' },
        ],
      },
    ],
  },
];
