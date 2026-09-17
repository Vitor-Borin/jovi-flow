import type { AlphaType, ColorType, Skia } from '@shopify/react-native-skia';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

import { detectarQuadro, temEscrita } from './quadro';

/**
 * Procura a lousa nas fotos pequenas que o visor tira sozinho em Foto. E o que
 * decide o aviso "Lousa reconhecida".
 *
 * A foto do estudante nunca passa por aqui, e o app nao altera a foto que a
 * camera tirou: esta procura so le uma copia de 200 px, apagada logo depois.
 *
 * A matematica mora em quadro.ts, que roda tambem no computador
 * (npm run testar:lousa). O navegador usa procurarLousa.web.ts, que nao procura.
 */

/** Lado maior da foto da procura. Basta para dizer se ha lousa escrita, e a
 *  conta roda na thread do JavaScript: quanto menor, menos o visor engasga. O
 *  minimo de traco de quadro.ts foi medido neste tamanho. */
const LADO_PROCURA = 200;

// Valores dos enums do Skia, escritos aqui porque os enums moram na raiz do
// pacote, que nao pode ser carregada (ver skiaNativo).
const RGBA_8888 = 4 as ColorType;
const SEM_PREMULTIPLICAR = 3 as AlphaType;

/**
 * A API do Skia, ligada na primeira vez que ela e preciso.
 *
 * Nunca pela raiz do pacote: a raiz carrega tambem o video do Skia, que chama o
 * react-native-reanimated assim que abre, e sem ele instalado o app nem inicia
 * ("react-native-reanimated is not installed!"). O NativeSetup so liga o Skia
 * nativo e deixa a API em globalThis.SkiaApi, que e o mesmo objeto que a raiz
 * exporta como Skia. Carregado aqui, dentro de try, um Skia com problema so
 * desliga a procura: o app abre e o estudante escolhe Aula no carrossel. O
 * caminho vale para a versao fixada no package.json.
 */
function skiaNativo(): typeof Skia | null {
  try {
    require('@shopify/react-native-skia/lib/module/skia/NativeSetup');
    return globalThis.SkiaApi ?? null;
  } catch (erro) {
    console.log('[JOVI Flow] Skia nativo indisponivel:', erro);
    return null;
  }
}

/**
 * Procura uma lousa escrita na foto pequena do visor: quadro inteiro na foto e
 * traco dentro dele. Cada procura vai para o log, para o limiar poder ser
 * conferido com numero do aparelho.
 */
export async function procurarLousa(uri: string, largura: number, altura: number): Promise<boolean> {
  const inicio = Date.now();
  const skia = skiaNativo();
  if (skia === null) return false;
  try {
    const reduzida = await manipulateAsync(
      uri,
      [largura >= altura ? { resize: { width: LADO_PROCURA } } : { resize: { height: LADO_PROCURA } }],
      { base64: true, compress: 0.9, format: SaveFormat.JPEG }
    );
    if (!reduzida.base64) return false;
    const foto = skia.Image.MakeImageFromEncoded(skia.Data.fromBase64(reduzida.base64));
    if (foto === null) return false;

    const larguraPx = foto.width();
    const alturaPx = foto.height();
    const rgba = foto.readPixels(0, 0, {
      width: larguraPx,
      height: alturaPx,
      colorType: RGBA_8888,
      alphaType: SEM_PREMULTIPLICAR,
    });
    if (!(rgba instanceof Uint8Array)) return false;

    const quadro = detectarQuadro(rgba, larguraPx, alturaPx);
    const lousa = quadro !== null && temEscrita(quadro);
    console.log(
      `[JOVI Flow] procura: ${
        quadro
          ? `quadro com ${Math.round(quadro.area * 100)}% da foto, traco ${(quadro.detalhe * 100).toFixed(1)}%`
          : 'sem quadro'
      } -> ${lousa ? 'LOUSA' : 'nada'} (${Date.now() - inicio}ms)`
    );
    return lousa;
  } catch (erro) {
    console.log('[JOVI Flow] procura da lousa falhou:', erro);
    return false;
  }
}
