# Regras de design do JOVI Flow

Este arquivo manda na aparência do app. Onde ele conflitar com qualquer outra
anotação de escopo, vale o que está escrito aqui. Combinado em 21/08/2026 e
revisto em 15/09/2026 para a Sprint 4.

## Identidade da marca

A cor da JOVI é o azul elétrico `#1E46E6`, tirado do material oficial do
Challenge. A marca aparece em branco sobre esse azul, com layout minimalista e
bastante respiro.

Cuidado com um detalhe: o magenta `#EE1065` que aparece no material é da FIAP, e
não da JOVI. Usar magenta no aplicativo seria errar a marca do cliente.

Contraste conferido antes de adotar a paleta:

| Uso | Cor | Contraste sobre o fundo | Veredito |
|---|---|---|---|
| Preenchimento de botão | `#1E46E6` com texto branco | 6.83 | aprovado |
| Texto e ícone sobre escuro | `#6E8BFF` (`primaryHi`) | 6.29 | aprovado |
| `#1E46E6` como texto sobre escuro | | 2.84 | reprovado |

Ou seja: `primary` é cor de preenchimento. Para texto e ícone sobre o tema
escuro, sempre `primaryHi`.

## O Flow vive dentro da câmera

O JOVI Flow é uma funcionalidade da câmera do aparelho, e é isso que a entrega da
Sprint 1 do grupo afirma. É também a tese do pitch.

Por causa disso o aplicativo abre no visor da câmera, e não numa tela de menu. As
outras telas são o que o Flow produziu, e o usuário chega nelas a partir da
câmera, do mesmo jeito que chega na galeria de dentro de qualquer câmera nativa.

Regra prática: nenhuma tela pode sugerir que isto é um aplicativo separado, que o
estudante precisaria baixar.

## O visor é a câmera da JOVI

A JOVI é a marca da vivo no Brasil e roda Funtouch OS. O visor copia o layout
dessa câmera para a banca acreditar que está olhando o app nativo:

| Elemento | Como é |
|---|---|
| Fundo | Preto de ponta a ponta. Nada de card com borda e raio. |
| Visor | 4:3 na largura toda, sem borda. |
| Barra de cima | Flash, HDR, foto ao vivo (em AULA vira captura contínua), 4:3, engrenagem. Ícone branco. |
| Zoom | Bolinhas sobre a imagem, na base do visor. |
| Modos | Caixa alta, o selecionado em branco e negrito, os outros apagados. Centrado no selecionado. |
| AULA | Um modo do carrossel, entre FOTO e VÍDEO. A superfície (Lousa / Slide / Caderno) aparece como pílulas acima dos modos, no lugar onde o Retrato da JOVI mostra 23 / 35 / 50 mm. |
| Obturador | Branco. Em VÍDEO o miolo fica vermelho. |
| Cantos | Miniatura da galeria à esquerda, inverter câmera à direita. |
| MAIS | Fecha a régua e abre a folha com os modos reais do V50. Os cinco do protótipo são tocáveis; os outros aparecem apagados, dizendo que existem no aparelho e ficaram fora daqui. |

A barra de cima tem **quatro** controles, que é o teto da barra de atalhos da
câmera da vivo: flash, HDR, foto ao vivo (em AULA vira captura contínua) e
ajustes.

Mostrar os modos que o protótipo não faz não é contradição com "controle que não
muda nada". É o contrário: esconder a câmera real seria afirmar que o Flow é a
câmera inteira. A folha diz o que existe no aparelho e o que é do protótipo.

Nenhum badge por cima do visor. O modo já está escrito no carrossel; repetir em
cima da imagem era dizer a mesma coisa duas vezes. Quando a câmera reconhece a
lousa, o carrossel desliza para AULA e um aviso de dois segundos diz por quê.

## A direção visual

Fora do visor, o app parece o modo escuro do próprio sistema: fundo preto
neutro, superfícies cinza sem borda, azul só onde é ação. A versão anterior
tinha fundo azulado e cara de aplicativo de terceiro. Dado técnico continua em
monoespaçado, mas com menos rótulo em caixa alta e menos caixa com borda.

Isso não é questão de gosto. O pitch afirma que o Flow mora no sistema de câmera
da JOVI, e não numa loja de aplicativos. Se a interface parece qualquer app de
lista de tarefas, a tela contradiz a fala do apresentador.

## Honestidade da interface

Esta seção nasceu de dois defeitos reais encontrados no próprio projeto. Os dois
tinham a mesma causa: a tela afirmava mais do que o app sabia.

**A tela nunca afirma o que não sabe.**

O card de contexto exibia "Confirmado pela sua grade, quinta-feira, 19:20, LAB
402" mesmo num domingo à tarde, em casa, porque a função de horário sempre
devolvia algum slot. Estava afirmando uma confirmação que nunca aconteceu.

Quando o app não tem certeza, ele diz isso. Admitir que não sabe é mais forte que
fingir, e sobrevive a alguém da banca abrir o aplicativo fora do horário.

**Número apresentado como medição precisa ser medição.**

Os "Ganhos da captura" (`+62%`, `3 pontos`, `-12°`) eram ilustrativos, com a
etiqueta "estimativa". Saíram na Sprint 4: numa interface onde o resto é leitura
real de IA e acervo real, um número inventado seria o único ponto sem resposta
se alguém perguntasse como foi obtido.

Vale para contagem também. A tela Início conta o acervo de verdade, incluindo o
que foi capturado.

**Botão que existe funciona.**

Na Sprint 3, "Abrir", "Renomear" e "Excluir" no menu da aula não faziam nada, e
não existia criar pasta. Hoje o acervo é estado real e cada uma dessas ações
muda esse estado. Se uma ação não puder ser implementada, ela sai da tela.

**Controle decorativo é proibido.**

O seletor Lousa / Slide / Caderno trocava apenas os chips e o texto: os três
enviavam exatamente o mesmo pedido à IA. Um controle que o usuário opera e que
não muda nada é pior que não ter o controle.

Havia também um sino de notificações no topo da tela Início sem nenhuma ação por
trás. Ele saiu.

Hoje o sub-modo escolhido entra no prompt das duas chamadas, descrevendo o
problema óptico daquela superfície. Vale para qualquer controle novo: se ele
existe na tela, ele faz alguma coisa.

## Proibido

| Proibido | Motivo | No lugar disso |
|---|---|---|
| Emoji como ícone | Depende da fonte do sistema, muda de desenho entre plataformas e não aceita token de cor | `Ionicons` ou `MaterialCommunityIcons` |
| `✨` em título | Virou clichê de "recurso inteligente" e não diz nada ao usuário. Aparecia em "Conteúdo identificado" e "Resumo gerado com IA" | Nada. O título se sustenta sozinho |
| `✅` em título | Mesma razão | O ícone de check animado da tela de ações |
| Cor fixa em componente | Quebra o tema | Token de `src/theme.ts` |
| Azul decorativo | O azul é cor de ação e de Flow ativo. Usado como enfeite, perde o significado | Cinza da escala de `surface` |
| Mais de 2 elementos animados por tela | Tela que se mexe inteira parece vídeo de demonstração, e não instrumento | Escolher o momento que importa |
| Fonte custom | Faz o app parecer app de terceiro, o que contradiz a tese do pitch | Fonte nativa do sistema |
| Afirmar contexto sem confirmação | Ver "Honestidade da interface" | Dizer o que se sabe, no nível de certeza que se tem |
| Controle que não muda nada | Ver "Honestidade da interface" | Ou o controle age, ou sai da tela |
| Badge de estado por cima do visor | O modo já está no carrossel. Repetir é ruído sobre a imagem | O carrossel e, em AULA, os cantos da moldura |
| Borda em card | Pesa a tela e afasta do modo escuro do sistema | Superfície cinza sobre fundo preto |

## Obrigatório

Ícones vêm de uma família só, com um peso de traço só, e tamanho vindo de token.

Dado técnico tem cara de câmera. Número, porcentagem, ângulo, horário e contador
usam monoespaçado nativo (`Menlo` no iOS, `monospace` no Android), com numeral
grande e rótulo pequeno em caixa alta. Por exemplo: `+62%`, `-12`, `1x`, `1/10`.
Isso não custa dependência nenhuma, porque já é nativo nas duas plataformas.

Quebrar o ritmo de card. Nem toda informação é um card com o mesmo padding.
Faixa de dado usa divisor fino, e não caixa.

Área tocável de no mínimo 44x44, com `accessibilityRole` e `accessibilityLabel`.

Estado nunca é comunicado só por cor. Sempre vem acompanhado de texto ou ícone.

## Modo de análise ao vivo

O modo ao vivo troca o conteúdo de exemplo pela leitura real da foto. As regras
de interface para ele:

**A origem do conteúdo fica visível.** Quando a leitura é real, a tela de
conteúdo identificado exibe o selo `LIDO DA SUA FOTO, AGORA`. Sem o selo, o que
está ali é exemplo. O usuário nunca fica em dúvida sobre qual dos dois está
vendo.

**Falha não aparece como erro.** Sem chave, sem rede ou com resposta lenta, a
tela simplesmente mostra o conteúdo de exemplo. Nenhum alerta, nenhum vermelho,
nenhuma interrupção. A demonstração continua e a banca não percebe.

**A espera fica escondida atrás do que já existia.** A análise roda em paralelo
com a animação de processamento. Ligar o modo ao vivo não pode deixar o fluxo
visivelmente mais lento.

**Pasta nova é anunciada.** Quando a IA cria uma pasta em vez de reaproveitar uma
existente, a tela de organização avisa. Organizar sozinho é o valor do produto,
mas organizar em silêncio faz o usuário perder o controle do próprio acervo.

**O que a tela de organização mostra é onde a aula vai parar.** A aba Estudos usa
o mesmo destino e o mesmo título. Se as duas divergirem, o app está mentindo
sobre onde guardou a captura.
