/**
 * Geometria da lousa: acha os quatro cantos do quadro numa foto pequena e
 * calcula a transformacao que endireita a perspectiva.
 *
 * E matematica pura, sem Skia e sem React Native, para dar para testar no
 * computador com imagem sintetica antes de ir para o aparelho.
 *
 * Como acha o quadro: lousa branca, folha de caderno e slide projetado tem a
 * mesma forma na foto, um retangulo claro sobre um entorno mais escuro. Lousa
 * verde ou preta e o contrario, retangulo escuro sobre parede clara. Entao a
 * foto e separada em claro e escuro, e nos dois lados procura-se a maior regiao
 * que preenche bem o quadrilatero dos seus extremos.
 *
 * Um limiar so nao basta: com sombra forte, o lado escuro da parede fica tao
 * escuro quanto a lousa verde, e as duas viram uma regiao so. Por isso varios
 * limiares sao testados, e vence o que isola o quadrilatero mais bem preenchido.
 * Parede, janela e mesa tambem sao regioes grandes, mas nao preenchem um
 * quadrilatero, ou encostam nas bordas da foto: sao descartadas por isso.
 */

export type Ponto = { x: number; y: number };

/** Cantos na ordem superior esquerdo, superior direito, inferior direito e
 *  inferior esquerdo. */
export type Quadrilatero = [Ponto, Ponto, Ponto, Ponto];

export type Deteccao = {
  /** Cantos em coordenadas normalizadas, de 0 a 1, da imagem analisada. */
  cantos: Quadrilatero;
  /** Quadro mais claro que o entorno: quadro branco, papel ou slide. Falso para
   *  lousa verde ou preta. */
  claro: boolean;
  /** Quanto do quadrilatero e ocupado pelo quadro, de 0 a 1. */
  preenchimento: number;
  /** Fracao da foto ocupada pelo quadrilatero. */
  area: number;
};

/** Coeficientes que levam o quadrado unitario (u, v) ao quadrilatero:
 *  x = (a u + b v + c) / (g u + h v + 1), y = (d u + e v + f) / (g u + h v + 1). */
export type Homografia = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;
};

/** Abaixo disso o quadro e pequeno demais na foto para valer a pena endireitar. */
const AREA_MINIMA = 0.12;
/** Parede, janela e mesa nao preenchem o quadrilatero dos proprios extremos. */
const PREENCHIMENTO_MINIMO = 0.8;
/** Angulo interno fora desta faixa e perspectiva impossivel ou cantos errados. */
const ANGULO_MINIMO = 35;
const ANGULO_MAXIMO = 145;
/** Folga para fora, para a borda do quadro nao cortar o que foi escrito nela.
 *  Maior que isso, sobra uma moldura de parede na lousa tratada. */
const FOLGA = 0.005;
/** Canto a menos disso da borda da foto conta como encostado na borda. */
const MARGEM_BORDA = 2;
/** Fracoes da distribuicao de luz testadas como limiar, alem do de Otsu. */
const PERCENTIS = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85];
/** Quadro assim ja e o quadro: para de testar limiar e poupa o aparelho. */
const PREENCHIMENTO_SOBRA = 0.96;
const AREA_SOBRA = 0.2;
/** Distancia focal da camera principal do celular (26 mm equivalentes), como
 *  fracao da diagonal da foto. Serve quando os cantos nao dizem a propria. */
const FOCAL_PADRAO = 0.6;

function histograma(lum: Uint8Array): number[] {
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < lum.length; i += 1) {
    const v = lum[i] ?? 0;
    hist[v] = (hist[v] ?? 0) + 1;
  }
  return hist;
}

function percentil(hist: number[], total: number, fracao: number): number {
  const alvo = total * fracao;
  let acumulado = 0;
  for (let t = 0; t < 256; t += 1) {
    acumulado += hist[t] ?? 0;
    if (acumulado >= alvo) return t;
  }
  return 255;
}

function limiarOtsu(hist: number[], total: number): number {
  let soma = 0;
  for (let t = 0; t < 256; t += 1) soma += t * (hist[t] ?? 0);

  let somaFundo = 0;
  let pesoFundo = 0;
  let melhor = 0;
  let limiar = 127;
  for (let t = 0; t < 256; t += 1) {
    pesoFundo += hist[t] ?? 0;
    if (pesoFundo === 0) continue;
    const pesoFrente = total - pesoFundo;
    if (pesoFrente === 0) break;
    somaFundo += t * (hist[t] ?? 0);
    const mediaFundo = somaFundo / pesoFundo;
    const mediaFrente = (soma - somaFundo) / pesoFrente;
    const variancia = pesoFundo * pesoFrente * (mediaFundo - mediaFrente) ** 2;
    if (variancia > melhor) {
      melhor = variancia;
      limiar = t;
    }
  }
  return limiar;
}

/** Produto vetorial de (b - a) com (p - a). O sinal diz de que lado da reta
 *  a-b o ponto p esta. */
function lado(a: Ponto, b: Ponto, p: Ponto): number {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

function areaDoQuadrilatero(q: Quadrilatero): number {
  let s = 0;
  for (let i = 0; i < 4; i += 1) {
    const p = q[i] as Ponto;
    const n = q[(i + 1) % 4] as Ponto;
    s += p.x * n.y - n.x * p.y;
  }
  return Math.abs(s) / 2;
}

function anguloInterno(anterior: Ponto, vertice: Ponto, proximo: Ponto): number {
  const ax = anterior.x - vertice.x;
  const ay = anterior.y - vertice.y;
  const bx = proximo.x - vertice.x;
  const by = proximo.y - vertice.y;
  const cos = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by) || 1);
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

function quadrilateroPlausivel(q: Quadrilatero): boolean {
  // Convexo: os quatro produtos vetoriais das arestas seguidas tem o mesmo sinal.
  let positivos = 0;
  let negativos = 0;
  for (let i = 0; i < 4; i += 1) {
    const s = lado(q[i] as Ponto, q[(i + 1) % 4] as Ponto, q[(i + 2) % 4] as Ponto);
    if (s > 0) positivos += 1;
    if (s < 0) negativos += 1;
  }
  if (positivos > 0 && negativos > 0) return false;

  for (let i = 0; i < 4; i += 1) {
    const angulo = anguloInterno(q[(i + 3) % 4] as Ponto, q[i] as Ponto, q[(i + 1) % 4] as Ponto);
    if (angulo < ANGULO_MINIMO || angulo > ANGULO_MAXIMO) return false;
  }
  return true;
}

type Candidato = { cantos: Quadrilatero; preenchimento: number; area: number };

/** A maior regiao conectada da mascara, e o quadrilatero dos seus extremos.
 *  `rotulo` e `pilha` vem de fora para nao alocar de novo a cada limiar. */
function melhorRegiao(
  mascara: Uint8Array,
  largura: number,
  altura: number,
  rotulo: Int32Array,
  pilha: Int32Array
): Candidato | null {
  const total = largura * altura;
  rotulo.fill(0);

  let maiorRotulo = 0;
  let maiorTamanho = 0;
  let proximoRotulo = 1;

  for (let inicio = 0; inicio < total; inicio += 1) {
    if (mascara[inicio] === 0 || rotulo[inicio] !== 0) continue;
    const atual = proximoRotulo;
    proximoRotulo += 1;
    let topo = 0;
    let tamanho = 0;
    pilha[topo] = inicio;
    topo += 1;
    rotulo[inicio] = atual;
    while (topo > 0) {
      topo -= 1;
      const i = pilha[topo] as number;
      tamanho += 1;
      const x = i % largura;
      if (x > 0 && mascara[i - 1] !== 0 && rotulo[i - 1] === 0) {
        rotulo[i - 1] = atual;
        pilha[topo] = i - 1;
        topo += 1;
      }
      if (x < largura - 1 && mascara[i + 1] !== 0 && rotulo[i + 1] === 0) {
        rotulo[i + 1] = atual;
        pilha[topo] = i + 1;
        topo += 1;
      }
      if (i >= largura && mascara[i - largura] !== 0 && rotulo[i - largura] === 0) {
        rotulo[i - largura] = atual;
        pilha[topo] = i - largura;
        topo += 1;
      }
      if (i + largura < total && mascara[i + largura] !== 0 && rotulo[i + largura] === 0) {
        rotulo[i + largura] = atual;
        pilha[topo] = i + largura;
        topo += 1;
      }
    }
    if (tamanho > maiorTamanho) {
      maiorTamanho = tamanho;
      maiorRotulo = atual;
    }
  }

  if (maiorRotulo === 0 || maiorTamanho < total * AREA_MINIMA * PREENCHIMENTO_MINIMO) return null;

  // Extremos pela soma e pela diferenca das coordenadas: funciona para
  // retangulo girado ou visto de lado, que e o caso da foto de lousa.
  let seX = 0;
  let seY = 0;
  let seV = Infinity;
  let idX = 0;
  let idY = 0;
  let idV = -Infinity;
  let sdX = 0;
  let sdY = 0;
  let sdV = -Infinity;
  let ieX = 0;
  let ieY = 0;
  let ieV = Infinity;
  for (let i = 0; i < total; i += 1) {
    if (rotulo[i] !== maiorRotulo) continue;
    const x = i % largura;
    const y = (i - x) / largura;
    const soma = x + y;
    const diferenca = x - y;
    if (soma < seV) {
      seV = soma;
      seX = x;
      seY = y;
    }
    if (soma > idV) {
      idV = soma;
      idX = x;
      idY = y;
    }
    if (diferenca > sdV) {
      sdV = diferenca;
      sdX = x;
      sdY = y;
    }
    if (diferenca < ieV) {
      ieV = diferenca;
      ieX = x;
      ieY = y;
    }
  }

  const cantos: Quadrilatero = [
    { x: seX, y: seY },
    { x: sdX, y: sdY },
    { x: idX, y: idY },
    { x: ieX, y: ieY },
  ];
  if (!quadrilateroPlausivel(cantos)) return null;

  // Regiao com dois ou mais cantos na borda da foto e parede, mesa ou ceu, e nao
  // quadro. O quadro que enche a foto inteira tambem cai aqui, e tudo bem: sem
  // os cantos dentro da foto nao ha perspectiva para endireitar, so luz.
  const naBorda = (p: Ponto) =>
    p.x <= MARGEM_BORDA ||
    p.y <= MARGEM_BORDA ||
    p.x >= largura - 1 - MARGEM_BORDA ||
    p.y >= altura - 1 - MARGEM_BORDA;
  if (cantos.filter(naBorda).length >= 2) return null;

  const areaQ = areaDoQuadrilatero(cantos);
  if (areaQ < total * AREA_MINIMA) return null;

  // Quanto do quadrilatero e a propria regiao. Texto escrito abre furos na
  // mascara do quadro branco, e por isso o minimo nao e 1.
  let dentro = 0;
  let daRegiao = 0;
  const minX = Math.max(0, Math.floor(Math.min(seX, ieX)));
  const maxX = Math.min(largura - 1, Math.ceil(Math.max(sdX, idX)));
  const minY = Math.max(0, Math.floor(Math.min(seY, sdY)));
  const maxY = Math.min(altura - 1, Math.ceil(Math.max(ieY, idY)));
  const sinal = lado(cantos[0], cantos[1], cantos[2]) >= 0 ? 1 : -1;
  const p = { x: 0, y: 0 };
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      p.x = x;
      p.y = y;
      if (
        sinal * lado(cantos[0], cantos[1], p) < 0 ||
        sinal * lado(cantos[1], cantos[2], p) < 0 ||
        sinal * lado(cantos[2], cantos[3], p) < 0 ||
        sinal * lado(cantos[3], cantos[0], p) < 0
      ) {
        continue;
      }
      dentro += 1;
      if (rotulo[y * largura + x] === maiorRotulo) daRegiao += 1;
    }
  }

  return {
    cantos,
    preenchimento: dentro > 0 ? daRegiao / dentro : 0,
    area: areaQ / total,
  };
}

/**
 * Procura o quadro numa imagem RGBA pequena, de umas 320 px no lado maior.
 * Devolve nulo quando nao ha quadro confiavel: e melhor nao endireitar do que
 * entortar uma foto boa por causa de cantos errados.
 */
export function detectarQuadro(
  rgba: Uint8Array,
  largura: number,
  altura: number
): Deteccao | null {
  const total = largura * altura;
  const lum = new Uint8Array(total);
  for (let i = 0; i < total; i += 1) {
    const r = rgba[i * 4] ?? 0;
    const g = rgba[i * 4 + 1] ?? 0;
    const b = rgba[i * 4 + 2] ?? 0;
    lum[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  const hist = histograma(lum);
  const limiares = Array.from(
    new Set([limiarOtsu(hist, total), ...PERCENTIS.map((f) => percentil(hist, total, f))])
  );

  const mascara = new Uint8Array(total);
  const rotulo = new Int32Array(total);
  const pilha = new Int32Array(total);
  let melhor: (Candidato & { claro: boolean }) | null = null;
  let notaMelhor = -1;

  // Otsu primeiro: e o limiar que mais acerta, e costuma dispensar os outros.
  procura: for (const limiar of limiares) {
    for (const claro of [true, false]) {
      for (let i = 0; i < total; i += 1) {
        const acima = (lum[i] ?? 0) > limiar;
        mascara[i] = acima === claro ? 1 : 0;
      }
      const candidato = melhorRegiao(mascara, largura, altura, rotulo, pilha);
      if (candidato === null || candidato.preenchimento < PREENCHIMENTO_MINIMO) continue;
      const nota = candidato.preenchimento * Math.sqrt(candidato.area);
      if (nota > notaMelhor) {
        notaMelhor = nota;
        melhor = { ...candidato, claro };
      }
      if (candidato.preenchimento >= PREENCHIMENTO_SOBRA && candidato.area >= AREA_SOBRA) {
        break procura;
      }
    }
  }

  if (melhor === null) return null;

  // Normaliza e abre uma folga para fora a partir do centro.
  const cx = melhor.cantos.reduce((s, q) => s + q.x, 0) / 4;
  const cy = melhor.cantos.reduce((s, q) => s + q.y, 0) / 4;
  const limitar = (v: number) => Math.max(0, Math.min(1, v));
  const cantos = melhor.cantos.map((q) => ({
    x: limitar((cx + (q.x - cx) * (1 + FOLGA)) / (largura - 1)),
    y: limitar((cy + (q.y - cy) * (1 + FOLGA)) / (altura - 1)),
  })) as Quadrilatero;

  return { cantos, claro: melhor.claro, preenchimento: melhor.preenchimento, area: melhor.area };
}

/** Homografia do quadrado unitario para o quadrilatero (Heckbert, 1989). */
export function homografiaDoQuadrado(q: Quadrilatero): Homografia {
  const [p0, p1, p2, p3] = q;
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const dy3 = p0.y - p1.y + p2.y - p3.y;

  if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) {
    return {
      a: p1.x - p0.x,
      b: p3.x - p0.x,
      c: p0.x,
      d: p1.y - p0.y,
      e: p3.y - p0.y,
      f: p0.y,
      g: 0,
      h: 0,
    };
  }

  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const h = (dx1 * dy3 - dx3 * dy1) / den;
  return {
    a: p1.x - p0.x + g * p1.x,
    b: p3.x - p0.x + h * p3.x,
    c: p0.x,
    d: p1.y - p0.y + g * p1.y,
    e: p3.y - p0.y + h * p3.y,
    f: p0.y,
    g,
    h,
  };
}

/** Aplica a homografia a um ponto (u, v) do quadrado unitario. */
export function aplicarHomografia(m: Homografia, u: number, v: number): Ponto {
  const w = m.g * u + m.h * v + 1;
  return { x: (m.a * u + m.b * v + m.c) / w, y: (m.d * u + m.e * v + m.f) / w };
}

type Vetor = [number, number, number];

function vetorial(a: Vetor, b: Vetor): Vetor {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function escalar(a: Vetor, b: Vetor): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Proporcao real (largura / altura) do retangulo fotografado de lado, pelo
 * metodo de Zhang e He ("Whiteboard scanning and image enhancement", 2007).
 * Sem isso a lousa sai esticada: medir os lados na foto mistura o tamanho do
 * quadro com o quanto ele esta de lado.
 *
 * Supoe o centro optico no centro da foto. A distancia focal sai dos proprios
 * cantos quando eles a determinam; senao vale a da camera principal do celular.
 * Devolve nulo quando a conta nao fecha, e quem chama mede os lados.
 */
export function proporcaoReal(q: Quadrilatero, largura: number, altura: number): number | null {
  const u0 = largura / 2;
  const v0 = altura / 2;
  const m = (p: Ponto): Vetor => [p.x - u0, p.y - v0, 1];
  const [se, sd, id, ie] = q;
  const m1 = m(se);
  const m2 = m(sd);
  const m3 = m(ie);
  const m4 = m(id);

  const den2 = escalar(vetorial(m2, m4), m3);
  const den3 = escalar(vetorial(m3, m4), m2);
  if (Math.abs(den2) < 1e-9 || Math.abs(den3) < 1e-9) return null;
  const k2 = escalar(vetorial(m1, m4), m3) / den2;
  const k3 = escalar(vetorial(m1, m4), m2) / den3;
  const n2: Vetor = [k2 * m2[0] - m1[0], k2 * m2[1] - m1[1], k2 * m2[2] - m1[2]];
  const n3: Vetor = [k3 * m3[0] - m1[0], k3 * m3[1] - m1[1], k3 * m3[2] - m1[2]];

  const diagonal = Math.hypot(largura, altura);
  let f2 = (FOCAL_PADRAO * diagonal) ** 2;
  const produtoZ = n2[2] * n3[2];
  if (Math.abs(produtoZ) > 1e-6) {
    const estimado = -(n2[0] * n3[0] + n2[1] * n3[1]) / produtoZ;
    const razao = Math.sqrt(Math.max(estimado, 0)) / diagonal;
    // Foco fora de uma faixa de camera de celular e ruido dos cantos.
    if (estimado > 0 && razao >= 0.35 && razao <= 3) f2 = estimado;
  }

  const numerador = n2[0] ** 2 + n2[1] ** 2 + f2 * n2[2] ** 2;
  const denominador = n3[0] ** 2 + n3[1] ** 2 + f2 * n3[2] ** 2;
  if (numerador <= 0 || denominador <= 0) return null;
  const proporcao = Math.sqrt(numerador / denominador);
  return Number.isFinite(proporcao) && proporcao > 0.2 && proporcao < 5 ? proporcao : null;
}

/** Tamanho da lousa endireitada. Com a proporcao real conhecida, o lado maior
 *  medido na foto define a escala e o outro sai da proporcao. */
export function tamanhoEndireitado(
  q: Quadrilatero,
  proporcao: number | null
): { largura: number; altura: number } {
  const [se, sd, id, ie] = q;
  const dist = (a: Ponto, b: Ponto) => Math.hypot(a.x - b.x, a.y - b.y);
  const larguraMedida = Math.max(dist(se, sd), dist(ie, id));
  const alturaMedida = Math.max(dist(se, ie), dist(sd, id));
  if (proporcao === null) return { largura: larguraMedida, altura: alturaMedida };
  if (larguraMedida >= alturaMedida) {
    return { largura: larguraMedida, altura: larguraMedida / proporcao };
  }
  return { largura: alturaMedida * proporcao, altura: alturaMedida };
}
