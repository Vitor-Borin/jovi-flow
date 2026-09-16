/**
 * Teste do tratamento e da procura da lousa, no computador, sem celular.
 *
 *   npm run testar:lousa
 *
 * Monta cenas 3D sinteticas (lousa branca, lousa verde, caderno, lousa vazia,
 * janela, parede) vistas de lado por uma camera com foco de celular, e roda
 * sobre elas o MESMO codigo do app: src/services/quadro.ts e
 * src/services/tratamentoLousa.ts, compilados na hora, com o Skia do CanvasKit
 * no lugar do Skia do aparelho.
 *
 * Confere o que da para saber com certeza numa cena sintetica, porque ali os
 * cantos e a proporcao reais sao conhecidos: erro dos cantos, proporcao da lousa
 * endireitada, quadro claro ou escuro, e se a procura do visor afirma "lousa"
 * so onde ha lousa escrita. Grava antes e depois em scripts/saida-lousa/.
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
/** Tolerancias do que a cena sintetica permite exigir. */
const ERRO_MAXIMO_CANTOS = 0.01;
const ERRO_MAXIMO_PROPORCAO = 0.02;

function compilar() {
  fs.rmSync(COMPILADO, { recursive: true, force: true });
  execFileSync(
    process.execPath,
    [
      require.resolve('typescript/bin/tsc'),
      path.join(RAIZ, 'src/services/quadro.ts'),
      path.join(RAIZ, 'src/services/tratamentoLousa.ts'),
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
      '--esModuleInterop',
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

async function main() {
  compilar();
  const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit.js');
  const pastaWasm = path.dirname(require.resolve('canvaskit-wasm/bin/full/canvaskit.js'));
  global.CanvasKit = await CanvasKitInit({ locateFile: (f) => path.join(pastaWasm, f) });
  const { JsiSkApi } = require('@shopify/react-native-skia/lib/commonjs/skia/web/JsiSkia.js');
  const Skia = JsiSkApi(global.CanvasKit);
  const { homografiaDoQuadrado, temEscrita } = require(path.join(COMPILADO, 'quadro.js'));
  const { acharQuadro, tratarImagem } = require(path.join(COMPILADO, 'tratamentoLousa.js'));

  fs.mkdirSync(SAIDA, { recursive: true });
  const CLAMP = 0;
  const LINEAR = 1;
  const MIPMAP_LINEAR = 2;

  const png = (img, nome) =>
    fs.writeFileSync(path.join(SAIDA, nome), Buffer.from(img.encodeToBase64(4, 100), 'base64'));

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

    let cantos = null;
    if (cena.quadro) {
      cantos = projetar(cena.quadro, L, A);
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
    return { foto: sup.makeImageSnapshot(), cantos, L, A };
  }

  /** A foto pequena da procura, reduzida com filtro como o aparelho reduz. */
  function reduzirParaProcura(foto, L, A) {
    const escala = LADO_PROCURA / Math.max(L, A);
    const w = Math.round(L * escala);
    const h = Math.round(A * escala);
    const sup = Skia.Surface.Make(w, h);
    sup
      .getCanvas()
      .drawImageRectOptions(foto, Skia.XYWHRect(0, 0, L, A), Skia.XYWHRect(0, 0, w, h), LINEAR, MIPMAP_LINEAR, Skia.Paint());
    sup.flush();
    return sup.makeImageSnapshot();
  }

  const paredeEscura = ['#7C7368', '#5F574D'];
  const paredeClara = ['#D8D2C4', '#C3BBAA'];
  const deLado = { largura: 1.6, altura: 1.0, centro: [0.1, -0.05, 2.4], guinada: 32, arfagem: 6 };
  const verdeDeLado = { largura: 1.6, altura: 1.0, centro: [-0.05, 0.0, 2.3], guinada: -28, arfagem: -5 };

  // `espera` diz o que a cena tem de dar. `null` em tratada = nada para tratar.
  const cenas = [
    {
      nome: 'branca',
      tipo: 'branca',
      escrita: true,
      quadro: deLado,
      parede: paredeEscura,
      reflexo: true,
      espera: { tratada: { perspectiva: true, claro: true }, lousa: true },
    },
    {
      nome: 'verde',
      tipo: 'verde',
      escrita: true,
      quadro: verdeDeLado,
      parede: paredeClara,
      espera: { tratada: { perspectiva: true, claro: false }, lousa: true },
    },
    {
      nome: 'caderno',
      tipo: 'caderno',
      escrita: true,
      quadro: { largura: 0.707, altura: 1.0, centro: [0.0, 0.05, 1.7], guinada: 12, arfagem: 38 },
      parede: ['#6B4F36', '#4E3826'],
      espera: { tratada: { perspectiva: true, claro: true }, lousa: true },
    },
    {
      // Lousa enchendo a foto: sem os cantos dentro dela, trata so a luz.
      nome: 'cheia',
      tipo: 'branca',
      escrita: true,
      quadro: { largura: 1.6, altura: 1.0, centro: [0.0, 0.0, 0.9], guinada: 10, arfagem: 0 },
      parede: paredeEscura,
      espera: { tratada: { perspectiva: false, claro: true }, lousa: false },
    },
    {
      nome: 'lousa-vazia',
      tipo: 'branca',
      escrita: false,
      quadro: deLado,
      parede: paredeEscura,
      reflexo: true,
      espera: { tratada: { perspectiva: true, claro: true }, lousa: false },
    },
    {
      nome: 'verde-vazia',
      tipo: 'verde',
      escrita: false,
      quadro: verdeDeLado,
      parede: paredeClara,
      espera: { tratada: { perspectiva: true, claro: false }, lousa: false },
    },
    {
      // Retangulo claro com textura: o tratamento endireita, mas nao e lousa.
      nome: 'janela',
      tipo: 'janela',
      quadro: null,
      parede: paredeEscura,
      espera: { lousa: false },
    },
    {
      nome: 'porta-e-mesa',
      tipo: 'nenhum',
      quadro: null,
      parede: paredeEscura,
      espera: { tratada: null, lousa: false },
    },
  ];

  let falhas = 0;
  for (const cena of cenas) {
    const { foto, cantos, L, A } = fotografar(cena);
    png(foto, `${cena.nome}-antes.png`);
    const problemas = [];
    const linha = { cena: cena.nome };

    const inicio = Date.now();
    const r = tratarImagem(Skia, foto);
    linha.msTratamento = Date.now() - inicio;
    if (r === null) {
      linha.tratamento = 'nada para tratar';
    } else {
      png(r.imagem, `${cena.nome}-depois.png`);
      linha.tratamento = `${r.largura}x${r.altura}, ${r.perspectiva ? 'endireitada' : 'so a luz'}, ${r.claro ? 'clara' : 'escura'}`;
      if (cena.quadro && r.perspectiva) {
        const real = cena.quadro.largura / cena.quadro.altura;
        const erroProporcao = Math.abs(r.largura / r.altura - real) / real;
        linha.erroProporcao = `${(erroProporcao * 100).toFixed(1)}%`;
        if (erroProporcao > ERRO_MAXIMO_PROPORCAO) problemas.push('proporcao da lousa endireitada');
      }
      if (cantos && r.cantos && cantos.every((p) => p.x > 0 && p.x < L && p.y > 0 && p.y < A)) {
        const erroCantos = Math.max(
          ...r.cantos.map((p, i) => Math.hypot(p.x - cantos[i].x / (L - 1), p.y - cantos[i].y / (A - 1)))
        );
        linha.erroCantos = `${(erroCantos * 100).toFixed(2)}%`;
        if (erroCantos > ERRO_MAXIMO_CANTOS) problemas.push('cantos longe dos reais');
      }
    }
    if ('tratada' in cena.espera) {
      const esperado = cena.espera.tratada;
      if (esperado === null && r !== null) problemas.push('tratou uma foto sem lousa');
      if (esperado !== null && r === null) problemas.push('nao tratou');
      if (esperado !== null && r !== null) {
        if (r.perspectiva !== esperado.perspectiva) problemas.push(`perspectiva deveria ser ${esperado.perspectiva}`);
        if (r.claro !== esperado.claro) problemas.push(`claro deveria ser ${esperado.claro}`);
      }
    }

    const quadro = acharQuadro(Skia, reduzirParaProcura(foto, L, A));
    const lousa = quadro !== null && temEscrita(quadro);
    linha.procura = quadro
      ? `quadro com traco ${(quadro.detalhe * 100).toFixed(1)}% -> ${lousa ? 'LOUSA' : 'nada'}`
      : 'sem quadro -> nada';
    if (lousa !== cena.espera.lousa) {
      problemas.push(cena.espera.lousa ? 'a procura nao achou a lousa' : 'a procura afirmou lousa onde nao ha');
    }

    linha.resultado = problemas.length === 0 ? 'ok' : `FALHOU: ${problemas.join('; ')}`;
    if (problemas.length > 0) falhas += 1;
    console.log(JSON.stringify(linha));
  }

  console.log(`\n${cenas.length - falhas} de ${cenas.length} cenas conferem. Imagens em ${SAIDA}`);
  if (falhas > 0) process.exit(1);
}

main().catch((erro) => {
  console.error('O teste nao rodou:', erro);
  process.exit(1);
});
