/**
 * Fonte unica de cor, raio, espacamento e tipografia do JOVI Flow.
 *
 * Regra rigida do projeto: nenhum valor de cor, raio ou espacamento escrito
 * direto no componente ou na tela. Se faltar um token, adicione aqui.
 */

export const colors = {
  bg: '#0B0F0D',
  bgElev: '#111815',
  surface: '#151D19',
  surfaceAlt: '#1B2521',
  surfaceHi: '#222E28',
  border: '#28352F',
  borderSoft: '#1F2A25',

  primary: '#12A150',
  primaryHi: '#16C060',
  primaryDim: '#0C6E37',
  primarySoft: 'rgba(18,161,80,0.14)',
  primaryEdge: 'rgba(18,161,80,0.45)',

  text: '#F1F5F3',
  textDim: '#93A29B',
  textFaint: '#5D6B64',

  warn: '#F0B429',
  danger: '#E5484D',
  info: '#3B82F6',

  overlay: 'rgba(5,8,7,0.82)',
  scrim: 'rgba(0,0,0,0.55)',

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
