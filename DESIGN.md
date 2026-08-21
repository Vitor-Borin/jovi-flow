# JOVI Flow — Regras de Design

> Complemento obrigatorio ao `JOVI_FLOW_BUILD.md`.
> Onde este arquivo conflitar com o plano de build ou com o board de telas do
> grupo (`Image.jpg`), **este arquivo vence**. Decidido com o Vitor em 21/08/2026.

## Identidade da marca

A cor da JOVI e o **azul eletrico `#1E46E6`**, extraido do material oficial do
Challenge. A marca aparece em branco sobre esse azul, com layout minimalista e
muito respiro.

**Atencao:** o magenta `#EE1065` que aparece no material **e da FIAP**, nao da
JOVI. Usar magenta no aplicativo seria errar a marca do cliente.

Contraste verificado antes de adotar a paleta:

| Uso | Cor | Contraste sobre o fundo | Veredito |
|---|---|---|---|
| Preenchimento de botao | `#1E46E6` com texto branco | 6.83 | aprovado |
| Texto e icone sobre escuro | `#6E8BFF` (`primaryHi`) | 6.29 | aprovado |
| `#1E46E6` como texto sobre escuro | — | 2.84 | **reprovado** |

Ou seja: `primary` e cor de **preenchimento**. Para texto e icone sobre o tema
escuro, sempre `primaryHi`.

## O Flow vive dentro da camera

O JOVI Flow **nao e um aplicativo de loja** — e uma funcionalidade da camera do
aparelho. Isso e o que a propria entrega da Sprint 1 do grupo afirma, e e a tese
do pitch.

Por isso o aplicativo **abre no visor da camera**, e nao numa tela de menu. As
demais telas sao o que o Flow produziu, alcancaveis a partir da camera — como a
galeria e alcancavel de dentro de qualquer camera nativa.

Regra pratica: nenhuma tela pode sugerir que isso e um aplicativo separado que o
estudante precisaria baixar.

## Regra zero

O aplicativo **nao pode parecer gerado por IA**.

Isso nao e questao de gosto: o pitch afirma que o Flow vive no sistema de camera
da JOVI, e nao numa loja de aplicativos. Se a interface parece um app generico
de produtividade, a tela contradiz a fala do apresentador.

**Direcao:** o JOVI Flow se parece com um instrumento de camera — denso, tecnico,
numerico, funcional. Nao se parece com um app de notas com tema escuro.

## Proibido

| Proibido | Motivo | No lugar disso |
|---|---|---|
| Emoji como icone | Tell numero 1 de interface gerada por IA. Depende da fonte do sistema, muda entre plataformas e nao aceita token de cor | `Ionicons` ou `MaterialCommunityIcons` |
| `✨` em titulo | E o emoji-simbolo de "feature de IA" desde 2023. Aparecia em "Conteudo identificado" e "Resumo gerado com IA" | Nada. O titulo se sustenta sozinho |
| `✅` em titulo | Mesma razao | O icone de check animado ja previsto na tela 7 |
| Cor fixa em componente | Quebra o tema | Token de `src/theme.ts` |
| Verde decorativo | Verde e cor de acao e de Flow ativo. Usado como enfeite, perde o significado | Cinza da escala de `surface` |
| Mais de 2 elementos animados por tela | Animacao em tudo e o que faz parecer demo automatica | Escolher o momento que importa |
| Fonte custom | Faz o app parecer app de terceiro, contradizendo a tese do pitch | Fonte nativa do sistema |

## Obrigatorio

- **Icones:** uma familia so, um peso de traco so, tamanhos vindos de token.
- **Dado tecnico com cara de camera.** Numero, porcentagem, angulo, horario e
  contador usam monoespacado nativo (`Menlo` no iOS, `monospace` no Android),
  numeral grande e rotulo pequeno em caixa alta. Ex.: `+62%`, `-12`, `1x`, `1/10`.
  Nao custa dependencia: ja e nativo nas duas plataformas.
- **Quebrar o ritmo de card.** Nem toda informacao e um card com o mesmo padding.
  Faixas de dado usam divisor fino, nao caixa.
- **Area tocavel minima 44x44**, com `accessibilityRole` e `accessibilityLabel`.
- **Estado nunca comunicado so por cor** — sempre acompanha texto ou icone.

## Onde isso desvia do plano original

O `JOVI_FLOW_BUILD.md` e o board do grupo pedem emoji nas telas 5, 6, 7 e 9 e no
campo `icone` de `biblioteca`, alem do `✨` nas telas 5 e 8 e do `✅` na tela 7.
Tudo isso foi substituido por icone vetorial. O conteudo textual e a estrutura
das telas seguem fieis ao plano.
