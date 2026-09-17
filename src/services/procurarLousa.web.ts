/**
 * Versao do navegador: nao procura a lousa. O build web serve para conferir
 * telas sem celular, e carregar o Skia no navegador exigiria baixar o CanvasKit
 * so para isso. O visor fica em Foto ate o usuario escolher Aula.
 */
export async function procurarLousa(
  _uri: string,
  _largura: number,
  _altura: number
): Promise<boolean> {
  return false;
}
