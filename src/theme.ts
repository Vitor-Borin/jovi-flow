/**
 * Fonte unica de cor, raio, espacamento e tipografia do JOVI Flow.
 *
 * Regra rigida do projeto: nenhum valor de cor, raio ou espacamento escrito
 * direto no componente ou na tela. Se faltar um token, adicione aqui.
 */

import { Platform } from 'react-native';

export const colors = {
  // Neutros sem vies de cor, como o modo escuro do sistema da JOVI. A versao
  // anterior tinha fundo azulado, e o app parecia um aplicativo de terceiro em
  // vez de uma tela do proprio aparelho.
  bg: '#000000',
  bgElev: '#0E0E10',
  surface: '#151517',
  surfaceAlt: '#1C1C1F',
  surfaceHi: '#26262A',
  border: '#2A2A2F',
  borderSoft: '#1E1E22',

  // Azul da JOVI, extraido do material oficial da marca.
  // primary e cor de PREENCHIMENTO: sobre fundo escuro tem contraste 2.84 e
  // reprovaria como texto. Para texto e icone use primaryHi (6.29).
  primary: '#1E46E6',
  primaryHi: '#6E8BFF',
  primaryDim: '#1536B0',
  primarySoft: 'rgba(30,70,230,0.16)',
  primaryEdge: 'rgba(30,70,230,0.50)',

  text: '#F2F2F4',
  textDim: '#A0A0A8',
  textFaint: '#66666F',

  warn: '#F0B429',
  danger: '#FF6B6B',
  success: '#4CD964',

  overlay: 'rgba(0,0,0,0.84)',
  scrim: 'rgba(0,0,0,0.58)',

  // Visor da camera. A camera da JOVI e preta de ponta a ponta, com icone
  // branco e controle translucido por cima da imagem.
  visor: {
    fundo: '#000000',
    icone: '#FFFFFF',
    iconeFraco: 'rgba(255,255,255,0.55)',
    pilula: 'rgba(0,0,0,0.45)',
    pilulaBorda: 'rgba(255,255,255,0.22)',
    obturador: '#FFFFFF',
    obturadorBorda: 'rgba(255,255,255,0.35)',
    // Amarelo da camera da vivo, medido nas areas solidas das capturas do
    // JOVI V50: modo selecionado, zoom ativo, anel do obturador, atalho ligado.
    // Vale so dentro do visor. Fora dele, a cor de acao continua o azul da JOVI.
    destaque: '#F6CE3A',
    // Veu atras de texto sobre a imagem. Sobre lousa branca o amarelo tem
    // contraste 1.4; com este veu passa de 5.
    veu: 'rgba(0,0,0,0.66)',
    // Halo do texto branco solto sobre a imagem. Forte o bastante para o
    // numero do zoom continuar legivel com a camera apontada para lousa branca.
    sombra: 'rgba(0,0,0,0.85)',
  },

  onPrimary: '#FFFFFF',
  board: '#F2F5F3',
  boardInk: '#1F2937',
  boardRed: '#B91C1C',
  boardBlue: '#1D4ED8',
  boardLine: '#D3DAD6',
};

/** xs e o canto da camera da vivo (miniatura e pilula do seletor, ~3 pt
 *  medidos no JOVI V50). */
export const radius = { xs: 4, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

export const spacing = (n: number) => n * 4;

export const font = {
  h1: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodyMed: { fontSize: 14, fontWeight: '600' as const },
  small: { fontSize: 12, fontWeight: '400' as const },
  tiny: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.3 },
};

/** Monoespacado nativo das duas plataformas, sem dependencia de fonte externa.
 *  Usado em numero, horario e contador, no estilo de um visor de camera. */
export const fontMono = Platform.select({ ios: 'Menlo', default: 'monospace' });

/** Rotulo tecnico em caixa alta, acompanhando o numeral monoespacado. */
export const fontDado = {
  valor: { fontSize: 20, fontWeight: '600' as const, fontFamily: fontMono, letterSpacing: -0.5 },
  valorGrande: { fontSize: 28, fontWeight: '700' as const, fontFamily: fontMono, letterSpacing: -1 },
  rotulo: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
};

/** Modo da camera, como a regua de modos do JOVI V50: capitalizacao normal,
 *  15 pt e negrito em todos. So a cor separa o selecionado dos outros. */
export const fontModo = {
  fontSize: 15,
  fontWeight: '700' as const,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
};

/** Altura minima de qualquer area tocavel (acessibilidade: 44x44pt). */
export const TOQUE_MIN = 44;

/** Altura padrao dos botoes de acao principais. */
export const ALTURA_BOTAO = 52;
