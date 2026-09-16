import { ImageFormat, Skia } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

import type { Quadrilatero } from './quadro';
import { tratarImagem } from './tratamentoLousa';

/**
 * Trata a foto da lousa no aparelho [D1] e grava o resultado como JPEG.
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

/** Lado maior da foto que entra no tratamento. A camera entrega 12 MP; tratar
 *  isso inteiro so gasta memoria e tempo, a lousa sai com 1600 px no maximo. */
const LADO_ENTRADA = 2000;

export async function tratarLousa(
  uri: string,
  largura: number,
  altura: number
): Promise<ResultadoLousa> {
  const inicio = Date.now();
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

    const foto = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64(reduzida.base64));
    if (foto === null) throw new Error('o Skia nao leu a foto');

    const resultado = tratarImagem(Skia, foto);
    if (resultado === null) {
      console.log(`[JOVI Flow] nenhuma lousa para tratar (${Date.now() - inicio}ms), seguindo com a original`);
      return { estado: 'sem-lousa' };
    }

    const jpeg = resultado.imagem.encodeToBase64(ImageFormat.JPEG, 90);
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
