/**
 * O tratamento que o Modo Aula faz na foto da lousa [D1]: acha os cantos do
 * quadro, endireita a perspectiva, iguala a luz e realca o traco.
 *
 * Ate a Sprint 4 a tela de processamento so fingia isso: entortava a foto de
 * proposito e animava de volta, e o "depois" era a foto original. Agora o antes
 * e o depois sao duas imagens diferentes, e o depois e o que vai para a aula.
 *
 * Este arquivo recebe a API do Skia por parametro e so importa tipos do pacote.
 * Assim o mesmo codigo roda no aparelho e num teste no computador, sobre o
 * CanvasKit, sem React Native.
 *
 * O que ele promete, e o que nao promete: reflexo estourado nao se recupera com
 * uma foto so, porque ali nao sobrou traco nenhum. O que ele faz e deixar a luz
 * por igual (sombra e degrade somem) e o traco forte sobre fundo limpo.
 */

import type {
  AlphaType,
  ColorType,
  FilterMode,
  MipmapMode,
  Skia,
  SkImage,
  SkSurface,
  TileMode,
} from '@shopify/react-native-skia';

import type { Deteccao, Quadrilatero } from './quadro';
import { detectarQuadro, homografiaDoQuadrado, proporcaoReal, tamanhoEndireitado } from './quadro';

// Valores dos enums do Skia. Importar o enum em si puxaria o React Native, e
// este arquivo precisa rodar tambem fora dele.
const CLAMP = 0 as TileMode;
const LINEAR = 1 as FilterMode;
const SEM_MIPMAP = 0 as MipmapMode;
const RGBA_8888 = 4 as ColorType;
const SEM_PREMULTIPLICAR = 3 as AlphaType;

/** Lado maior da imagem onde os cantos sao procurados. */
const LADO_DETECCAO = 320;
/** Lado maior da foto que o visor tira para procurar a lousa. Basta para dizer
 *  se ha lousa escrita, e a conta roda na thread do JavaScript: quanto menor,
 *  menos o visor engasga. O minimo de traco foi medido neste tamanho. */
export const LADO_PROCURA = 200;
/** Lado maior da lousa tratada. Mais que isso nao melhora leitura nem tela. */
const LADO_SAIDA = 1600;
/** O fundo e estimado em resolucao reduzida: e so luz, nao tem detalhe. */
const REDUCAO_FUNDO = 4;

/** Endireita: cada pixel da saida busca o ponto correspondente na foto. */
const SKSL_PERSPECTIVA = `
uniform shader foto;
uniform float2 tamanho;
uniform float3 eixoX;
uniform float3 eixoY;
uniform float2 profundidade;

half4 main(float2 p) {
  float u = p.x / tamanho.x;
  float v = p.y / tamanho.y;
  float w = profundidade.x * u + profundidade.y * v + 1.0;
  float2 origem = float2(
    eixoX.x * u + eixoX.y * v + eixoX.z,
    eixoY.x * u + eixoY.y * v + eixoY.z
  ) / w;
  return foto.eval(origem);
}
`;

/**
 * Iguala a luz dividindo a foto pelo fundo estimado: onde havia sombra, o fundo
 * tambem era escuro, e a divisao devolve o branco. Depois, levels e uma curva
 * levantam o branco e escurecem o traco sem apagar a cor da caneta.
 *
 * Lousa escura faz o caminho inverso: mede quanto cada ponto e mais claro que o
 * fundo. Diferenca pequena e ruido do sensor ou degrau de cor, e volta a ser
 * quadro; so o traco de giz de verdade clareia, com a cor do giz. Amplificar
 * toda diferenca, como na primeira versao, virava granulado e faixas.
 */
const SKSL_LIMPEZA = `
uniform shader lousa;
uniform shader fundo;
uniform float2 escalaFundo;
uniform float claro;

half4 main(float2 p) {
  half3 c = lousa.eval(p).rgb;
  half3 b = fundo.eval(p * escalaFundo).rgb;
  if (claro > 0.5) {
    half3 n = clamp(c / max(b, half3(0.08)), 0.0, 1.0);
    n = clamp((n - 0.22) / 0.68, 0.0, 1.0);
    n = pow(n, half3(1.8));
    return half4(n, 1.0);
  }
  half forca = dot(c - b, half3(0.299, 0.587, 0.114));
  half traco = smoothstep(0.035, 0.2, forca);
  half3 quadro = b * 0.6;
  half3 giz = clamp(c * 1.2 + 0.08, 0.0, 1.0);
  return half4(mix(quadro, giz, traco), 1.0);
}
`;

export type ResultadoTratamento = {
  imagem: SkImage;
  largura: number;
  altura: number;
  /** Os cantos do quadro foram achados e a perspectiva foi endireitada. Falso
   *  quando so a luz e o traco foram tratados. */
  perspectiva: boolean;
  /** Quadro claro (branco, papel, slide) ou escuro (lousa verde ou preta). */
  claro: boolean;
  /** Cantos achados, normalizados, para a tela poder mostrar onde estava o quadro. */
  cantos: Quadrilatero | null;
};

function superficie(skia: typeof Skia, largura: number, altura: number): SkSurface | null {
  return skia.Surface.MakeOffscreen(largura, altura) ?? skia.Surface.Make(largura, altura);
}

function reduzir(largura: number, altura: number, lado: number) {
  const escala = Math.min(1, lado / Math.max(largura, altura));
  return {
    largura: Math.max(1, Math.round(largura * escala)),
    altura: Math.max(1, Math.round(altura * escala)),
  };
}

/** Media de luz da imagem pequena, de 0 a 255. */
function luzMedia(rgba: Uint8Array): number {
  let soma = 0;
  const n = rgba.length / 4;
  for (let i = 0; i < n; i += 1) {
    soma += 0.299 * (rgba[i * 4] ?? 0) + 0.587 * (rgba[i * 4 + 1] ?? 0) + 0.114 * (rgba[i * 4 + 2] ?? 0);
  }
  return n > 0 ? soma / n : 0;
}

/** Copia pequena da foto, em RGBA, onde os cantos sao procurados. */
function pixelsReduzidos(skia: typeof Skia, foto: SkImage, lado: number) {
  const larguraFoto = foto.width();
  const alturaFoto = foto.height();
  const pequena = reduzir(larguraFoto, alturaFoto, lado);
  const sup = skia.Surface.Make(pequena.largura, pequena.altura);
  if (sup === null) throw new Error('superficie da deteccao nao abriu');
  sup
    .getCanvas()
    .drawImageRect(
      foto,
      skia.XYWHRect(0, 0, larguraFoto, alturaFoto),
      skia.XYWHRect(0, 0, pequena.largura, pequena.altura),
      skia.Paint()
    );
  sup.flush();
  const pixels = sup.makeImageSnapshot().readPixels(0, 0, {
    width: pequena.largura,
    height: pequena.altura,
    colorType: RGBA_8888,
    alphaType: SEM_PREMULTIPLICAR,
  });
  if (!(pixels instanceof Uint8Array)) throw new Error('pixels da deteccao nao vieram');
  return { pixels, largura: pequena.largura, altura: pequena.altura };
}

/** O quadro na foto pequena que o visor tira sozinho, para a procura da lousa. */
export function acharQuadro(skia: typeof Skia, foto: SkImage): Deteccao | null {
  if (foto.width() < 16 || foto.height() < 16) return null;
  const pequena = pixelsReduzidos(skia, foto, LADO_PROCURA);
  return detectarQuadro(pequena.pixels, pequena.largura, pequena.altura);
}

/**
 * Trata a foto. Devolve nulo quando nao ha o que tratar com seguranca: sem
 * cantos e com a foto escura no geral, clarear seria estragar uma foto que nem
 * e de lousa.
 *
 * Falha do Skia (superficie que nao abre, shader que nao compila) vira erro, e
 * nao nulo: quem chama precisa saber a diferenca entre "nao tinha lousa" e "nao
 * deu para tratar", porque a tela diz uma coisa ou a outra.
 */
export function tratarImagem(skia: typeof Skia, foto: SkImage): ResultadoTratamento | null {
  const larguraFoto = foto.width();
  const alturaFoto = foto.height();
  if (larguraFoto < 16 || alturaFoto < 16) return null;

  // 1. Cantos, numa copia pequena.
  const pequena = pixelsReduzidos(skia, foto, LADO_DETECCAO);
  const deteccao = detectarQuadro(pequena.pixels, pequena.largura, pequena.altura);
  const claro = deteccao?.claro ?? luzMedia(pequena.pixels) > 110;
  if (deteccao === null && !claro) return null;

  // 2. Perspectiva. Sem cantos, a foto segue inteira, so com a luz tratada.
  const cantosFoto: Quadrilatero = deteccao
    ? (deteccao.cantos.map((p) => ({ x: p.x * larguraFoto, y: p.y * alturaFoto })) as Quadrilatero)
    : [
        { x: 0, y: 0 },
        { x: larguraFoto, y: 0 },
        { x: larguraFoto, y: alturaFoto },
        { x: 0, y: alturaFoto },
      ];
  const bruto = tamanhoEndireitado(
    cantosFoto,
    deteccao ? proporcaoReal(cantosFoto, larguraFoto, alturaFoto) : null
  );
  const saida = reduzir(bruto.largura, bruto.altura, LADO_SAIDA);

  const efeitoPerspectiva = skia.RuntimeEffect.Make(SKSL_PERSPECTIVA);
  const supLousa = superficie(skia, saida.largura, saida.altura);
  if (efeitoPerspectiva === null || supLousa === null) throw new Error('perspectiva nao montou');
  const m = homografiaDoQuadrado(cantosFoto);
  const pincelPerspectiva = skia.Paint();
  pincelPerspectiva.setShader(
    efeitoPerspectiva.makeShaderWithChildren(
      [saida.largura, saida.altura, m.a, m.b, m.c, m.d, m.e, m.f, m.g, m.h],
      [foto.makeShaderOptions(CLAMP, CLAMP, LINEAR, SEM_MIPMAP)]
    )
  );
  supLousa.getCanvas().drawPaint(pincelPerspectiva);
  supLousa.flush();
  const lousa = supLousa.makeImageSnapshot();

  // 3. Fundo: so a luz. O traco sai antes do desfoque, para nao escurecer o
  // fundo em volta do texto: dilatar some com caneta escura, erodir some com giz.
  const fundoTam = {
    largura: Math.max(1, Math.round(saida.largura / REDUCAO_FUNDO)),
    altura: Math.max(1, Math.round(saida.altura / REDUCAO_FUNDO)),
  };
  const supFundo = superficie(skia, fundoTam.largura, fundoTam.altura);
  if (supFundo === null) throw new Error('superficie do fundo nao abriu');
  const semTraco = claro
    ? skia.ImageFilter.MakeDilate(4, 4, null)
    : skia.ImageFilter.MakeErode(4, 4, null);
  const pincelFundo = skia.Paint();
  const sigma = Math.max(fundoTam.largura, fundoTam.altura) / 24;
  pincelFundo.setImageFilter(skia.ImageFilter.MakeBlur(sigma, sigma, CLAMP, semTraco));
  supFundo
    .getCanvas()
    .drawImageRect(
      lousa,
      skia.XYWHRect(0, 0, saida.largura, saida.altura),
      skia.XYWHRect(0, 0, fundoTam.largura, fundoTam.altura),
      pincelFundo
    );
  supFundo.flush();
  const fundo = supFundo.makeImageSnapshot();

  // 4. Luz por igual e traco realcado.
  const efeitoLimpeza = skia.RuntimeEffect.Make(SKSL_LIMPEZA);
  const supFinal = superficie(skia, saida.largura, saida.altura);
  if (efeitoLimpeza === null || supFinal === null) throw new Error('limpeza nao montou');
  const pincelFinal = skia.Paint();
  pincelFinal.setShader(
    efeitoLimpeza.makeShaderWithChildren(
      [fundoTam.largura / saida.largura, fundoTam.altura / saida.altura, claro ? 1 : 0],
      [
        lousa.makeShaderOptions(CLAMP, CLAMP, LINEAR, SEM_MIPMAP),
        fundo.makeShaderOptions(CLAMP, CLAMP, LINEAR, SEM_MIPMAP),
      ]
    )
  );
  supFinal.getCanvas().drawPaint(pincelFinal);
  supFinal.flush();

  return {
    imagem: supFinal.makeImageSnapshot(),
    largura: saida.largura,
    altura: saida.altura,
    perspectiva: deteccao !== null,
    claro,
    cantos: deteccao?.cantos ?? null,
  };
}
