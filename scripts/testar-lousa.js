/**
 * Teste da procura da lousa, no computador, sem celular.
 *
 *   npm run testar:lousa
 *
 * Monta cenas 3D sinteticas (lousa branca, lousa verde, caderno, lousa vazia,
 * janela, porta) vistas de lado por uma camera com foco de celular, reduz cada
 * foto para 200 px como o visor faz, e roda nela o MESMO codigo do app:
 * src/services/quadro.ts, compilado na hora, com o Skia do CanvasKit no lugar do
 * Skia do aparelho.
 *
 * Confere se a procura afirma "lousa" so onde ha lousa escrita: e isso que
 * decide o aviso "Lousa reconhecida". As fotos das cenas ficam em
 * scripts/saida-lousa/.
 *
 * O que ele nao prova: foto real tem ruido, reflexo de verdade, lousa suja e
 * lente com distorcao. O teste no aparelho continua obrigatorio.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const SAIDA = path.join(__dirname, 'saida-lousa');
const COMPILADO = path.join(os.tmpdir(), 'jovi-flow-testar-lousa');

/** Mesma reducao que o visor faz antes de procurar a lousa. */
const LADO_PROCURA = 200;

function compilar() {
  fs.rmSync(COMPILADO, { recursive: true, force: true });
  execFileSync(
    process.execPath,
    [
      require.resolve('typescript/bin/tsc'),
      path.join(RAIZ, 'src/services/quadro.ts'),
      '--ignoreConfig',
      '--ignoreDeprecations',
      '6.0',
      '--outDir',
      COMPILADO,
      '--module',
      'commonjs',
      '--target',
      'es2020',
      '--moduleResolution',
      'node',
      '--skipLibCheck',
      '--strict',
    ],
    { stdio: 'inherit' }
  );
}

/** Cantos de um retangulo 3D (largura x altura, em metros) na foto L x A. */
function projetar({ largura, altura, centro, guinada, arfagem }, L, A) {
  const f = 0.6 * Math.hypot(L, A);
  const gy = (guinada * Math.PI) / 180;
  const ax = (arfagem * Math.PI) / 180;
  return [
    [-largura / 2, -altura / 2],
    [largura / 2, -altura / 2],
    [largura / 2, altura / 2],
    [-largura / 2, altura / 2],
  ].map(([x, y]) => {
    // Arfagem em torno de X, depois guinada em torno de Y.
    const y1 = y * Math.cos(ax);
    const z1 = y * Math.sin(ax);
    const x2 = x * Math.cos(gy) + z1 * Math.sin(gy);
    const z2 = -x * Math.sin(gy) + z1 * Math.cos(gy);
    const Z = z2 + centro[2];
    return { x: (f * (x2 + centro[0])) / Z + L / 2, y: (f * (y1 + centro[1])) / Z + A / 2 };
  });
}

/** Homografia do quadrado unitario para o quadrilatero (Heckbert, 1989): leva a
 *  superficie plana do quadro para a posicao dele na foto. */
function homografiaDoQuadrado([p0, p1, p2, p3]) {
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const dy3 = p0.y - p1.y + p2.y - p3.y;
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

async function main() {
  compilar();
  const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit.js');
  const pastaWasm = path.dirname(require.resolve('canvaskit-wasm/bin/full/canvaskit.js'));
  global.CanvasKit = await CanvasKitInit({ locateFile: (f) => path.join(pastaWasm, f) });
  const { JsiSkApi } = require('@shopify/react-native-skia/lib/commonjs/skia/web/JsiSkia.js');
  const Skia = JsiSkApi(global.CanvasKit);
  const { detectarQuadro, temEscrita } = require(path.join(COMPILADO, 'quadro.js'));

  fs.mkdirSync(SAIDA, { recursive: true });
  const CLAMP = 0;
  const LINEAR = 1;
  const MIPMAP_LINEAR = 2;
  const PNG = 4;
  const RGBA_8888 = 4;
  const SEM_PREMULTIPLICAR = 3;

  const pincel = (cor, espessura) => {
    const p = Skia.Paint();
    p.setColor(Skia.Color(cor));
    p.setStyle(1);
    p.setStrokeWidth(espessura);
    p.setStrokeCap(1);
    p.setAntiAlias(true);
    return p;
  };

  /** A superficie do quadro, 1 px por milimetro, com escrita ou vazia. */
  function superficie(largura, altura, tipo, escrita) {
    const sup = Skia.Surface.Make(largura, altura);
    const c = sup.getCanvas();
    const escuro = tipo === 'verde';
    c.clear(Skia.Color(escuro ? '#23402F' : tipo === 'caderno' ? '#FBFAF4' : '#F3F2EC'));
    if (tipo === 'caderno') {
      const pauta = pincel('#9CC3E6', 2);
      for (let y = 90; y < altura; y += 44) c.drawLine(40, y, largura - 40, y, pauta);
      c.drawLine(110, 0, 110, altura, pincel('#E8A0A0', 2));
    }
    if (escrita) {
      const caneta = pincel(escuro ? '#EDEDE4' : '#1B1F2A', 6);
      const azul = pincel(escuro ? '#F2E6A0' : '#1D4ED8', 6);
      const vermelho = pincel(escuro ? '#F7C6C6' : '#B91C1C', 5);
      let x = 140;
      for (const larg of [60, 40, 55, 70, 45]) {
        const p = Skia.Path.Make();
        p.moveTo(x, 110);
        p.cubicTo(x + larg * 0.3, 40, x + larg * 0.7, 150, x + larg, 70);
        c.drawPath(p, caneta);
        x += larg + 22;
      }
      c.drawLine(130, 140, 480, 140, azul);
      const linhas = tipo === 'caderno' ? 12 : 5;
      for (let linha = 0; linha < linhas; linha += 1) {
        let lx = 150;
        const ly = 220 + linha * (tipo === 'caderno' ? 44 : 62);
        while (lx < largura - 120) {
          const larg = 18 + ((lx * 7 + linha * 13) % 30);
          const p = Skia.Path.Make();
          p.moveTo(lx, ly);
          p.quadTo(lx + larg / 2, ly - 28 - ((lx + linha) % 10), lx + larg, ly);
          c.drawPath(p, linha === 2 ? azul : caneta);
          lx += larg + 10 + ((lx + linha * 5) % 18);
        }
      }
      if (tipo !== 'caderno') {
        c.drawRect(Skia.XYWHRect(largura - 330, 150, 250, 110), vermelho);
        c.drawLine(largura - 300, 205, largura - 110, 205, vermelho);
      }
    }
    sup.flush();
    return sup.makeImageSnapshot();
  }

  /** A foto da cena: parede, o quadro (ou uma janela, ou porta e mesa), sombra
   *  lateral e, se pedido, um reflexo estourado. */
  function fotografar(cena) {
    const L = 1200;
    const A = 900;
    const sup = Skia.Surface.Make(L, A);
    const c = sup.getCanvas();
    const parede = Skia.Paint();
    parede.setShader(
      Skia.Shader.MakeLinearGradient(
        Skia.Point(0, 0),
        Skia.Point(0, A),
        cena.parede.map((cor) => Skia.Color(cor)),
        null,
        CLAMP
      )
    );
    c.drawPaint(parede);

    if (cena.quadro) {
      const cantos = projetar(cena.quadro, L, A);
      const larg = Math.round(1000 * cena.quadro.largura);
      const alt = Math.round(1000 * cena.quadro.altura);
      const img = superficie(larg, alt, cena.tipo, cena.escrita);
      const m = homografiaDoQuadrado(cantos);
      c.save();
      c.concat(Skia.Matrix([m.a / larg, m.b / alt, m.c, m.d / larg, m.e / alt, m.f, m.g / larg, m.h / alt, 1]));
      c.drawImage(img, 0, 0);
      c.restore();
    } else if (cena.tipo === 'janela') {
      const ceu = Skia.Paint();
      ceu.setShader(
        Skia.Shader.MakeLinearGradient(
          Skia.Point(0, 200),
          Skia.Point(0, 650),
          [Skia.Color('#BFD9F2'), Skia.Color('#EAF2F8')],
          null,
          CLAMP
        )
      );
      c.drawRect(Skia.XYWHRect(300, 200, 600, 450), ceu);
      const folha = Skia.Paint();
      folha.setColor(Skia.Color('#3E6B3A'));
      for (let k = 0; k < 40; k += 1) {
        c.drawCircle(320 + ((k * 137) % 560), 520 + ((k * 71) % 120), 18 + (k % 5) * 6, folha);
      }
      const caixilho = pincel('#EDEDED', 10);
      c.drawLine(600, 200, 600, 650, caixilho);
      c.drawLine(300, 425, 900, 425, caixilho);
    } else {
      const porta = Skia.Paint();
      porta.setColor(Skia.Color('#4A3B2C'));
      c.drawRect(Skia.XYWHRect(700, 150, 260, 750), porta);
      const mesa = Skia.Paint();
      mesa.setColor(Skia.Color('#9C8B74'));
      c.drawRect(Skia.XYWHRect(0, 620, 1200, 280), mesa);
    }

    const sombra = Skia.Paint();
    sombra.setShader(
      Skia.Shader.MakeLinearGradient(
        Skia.Point(0, 0),
        Skia.Point(L, 0),
        [Skia.Color('rgba(0,0,0,0.55)'), Skia.Color('rgba(0,0,0,0)')],
        null,
        CLAMP
      )
    );
    c.drawPaint(sombra);
    if (cena.reflexo) {
      const brilho = Skia.Paint();
      brilho.setShader(
        Skia.Shader.MakeRadialGradient(
          Skia.Point(780, 330),
          140,
          [Skia.Color('rgba(255,255,255,0.9)'), Skia.Color('rgba(255,255,255,0)')],
          null,
          CLAMP
        )
      );
      c.drawPaint(brilho);
    }
    sup.flush();
    return { foto: sup.makeImageSnapshot(), L, A };
  }

  /** A foto pequena da procura, reduzida com filtro como o aparelho reduz, em
   *  RGBA como o app le. */
  function pixelsDaProcura(foto, L, A) {
    const escala = LADO_PROCURA / Math.max(L, A);
    const w = Math.round(L * escala);
    const h = Math.round(A * escala);
    const sup = Skia.Surface.Make(w, h);
    sup
      .getCanvas()
      .drawImageRectOptions(foto, Skia.XYWHRect(0, 0, L, A), Skia.XYWHRect(0, 0, w, h), LINEAR, MIPMAP_LINEAR, Skia.Paint());
    sup.flush();
    const rgba = sup.makeImageSnapshot().readPixels(0, 0, {
      width: w,
      height: h,
      colorType: RGBA_8888,
      alphaType: SEM_PREMULTIPLICAR,
    });
    return { rgba, w, h };
  }

  const paredeEscura = ['#7C7368', '#5F574D'];
  const paredeClara = ['#D8D2C4', '#C3BBAA'];
  const deLado = { largura: 1.6, altura: 1.0, centro: [0.1, -0.05, 2.4], guinada: 32, arfagem: 6 };
  const verdeDeLado = { largura: 1.6, altura: 1.0, centro: [-0.05, 0.0, 2.3], guinada: -28, arfagem: -5 };

  // `lousa` diz o que a procura tem de responder em cada cena.
  const cenas = [
    { nome: 'branca', tipo: 'branca', escrita: true, quadro: deLado, parede: paredeEscura, reflexo: true, lousa: true },
    { nome: 'verde', tipo: 'verde', escrita: true, quadro: verdeDeLado, parede: paredeClara, lousa: true },
    {
      nome: 'caderno',
      tipo: 'caderno',
      escrita: true,
      quadro: { largura: 0.707, altura: 1.0, centro: [0.0, 0.05, 1.7], guinada: 12, arfagem: 38 },
      parede: ['#6B4F36', '#4E3826'],
      lousa: true,
    },
    {
      // Lousa enchendo a foto: sem os cantos dentro dela, nao da para afirmar.
      nome: 'cheia',
      tipo: 'branca',
      escrita: true,
      quadro: { largura: 1.6, altura: 1.0, centro: [0.0, 0.0, 0.9], guinada: 10, arfagem: 0 },
      parede: paredeEscura,
      lousa: false,
    },
    { nome: 'lousa-vazia', tipo: 'branca', escrita: false, quadro: deLado, parede: paredeEscura, reflexo: true, lousa: false },
    { nome: 'verde-vazia', tipo: 'verde', escrita: false, quadro: verdeDeLado, parede: paredeClara, lousa: false },
    // Retangulo claro com textura: tem forma de quadro, mas nao e lousa escrita.
    { nome: 'janela', tipo: 'janela', quadro: null, parede: paredeEscura, lousa: false },
    { nome: 'porta-e-mesa', tipo: 'nenhum', quadro: null, parede: paredeEscura, lousa: false },
  ];

  let falhas = 0;
  for (const cena of cenas) {
    const { foto, L, A } = fotografar(cena);
    png(foto, `${cena.nome}.png`);

    const { rgba, w, h } = pixelsDaProcura(foto, L, A);
    const inicio = Date.now();
    const quadro = detectarQuadro(rgba, w, h);
    const lousa = quadro !== null && temEscrita(quadro);
    const ok = lousa === cena.lousa;
    if (!ok) falhas += 1;
    console.log(
      JSON.stringify({
        cena: cena.nome,
        procura: quadro
          ? `quadro com ${Math.round(quadro.area * 100)}% da foto, traco ${(quadro.detalhe * 100).toFixed(1)}% -> ${lousa ? 'LOUSA' : 'nada'}`
          : 'sem quadro -> nada',
        ms: Date.now() - inicio,
        resultado: ok
          ? 'ok'
          : `FALHOU: ${cena.lousa ? 'a procura nao achou a lousa' : 'a procura afirmou lousa onde nao ha'}`,
      })
    );
  }

  function png(img, nome) {
    fs.writeFileSync(path.join(SAIDA, nome), Buffer.from(img.encodeToBase64(PNG, 100), 'base64'));
  }

  console.log(`\n${cenas.length - falhas} de ${cenas.length} cenas conferem. Fotos em ${SAIDA}`);
  if (falhas > 0) process.exit(1);
}

main().catch((erro) => {
  console.error('O teste nao rodou:', erro);
  process.exit(1);
});
