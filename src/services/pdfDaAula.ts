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
 *
 * O papel e A4 e as margens vem do proprio expo-print, e nao de `@page`: o
 * WebKit do iOS ignora a margem do CSS, e sem isso o texto encostava na borda.
 */

/** Lado maior da foto dentro do PDF. Maior que isso so engorda o arquivo. */
const LADO_FOTO = 1400;

/** A4 em pontos (72 por polegada), que e a unidade do expo-print. */
const PAGINA = { largura: 595, altura: 842 };
/** 40 pt = 14 mm de margem, igual nos quatro lados e em todas as paginas. */
const MARGEM = 40;

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

/** O titulo da aula ja vem cortado com reticencias. O tema vem inteiro. */
function tituloLongo(aula: Aula): string {
  const tema = aula.tema.trim();
  return tema.length > 0 ? tema : aula.titulo;
}

const estilo = `
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0;
    font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #15171c;
    font-size: 10.5pt;
    line-height: 1.42;
  }
  p { margin: 0 0 4pt; }

  header { margin-bottom: 14pt; }
  .marca {
    font-size: 7.5pt;
    font-weight: 700;
    letter-spacing: 1.2pt;
    text-transform: uppercase;
    color: #1e46e6;
    margin-bottom: 3pt;
  }
  h1 { font-size: 17pt; line-height: 1.2; margin: 0 0 4pt; letter-spacing: -0.3pt; }
  .meta { color: #5b6172; font-size: 9pt; margin: 0; }
  .risco { height: 2pt; background: #1e46e6; border-radius: 1pt; margin-top: 8pt; }

  h2 {
    font-size: 11.5pt;
    margin: 16pt 0 6pt;
    padding-bottom: 3pt;
    border-bottom: 0.7pt solid #d6dae4;
    color: #1e46e6;
    break-after: avoid;
    page-break-after: avoid;
  }

  figure { margin: 0; break-inside: avoid; page-break-inside: avoid; text-align: center; }
  figure img {
    max-width: 100%;
    max-height: 104mm;
    border: 0.7pt solid #d6dae4;
    border-radius: 4pt;
  }
  figure + figure { margin-top: 8pt; }
  figcaption { color: #8a90a0; font-size: 8pt; margin-top: 3pt; }

  ul.resumo { margin: 0; padding-left: 13pt; }
  ul.resumo li { margin-bottom: 3pt; break-inside: avoid; }

  pre.texto {
    white-space: pre-wrap;
    word-break: break-word;
    font-family: "SF Mono", Menlo, Consolas, monospace;
    font-size: 8.5pt;
    line-height: 1.38;
    background: #f4f6fa;
    border-radius: 4pt;
    padding: 8pt 10pt;
    margin: 0;
    color: #3b4050;
  }

  .cartoes { display: flex; flex-wrap: wrap; gap: 6pt; }
  .cartao {
    width: calc(50% - 3pt);
    border: 0.7pt solid #d6dae4;
    border-radius: 4pt;
    padding: 6pt 8pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .cartao b { display: block; font-size: 9.5pt; margin-bottom: 2pt; }
  .cartao span { color: #5b6172; font-size: 9pt; }

  .questao { margin-bottom: 8pt; break-inside: avoid; page-break-inside: avoid; }
  .questao b { display: block; margin-bottom: 2pt; }
  .questao ol { margin: 0; padding-left: 16pt; }
  .questao li { margin-bottom: 1pt; }
  .gabarito {
    margin-top: 4pt;
    background: #f4f6fa;
    border-radius: 4pt;
    padding: 5pt 8pt;
    color: #5b6172;
    font-size: 9pt;
    break-inside: avoid;
  }

  footer {
    margin-top: 18pt;
    border-top: 0.7pt solid #d6dae4;
    padding-top: 5pt;
    color: #5b6172;
    font-size: 8pt;
  }
`;

function html(aula: Aula, fotos: string[]): string {
  const letras = ['a', 'b', 'c', 'd'];
  const gabarito = aula.questoes.map((q, i) => `${i + 1}${letras[q.certa] ?? '?'}`).join(' · ');
  const origem = aula.aoVivo
    ? 'Conteúdo lido desta foto pela análise por IA do JOVI Flow.'
    : 'Conteúdo de exemplo do protótipo: esta aula não foi lida de uma foto.';

  const legenda = (i: number): string =>
    fotos.length > 1 ? `Foto ${i + 1} de ${fotos.length}` : 'A foto da lousa, como a câmera tirou';

  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>${escapar(aula.titulo)}</title><style>${estilo}</style></head>
<body>
  <header>
    <div class="marca">JOVI Flow · ${escapar(aula.materia)}</div>
    <h1>${escapar(tituloLongo(aula))}</h1>
    <p class="meta">${escapar(aula.pasta.join(' › '))} · ${escapar(aula.data)} às ${escapar(
      aula.hora
    )}</p>
    <div class="risco"></div>
  </header>

  ${
    fotos.length > 0
      ? `<h2>A lousa</h2>${fotos
          .map(
            (f, i) =>
              `<figure><img src="${f}" alt="Foto da lousa"><figcaption>${legenda(
                i
              )}</figcaption></figure>`
          )
          .join('')}`
      : ''
  }

  ${
    aula.resumo.length > 0
      ? `<h2>Resumo</h2><ul class="resumo">${aula.resumo
          .map((r) => `<li>${escapar(r)}</li>`)
          .join('')}</ul>`
      : ''
  }

  <h2>Texto lido da foto</h2>
  <pre class="texto">${escapar(textoDaAula(aula))}</pre>

  ${
    aula.flashcards.length > 0
      ? `<h2>Flashcards</h2><div class="cartoes">${aula.flashcards
          .map(
            (f) => `<div class="cartao"><b>${escapar(f.p)}</b><span>${escapar(f.r)}</span></div>`
          )
          .join('')}</div>`
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
          .join('')}<p class="gabarito"><b>Gabarito</b> · ${escapar(gabarito)}</p>`
      : ''
  }

  <footer>${escapar(origem)}</footer>
</body>
</html>`;
}

export type ResultadoPdf = 'compartilhado' | 'sem-compartilhamento' | 'falhou';

/** Monta o PDF da aula e abre a folha de compartilhamento do aparelho. */
export async function compartilharPdfDaAula(aula: Aula): Promise<ResultadoPdf> {
  try {
    const fotos = await fotosEmBase64(aula);
    const { uri } = await Print.printToFileAsync({
      html: html(aula, fotos),
      width: PAGINA.largura,
      height: PAGINA.altura,
      margins: { top: MARGEM, right: MARGEM, bottom: MARGEM, left: MARGEM },
    });
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
