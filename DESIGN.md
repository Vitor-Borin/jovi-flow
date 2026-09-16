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
| Amarelo da câmera sobre preto | `#F6CE3A` (`visor.destaque`) | 13.8 | aprovado |
| Amarelo da câmera sobre lousa branca | | 1.4 | reprovado |
| Amarelo sobre o véu escuro (`visor.veu`) por cima da lousa | | 5.07 | aprovado |

Ou seja: `primary` é cor de preenchimento. Para texto e ícone sobre o tema
escuro, sempre `primaryHi`. E todo amarelo que cai por cima da imagem do visor
precisa do véu por trás, senão some na lousa branca.

## O Flow vive dentro da câmera

O JOVI Flow é uma funcionalidade da câmera do aparelho, e é isso que a entrega da
Sprint 1 do grupo afirma. É também a tese do pitch.

Por causa disso o aplicativo abre no visor da câmera, e não numa tela de menu. As
outras telas são o que o Flow produziu, e o usuário chega nelas a partir da
câmera, do mesmo jeito que chega na galeria de dentro de qualquer câmera nativa.

Regra prática: nenhuma tela pode sugerir que isto é um aplicativo separado, que o
estudante precisaria baixar.

Por isso o Flow mora em três lugares que o aparelho já tem, e em nenhum outro:

| Lugar | O que tem | Como se chega |
|---|---|---|
| Câmera | A captura, no modo Aula | O app abre nela |
| Galeria | Fotos, com tudo o que a câmera tirou, e Aulas, com as pastas, as aulas e o cartão da próxima aula pela grade | A miniatura da câmera. Em Aula abre em Aulas; nos outros modos, em Fotos |
| Ajustes da câmera | Grade, análise por IA, plataformas e viabilidade técnica | A engrenagem do visor |

Até a Sprint 4 a miniatura abria um aplicativo de cinco abas, com tela Início,
Revisão e Perfil. Era exatamente a cara de "app para baixar". A revisão agora
abre de dentro da aula, e Fotos ao lado de Aulas deixa o contraste do pitch a um
toque: a mesma foto que em Fotos é só mais uma, em Aulas já está na matéria certa.

## O visor é a câmera da JOVI

A JOVI é a marca da vivo no Brasil. O V50 saiu de fábrica com Funtouch OS 15 e
**recebe o OriginOS 6 desde meados de dezembro de 2025**, então quem abrir a
câmera de um V50 hoje vê o OriginOS. Nos pontos que este visor copia, os dois
sistemas desenham igual; a diferença é que o OriginOS põe um círculo escuro
atrás dos ícones da barra de cima. As medidas abaixo vieram de capturas reais do
V50 (1080 × 2392, que dá ≈ 393 dp, praticamente a escala de um iPhone), e não de
estimativa:

| Elemento | Como é |
|---|---|
| Fundo | Preto de ponta a ponta. Nada de card com borda e raio. |
| Visor | 4:3 na largura toda, sem borda. |
| Barra de cima | Ícones brancos soltos, sem fundo, com desenho de ~19 pt (tamanho 22 no código). Flash na ponta esquerda e ajustes na direita, com o centro a 32 pt da borda. Só entram atalhos que agem. |
| Zoom | Números soltos sobre a imagem, separados por `···`, na base do visor. O ativo leva o `x` e fica amarelo sobre um círculo escuro; os outros são brancos com halo. |
| Modos | Capitalização normal, 15 pt, negrito em todos. Só a cor separa: o selecionado em amarelo, os outros em branco. Centrado no selecionado, 26 pt entre rótulos, colado na base do visor. |
| Aula | Um modo do carrossel, entre Foto e Vídeo. A superfície (Lousa / Slide / Caderno) aparece na base do visor, no lugar onde o Retrato da JOVI mostra 23 / 35 / 50 mm, com a ativa numa pílula amarela e as outras só em texto. |
| Obturador | 68 pt, vazado: anel branco de 4, vão de 3 e anel amarelo de 1,5. Em Vídeo o miolo fica vermelho. Sem ícone dentro. |
| Cantos | Miniatura da galeria à esquerda e inverter câmera à direita, soltos, com o centro a 41 pt da borda. |
| Mais | Fecha a régua e abre a folha com os modos reais do V50. Os cinco do protótipo são tocáveis; os outros aparecem apagados, dizendo que existem no aparelho e ficaram fora daqui. |

O amarelo `#F6CE3A` é a cor de seleção da câmera da vivo, medida nas áreas
sólidas das capturas. Ele vale **só dentro do visor**: fora dele, a cor de ação
continua sendo o azul da JOVI. Sobre lousa branca o amarelo tem contraste 1,4, e
por isso todo texto amarelo sobre a imagem fica sobre o véu escuro.

A barra de cima do V50 no modo Foto tem seis ícones, e o HDR não é um deles: ele
mora no painel de ajustes. Fora do modo Foto, o próprio V50 reduz a barra a
flash e ajustes. O protótipo usa essa barra reduzida, porque só o flash, a
captura contínua e os ajustes agem de verdade aqui. HDR e foto ao vivo saíram na
Sprint 4: trocavam o desenho do ícone e não mudavam a captura, o que é
exatamente o que "controle que não muda nada" proíbe.

Mostrar os modos que o protótipo não faz não é contradição com essa regra. É o
contrário: esconder a câmera real seria afirmar que o Flow é a câmera inteira. A
folha diz o que existe no aparelho e o que é do protótipo.

Nenhum badge por cima do visor. O modo já está escrito no carrossel; repetir em
cima da imagem era dizer a mesma coisa duas vezes. Quando a câmera reconhece a
lousa, o carrossel desliza para Aula e um aviso de dois segundos diz por quê.

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

Vale para contagem também. Toda contagem de aulas e pastas vem do acervo de
verdade, incluindo o que foi capturado.

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
| Badge de estado por cima do visor | O modo já está no carrossel. Repetir é ruído sobre a imagem | O carrossel e, em Aula, os cantos da moldura |
| Borda em card | Pesa a tela e afasta do modo escuro do sistema | Superfície cinza sobre fundo preto |
| Tela inicial, dashboard ou aba Perfil | Cara de aplicativo para baixar, o contrário da tese | Câmera, galeria (Fotos e Aulas) e ajustes da câmera |
| Seta de "toque aqui" em item que não abre nada | É controle decorativo com outra roupa | Item informativo, sem seta |

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

**O que a tela de organização mostra é onde a aula vai parar.** A aba Aulas usa
o mesmo destino e o mesmo título. Se as duas divergirem, o app está mentindo
sobre onde guardou a captura.
