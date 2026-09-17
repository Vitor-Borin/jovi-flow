import type { ImageFormat, Skia } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

import type { Quadrilatero } from './quadro';
import { temEscrita } from './quadro';
import { LADO_PROCURA, acharQuadro, tratarImagem } from './tratamentoLousa';

/**
 * Trata a foto da lousa no aparelho [D1] e grava o resultado como JPEG, e
 * procura a lousa nas fotos pequenas que o visor tira sozinho em Foto.
 *
 * A matematica e os shaders moram em tratamentoLousa.ts, que roda tambem no
 * computador. Aqui fica o que depende do aparelho: ler a foto, reduzir, gravar.
 * O navegador usa tratarLousa.web.ts, que nao trata nada.
 */

export type LousaTratada = {
  uri: string;
  largura: number;
  altura: number;
  /** Os cantos do quadro foram achados e a perspectiva foi endireitada. */
  perspectiva: boolean;
  /** Quadro claro (branco, papel, slide) ou escuro (lousa verde ou preta). */
  claro: boolean;
  /** Onde o quadro estava na foto, de 0 a 1. Nulo quando nao achou os cantos. */
  cantos: Quadrilatero | null;
  /** Largura sobre altura da foto que entrou, ja na orientacao em que aparece. */
  proporcaoFoto: number;
  /** O tratamento inteiro no aparelho: ler, tratar e gravar. */
  ms: number;
};

/** O que aconteceu com a foto. A tela diz exatamente isto, nem mais nem menos. */
export type ResultadoLousa =
  | { estado: 'tratada'; lousa: LousaTratada }
  /** Nenhum quadro inteiro na foto, e ela e escura demais para tratar so a luz. */
  | { estado: 'sem-lousa' }
  | { estado: 'falhou' }
  /** O navegador nao trata foto. */
  | { estado: 'indisponivel' };

/** ImageFormat.JPEG. O valor vem escrito aqui porque o enum mora na raiz do
 *  pacote, que nao pode ser carregada (ver skiaNativo). */
const JPEG = 3 as ImageFormat;

/** Lado maior da foto que entra no tratamento. A camera entrega 12 MP; tratar
 *  isso inteiro so gasta memoria e tempo, a lousa sai com 1600 px no maximo. */
const LADO_ENTRADA = 2000;

/**
 * A API do Skia, ligada na primeira vez que ela e preciso.
 *
 * Nunca pela raiz do pacote: a raiz carrega tambem o video do Skia, que chama o
 * react-native-reanimated assim que abre, e sem ele instalado o app nem inicia
 * ("react-native-reanimated is not installed!"). O NativeSetup so liga o Skia
 * nativo e deixa a API em globalThis.SkiaApi, que e o mesmo objeto que a raiz
 * exporta como Skia. Carregado aqui, dentro de try, um Skia com problema so
 * desliga o tratamento: o app abre e a foto segue original. O caminho vale para
 * a versao fixada no package.json.
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
 * Procura uma lousa escrita na foto pequena que o visor tira sozinho em Foto. E
 * o que decide o aviso "Lousa reconhecida": sem quadro inteiro na foto e sem
 * traco dentro dele, a camera nao troca de modo. Cada procura vai para o log,
 * para o limiar poder ser conferido com numero do aparelho.
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

    const quadro = acharQuadro(skia, foto);
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

export async function tratarLousa(
  uri: string,
  largura: number,
  altura: number
): Promise<ResultadoLousa> {
  const inicio = Date.now();
  const skia = skiaNativo();
  if (skia === null) return { estado: 'falhou' };
  try {
    const maior = Math.max(largura, altura);
    const acoes =
      maior > LADO_ENTRADA
        ? [largura >= altura ? { resize: { width: LADO_ENTRADA } } : { resize: { height: LADO_ENTRADA } }]
        : [];
    const reduzida = await manipulateAsync(uri, acoes, {
      base64: true,
      compress: 0.95,
      format: SaveFormat.JPEG,
    });
    if (!reduzida.base64) throw new Error('a foto reduzida veio sem base64');

    const foto = skia.Image.MakeImageFromEncoded(skia.Data.fromBase64(reduzida.base64));
    if (foto === null) throw new Error('o Skia nao leu a foto');

    const resultado = tratarImagem(skia, foto);
    if (resultado === null) {
      console.log(`[JOVI Flow] nenhuma lousa para tratar (${Date.now() - inicio}ms), seguindo com a original`);
      return { estado: 'sem-lousa' };
    }

    const jpeg = resultado.imagem.encodeToBase64(JPEG, 90);
    const pasta = FileSystem.cacheDirectory;
    if (pasta === null || jpeg.length === 0) throw new Error('nao deu para gravar a lousa tratada');
    const destino = `${pasta}lousa-${Date.now()}.jpg`;
    await FileSystem.writeAsStringAsync(destino, jpeg, { encoding: FileSystem.EncodingType.Base64 });

    const ms = Date.now() - inicio;
    console.log(
      `[JOVI Flow] lousa tratada em ${ms}ms: ${resultado.largura}x${resultado.altura}, ` +
        `${resultado.perspectiva ? 'perspectiva endireitada' : 'sem cantos, so a luz'}, ` +
        `${resultado.claro ? 'quadro claro' : 'quadro escuro'}`
    );
    return {
      estado: 'tratada',
      lousa: {
        uri: destino,
        largura: resultado.largura,
        altura: resultado.altura,
        perspectiva: resultado.perspectiva,
        claro: resultado.claro,
        cantos: resultado.cantos,
        proporcaoFoto: foto.width() / foto.height(),
        ms,
      },
    };
  } catch (erro) {
    // Sem tratamento a aula segue com a foto original: nada quebra na demo.
    console.log('[JOVI Flow] tratamento da lousa falhou, seguindo com a original:', erro);
    return { estado: 'falhou' };
  }
}
