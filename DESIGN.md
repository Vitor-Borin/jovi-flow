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

## Honestidade da interface

Esta secao nasceu de dois defeitos reais encontrados no proprio projeto. Ambos
tinham a mesma causa: a tela afirmava mais do que o app sabia.

**A tela nunca afirma o que nao sabe.**

O card de contexto exibia "Confirmado pela sua grade — Quinta-feira, 19:20, LAB
402" mesmo num domingo a tarde, em casa, porque a funcao de horario sempre
devolvia algum slot. Estava afirmando uma confirmacao que nunca aconteceu.

Quando o app nao tem certeza, ele diz isso. Admitir que nao sabe e mais forte que
fingir — e sobrevive a alguem da banca abrir o aplicativo fora do horario.

**Numero apresentado como medicao precisa ser medicao.**

Os "Ganhos da captura" (`+62%`, `3 pontos`, `-12°`) sao ilustrativos, e a tela
diz "estimativa". Numa interface onde o resto passou a ser leitura real de IA,
um numero inventado sem rotulo seria o unico ponto sem resposta se perguntarem
como foi obtido — e contaminaria a credibilidade do que e verdadeiro.

**Controle decorativo e proibido.**

O seletor Lousa / Slide / Caderno trocava apenas os chips e o texto: os tres
enviavam exatamente o mesmo pedido a IA. Um controle que o usuario opera e que
nao muda nada e pior que nao ter o controle.

Hoje o sub-modo escolhido entra no prompt das duas chamadas, descrevendo o
problema optico daquela superficie. Vale para qualquer controle novo: se ele
existe na tela, ele faz alguma coisa.

## Proibido

| Proibido | Motivo | No lugar disso |
|---|---|---|
| Emoji como icone | Tell numero 1 de interface gerada por IA. Depende da fonte do sistema, muda entre plataformas e nao aceita token de cor | `Ionicons` ou `MaterialCommunityIcons` |
| `✨` em titulo | E o emoji-simbolo de "feature de IA" desde 2023. Aparecia em "Conteudo identificado" e "Resumo gerado com IA" | Nada. O titulo se sustenta sozinho |
| `✅` em titulo | Mesma razao | O icone de check animado da tela de acoes |
| Cor fixa em componente | Quebra o tema | Token de `src/theme.ts` |
| Azul decorativo | O azul e cor de acao e de Flow ativo. Usado como enfeite, perde o significado | Cinza da escala de `surface` |
| Mais de 2 elementos animados por tela | Animacao em tudo e o que faz parecer demo automatica | Escolher o momento que importa |
| Fonte custom | Faz o app parecer app de terceiro, contradizendo a tese do pitch | Fonte nativa do sistema |
| Afirmar contexto sem confirmacao | Ver "Honestidade da interface" | Dizer o que se sabe, no nivel de certeza que se tem |
| Controle que nao muda nada | Ver "Honestidade da interface" | Ou o controle age, ou sai da tela |

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

## Modo de analise ao vivo

O modo ao vivo troca o conteudo de exemplo pela leitura real da foto. Regras de
interface para ele:

- **A origem do conteudo fica visivel.** Quando a leitura e real, a tela de
  conteudo identificado exibe o selo `LIDO DA SUA FOTO, AGORA`. Sem o selo, o
  que esta ali e exemplo. O usuario nunca fica em duvida sobre qual dos dois
  esta vendo.
- **Falha nao aparece como erro.** Sem chave, sem rede ou resposta lenta, a tela
  simplesmente mostra o conteudo de exemplo. Nenhum alerta, nenhum vermelho,
  nenhuma interrupcao — a demonstracao continua e a banca nao percebe.
- **A espera fica escondida atras do que ja existia.** A analise roda em paralelo
  com a animacao de processamento. Ligar o modo ao vivo nao pode deixar o fluxo
  visivelmente mais lento.
- **Pasta nova e anunciada.** Quando a IA cria uma pasta em vez de reaproveitar
  uma existente, a tela de organizacao avisa. Organizar sozinho e o valor do
  produto; organizar em silencio e o usuario perder o controle do proprio acervo.

## Onde isso desvia do plano original

O `JOVI_FLOW_BUILD.md` e o board do grupo pedem emoji nas telas 5, 6, 7 e 9 e no
campo `icone` de `biblioteca`, alem do `✨` nas telas 5 e 8 e do `✅` na tela 7.
Tudo isso foi substituido por icone vetorial.

O plano tambem descreve o card de contexto como sempre confirmando pela grade, e
tratava rede como proibida em qualquer circunstancia. Os dois pontos evoluiram —
ver "Honestidade da interface" e "Modo de analise ao vivo". O conteudo textual e
a estrutura das telas seguem fieis ao plano.
