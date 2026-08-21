/**
 * Fonte unica de cor, raio, espacamento e tipografia do JOVI Flow.
 *
 * Regra rigida do projeto: nenhum valor de cor, raio ou espacamento escrito
 * direto no componente ou na tela. Se faltar um token, adicione aqui.
 */

import { Platform } from 'react-native';

export const colors = {
  // Neutros com vies azul, alinhados a marca. Antes tinham vies verde.
  bg: '#0A0D14',
  bgElev: '#0F131C',
  surface: '#141926',
  surfaceAlt: '#1A2030',
  surfaceHi: '#232B3D',
  border: '#2A3347',
  borderSoft: '#1E2536',

  // Azul da JOVI, extraido do material oficial da marca.
  // primary e cor de PREENCHIMENTO: sobre fundo escuro tem contraste 2.84 e
  // reprovaria como texto. Para texto e icone use primaryHi (6.29).
  primary: '#1E46E6',
  primaryHi: '#6E8BFF',
  primaryDim: '#1536B0',
  primarySoft: 'rgba(30,70,230,0.16)',
  primaryEdge: 'rgba(30,70,230,0.50)',

  text: '#EEF1F7',
  textDim: '#9AA4BC',
  textFaint: '#5F6980',

  warn: '#F0B429',
  danger: '#FF6B6B',
  info: '#5B9BFF',

  overlay: 'rgba(6,9,16,0.84)',
  scrim: 'rgba(0,0,0,0.58)',

  // --- Tokens acrescentados (nao constam na secao 4.1 do plano) ---
  // Necessarios porque o plano pede texto branco sobre o botao primario e um
  // quadro branco no WhiteboardFallback, que inverte o tema escuro do app.
  onPrimary: '#FFFFFF',
  board: '#F2F5F3',
  boardInk: '#1F2937',
  boardRed: '#B91C1C',
  boardBlue: '#1D4ED8',
  boardLine: '#D3DAD6',
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

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

/** Monoespacado nativo das duas plataformas — sem dependencia de fonte externa.
 *  Usado em numero, porcentagem, angulo, horario e contador, no estilo de um
 *  visor de camera. Ver DESIGN.md. */
export const fontMono = Platform.select({ ios: 'Menlo', default: 'monospace' });

/** Rotulo tecnico em caixa alta, acompanhando o numeral monoespacado. */
export const fontDado = {
  valor: { fontSize: 20, fontWeight: '600' as const, fontFamily: fontMono, letterSpacing: -0.5 },
  valorGrande: { fontSize: 28, fontWeight: '700' as const, fontFamily: fontMono, letterSpacing: -1 },
  rotulo: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
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
