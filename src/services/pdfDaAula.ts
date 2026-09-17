import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { Aula } from '../data/acervo';
import { textoDaAula } from '../data/acervo';

/**
 * A aula vira um PDF para entregar ou mandar para a turma: foto, resumo, texto
 * lido da lousa, flashcards e questões com gabarito.
 *
 * Nada sai do aparelho: o PDF e montado aqui e so vai para onde o estudante
 * mandar na folha de compartilhamento do iPhone.
 */

/** Lado maior da foto dentro do PDF. Maior que isso so engorda o arquivo. */
const LADO_FOTO = 1400;

function escapar(t: string): string {
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** As fotos da aula em base64, para o PDF nao depender de arquivo externo. */
async function fotosEmBase64(aula: Aula): Promise<string[]> {
  const uris = aula.paginas.map((p) => p.fotoUri).filter((uri): uri is string => uri !== null);
  const fotos: string[] = [];
  for (const uri of uris) {
    try {
      const r = await manipulateAsync(uri, [{ resize: { width: LADO_FOTO } }], {
        base64: true,
        compress: 0.8,
        format: SaveFormat.JPEG,
      });
      if (r.base64) fotos.push(`data:image/jpeg;base64,${r.base64}`);
    } catch (erro) {
      console.log('[JOVI Flow] foto de fora do PDF:', erro);
    }
  }
  return fotos;
}

function html(aula: Aula, fotos: string[]): string {
  const letras = ['a', 'b', 'c', 'd'];
  const gabarito = aula.questoes
    .map((q, i) => `${i + 1}${letras[q.certa] ?? '?'}`)
    .join(' · ');

  return `
<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>${escapar(aula.titulo)}</title>
<style>
  @page { margin: 18mm 16mm; }
  body { font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; color: #15171c; font-size: 12pt; line-height: 1.5; }
  header { border-bottom: 2px solid #1e46e6; padding-bottom: 10px; margin-bottom: 18px; }
  h1 { font-size: 20pt; margin: 0 0 4px; }
  .meta { color: #5b6172; font-size: 10pt; }
  h2 { font-size: 13pt; margin: 22px 0 8px; color: #1e46e6; }
  img { width: 100%; border: 1px solid #d6dae4; border-radius: 6px; margin-bottom: 10px; }
  ul { margin: 0; padding-left: 18px; }
  li { margin-bottom: 6px; }
  pre { white-space: pre-wrap; font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 10pt; background: #f4f6fa; padding: 10px 12px; border-radius: 6px; }
  .cartao { border: 1px solid #d6dae4; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px; }
  .cartao b { display: block; }
  .cartao span { color: #5b6172; }
  .questao { margin-bottom: 12px; }
  .questao ol { margin: 4px 0 0; padding-left: 20px; }
  .gabarito { color: #5b6172; font-size: 10pt; }
  footer { margin-top: 26px; border-top: 1px solid #d6dae4; padding-top: 8px; color: #8a90a0; font-size: 9pt; }
</style>
</head>
<body>
  <header>
    <h1>${escapar(aula.titulo)}</h1>
    <div class="meta">${escapar(aula.pasta.join(' › '))} · ${escapar(aula.data)} às ${escapar(aula.hora)}${
      aula.aoVivo ? ' · conteúdo lido da foto' : ''
    }</div>
  </header>

  ${fotos.length > 0 ? `<h2>A lousa</h2>${fotos.map((f) => `<img src="${f}" alt="Foto da lousa">`).join('')}` : ''}

  ${
    aula.resumo.length > 0
      ? `<h2>Resumo</h2><ul>${aula.resumo.map((r) => `<li>${escapar(r)}</li>`).join('')}</ul>`
      : ''
  }

  <h2>Texto da lousa</h2>
  <pre>${escapar(textoDaAula(aula))}</pre>

  ${
    aula.flashcards.length > 0
      ? `<h2>Flashcards</h2>${aula.flashcards
          .map((f) => `<div class="cartao"><b>${escapar(f.p)}</b><span>${escapar(f.r)}</span></div>`)
          .join('')}`
      : ''
  }

  ${
    aula.questoes.length > 0
      ? `<h2>Questões</h2>${aula.questoes
          .map(
            (q, i) =>
              `<div class="questao"><b>${i + 1}. ${escapar(q.q)}</b><ol type="a">${q.alt
                .map((a) => `<li>${escapar(a)}</li>`)
                .join('')}</ol></div>`
          )
          .join('')}<p class="gabarito">Gabarito: ${escapar(gabarito)}</p>`
      : ''
  }

  <footer>Registrado com o JOVI Flow, a partir da foto da lousa.</footer>
</body>
</html>`;
}

export type ResultadoPdf = 'compartilhado' | 'sem-compartilhamento' | 'falhou';

/** Monta o PDF da aula e abre a folha de compartilhamento do aparelho. */
export async function compartilharPdfDaAula(aula: Aula): Promise<ResultadoPdf> {
  try {
    const fotos = await fotosEmBase64(aula);
    const { uri } = await Print.printToFileAsync({ html: html(aula, fotos) });
    console.log(`[JOVI Flow] PDF da aula gerado: ${uri}`);
    if (!(await Sharing.isAvailableAsync())) return 'sem-compartilhamento';
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: aula.titulo,
      UTI: 'com.adobe.pdf',
    });
    return 'compartilhado';
  } catch (erro) {
    console.log('[JOVI Flow] nao deu para gerar o PDF:', erro);
    return 'falhou';
  }
}
