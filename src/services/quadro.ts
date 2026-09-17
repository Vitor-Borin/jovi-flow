/**
 * Acha a lousa numa foto pequena: um quadro inteiro na foto, com escrita dentro.
 * E o que decide o aviso "Lousa reconhecida" no visor. A foto do estudante nao
 * e alterada: isto so le os pixels de uma copia pequena.
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
 *
 * Achar o quadro nao basta para dizer que e lousa: porta, tela apagada e janela
 * tambem sao retangulos. Por isso a deteccao mede quanto traco ha no miolo do
 * quadro, e o visor so afirma "Lousa reconhecida" com escrita dentro.
 */

type Ponto = { x: number; y: number };

/** Cantos na ordem superior esquerdo, superior direito, inferior direito e
 *  inferior esquerdo. */
type Quadrilatero = [Ponto, Ponto, Ponto, Ponto];

export type Deteccao = {
  /** Quadro mais claro que o entorno: quadro branco, papel ou slide. Falso para
   *  lousa verde ou preta. */
  claro: boolean;
  /** Fracao da foto ocupada pelo quadrilatero. */
  area: number;
  /** Fracao do miolo do quadro que e traco, de 0 a 1. Ver `temEscrita`. */
  detalhe: number;
};

/** Abaixo disso o quadro e pequeno demais na foto para ser a lousa fotografada. */
const AREA_MINIMA = 0.12;
/** Parede, janela e mesa nao preenchem o quadrilatero dos proprios extremos. */
const PREENCHIMENTO_MINIMO = 0.8;
/** Angulo interno fora desta faixa e perspectiva impossivel ou cantos errados. */
const ANGULO_MINIMO = 35;
const ANGULO_MAXIMO = 145;
/** Canto a menos disso da borda da foto conta como encostado na borda. */
const MARGEM_BORDA = 2;
/** Fracoes da distribuicao de luz testadas como limiar, alem do de Otsu. */
const PERCENTIS = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85];
/** Quadro assim ja e o quadro: para de testar limiar e poupa o aparelho. */
const PREENCHIMENTO_SOBRA = 0.96;
const AREA_SOBRA = 0.2;
/** A medida de traco ignora esta fracao da borda do quadro, para a moldura e o
 *  contorno contra a parede nao contarem como escrita. */
const RECUO_DETALHE = 0.2;
/** Diferenca de luz para os vizinhos da direita e de baixo, somada, a partir da
 *  qual o pixel conta como traco (0 a 510). */
const LIMIAR_TRACO = 20;
/**
 * Traco minimo no miolo para o quadro contar como lousa escrita. Medido numa
 * imagem de 200 px, o tamanho da procura pelo visor: lousa branca ou verde
 * escrita deu de 15 a 17%, caderno 50%, lousa vazia 0% e janela com caixilho
 * 0,2%. Janela com arvore ou predio ocupando o vidro ainda passa: e o limite
 * conhecido.
 */
const DETALHE_MINIMO = 0.015;

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
  // os cantos dentro da foto nao da para dizer que e um quadro.
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
 * Procura o quadro numa imagem RGBA pequena, de umas 200 px no lado maior.
 * Devolve nulo quando nao ha quadro confiavel: e melhor nao reconhecer do que
 * afirmar uma lousa que nao esta la.
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

  return {
    claro: melhor.claro,
    area: melhor.area,
    detalhe: detalheDoMiolo(lum, largura, altura, melhor.cantos),
  };
}

/**
 * Quanto do miolo do quadro e traco: pixel com diferenca de luz forte para o
 * vizinho. Separa quadro escrito de retangulo liso, como parede, porta, tela
 * apagada ou lousa vazia. Sombra e degrade mudam a luz devagar e nao contam.
 */
function detalheDoMiolo(
  lum: Uint8Array,
  largura: number,
  altura: number,
  cantos: Quadrilatero
): number {
  const cx = cantos.reduce((s, q) => s + q.x, 0) / 4;
  const cy = cantos.reduce((s, q) => s + q.y, 0) / 4;
  const [a, b, c, d] = cantos.map((q) => ({
    x: cx + (q.x - cx) * (1 - RECUO_DETALHE),
    y: cy + (q.y - cy) * (1 - RECUO_DETALHE),
  })) as Quadrilatero;
  const sinal = lado(a, b, c) >= 0 ? 1 : -1;
  const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x, d.x)));
  const maxX = Math.min(largura - 2, Math.ceil(Math.max(a.x, b.x, c.x, d.x)));
  const minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y, d.y)));
  const maxY = Math.min(altura - 2, Math.ceil(Math.max(a.y, b.y, c.y, d.y)));

  let dentro = 0;
  let traco = 0;
  const p = { x: 0, y: 0 };
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      p.x = x;
      p.y = y;
      if (
        sinal * lado(a, b, p) < 0 ||
        sinal * lado(b, c, p) < 0 ||
        sinal * lado(c, d, p) < 0 ||
        sinal * lado(d, a, p) < 0
      ) {
        continue;
      }
      dentro += 1;
      const i = y * largura + x;
      const v = lum[i] ?? 0;
      const direita = Math.abs((lum[i + 1] ?? 0) - v);
      const abaixo = Math.abs((lum[i + largura] ?? 0) - v);
      if (direita + abaixo >= LIMIAR_TRACO) traco += 1;
    }
  }
  return dentro > 0 ? traco / dentro : 0;
}

/** O quadro achado tem escrita. So com isso o visor afirma que achou uma lousa. */
export function temEscrita(deteccao: Deteccao): boolean {
  return deteccao.detalhe >= DETALHE_MINIMO;
}
