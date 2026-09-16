import type { ResultadoLousa } from './tratarLousa';

/**
 * Versao do navegador: nao trata nada e nao acha lousa. O build web serve para
 * conferir telas sem celular. Carregar o Skia no navegador exigiria baixar o
 * CanvasKit so para isso; a tela de processamento pula o antes e depois quando
 * nao ha tratamento, e o visor fica em Foto ate o usuario escolher Aula.
 *
 * O tipo vem de tratarLousa.ts so para o TypeScript: import de tipo some no
 * build, e o navegador nunca carrega aquele arquivo.
 */

export async function procurarLousa(
  _uri: string,
  _largura: number,
  _altura: number
): Promise<boolean> {
  return false;
}

export async function tratarLousa(
  _uri: string,
  _largura: number,
  _altura: number
): Promise<ResultadoLousa> {
  return { estado: 'indisponivel' };
}
