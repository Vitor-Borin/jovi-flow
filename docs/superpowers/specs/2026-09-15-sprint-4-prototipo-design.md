# Sprint 4: o protótipo é a apresentação

Combinado em 15/09/2026. A banca aprovou o grupo para a Sprint 4, onde 1 minuto
é fala e os outros 4 são o protótipo na mão. Este documento é o que muda no app
para esses 4 minutos.

## O problema

Muitos grupos têm a mesma ideia: foto da lousa, IA resume. O que diferencia o
JOVI Flow é a tese de que ele mora na câmera e usa a grade como contexto. Só que
o protótipo da Sprint 3 afirmava mais do que fazia:

| Onde | O que não funcionava |
|---|---|
| Estudos | Abrir, renomear e excluir aula não faziam nada. Não existia criar pasta. |
| Estudos | O acervo era fixo no código. Duas capturas viravam uma. Fechar o app zerava. |
| Organizar | Só escolhia entre as pastas fixas. |
| Revisão e Questões | Sempre Flexbox, seja lá o que foi fotografado. |
| Câmera | Sete camadas em cima do visor. Badge "FLOW ATIVO" mesmo com o modo escolhido embaixo. |
| Identificado | "Ganhos da captura +62%" era número inventado. |

## Decisões

### 1. A câmera é a câmera da JOVI

A JOVI é a marca da vivo no Brasil e roda Funtouch OS 15. O visor do Flow passa
a copiar o layout dessa câmera para a banca acreditar que está olhando o app
nativo: fundo preto de ponta a ponta, visor 4:3 sem borda nem raio, ícones
brancos na barra de cima (flash, HDR, foto ao vivo, engrenagem), bolinhas de
zoom logo acima dos modos, modos em caixa alta com o selecionado em branco,
obturador branco, miniatura da galeria à esquerda e inverter à direita.

AULA é um modo do carrossel, entre FOTO e VÍDEO, igual a Retrato ou Noite. Quando
a câmera reconhece a lousa (2 s), o carrossel desliza sozinho para AULA com um
toque háptico. Nenhum badge, nenhum cartão explicando. Em AULA aparece uma linha
a mais, Lousa / Slide / Caderno, no mesmo lugar em que o Retrato da JOVI mostra
"23 35 50 mm". A folha "Capturar como conteúdo de aula?" sai: obturador vai
direto ao processamento. Captura contínua vira um ícone na barra de cima, só em
AULA.

### 2. O acervo é real e sobrevive a fechar o app

Pastas e aulas são estado do app, gravado com AsyncStorage. A foto é copiada do
cache da câmera para o diretório de documentos, para não sumir. Cada captura vira
uma aula completa: páginas (fotos), texto, resumo, flashcards, questões, caminho.
Criar pasta, renomear, mover e excluir funcionam. Tocar numa aula abre a tela
Aula. Início e Ações apontam para a aula certa. Organizar cria pasta nova na
hora.

Na primeira abertura o acervo nasce com cinco aulas de exemplo, cada uma com o
conteúdo completo, para as pastas não estarem vazias.

### 3. Tudo é lido da foto

Além de classificar e transcrever, o modo ao vivo dispara uma terceira chamada em
paralelo que devolve flashcards e questões da própria imagem. Flexbox só aparece
sem chave ou sem rede.

### 4. Sessão de aula pela grade

Duas fotos tiradas durante a mesma aula da grade viram páginas da mesma aula, e
não dois itens soltos. A tela Organizar avisa: "Entra na aula de hoje · página 2".
Fora do horário da grade vale a sessão livre: mesma pasta, mesmo dia, menos de 30
minutos desde a última foto. É a tese do grupo virando funcionalidade.

### 5. Ouvir a aula

Botão de play no resumo e na tela Aula: o aparelho lê o resumo em voz alta com a
síntese de voz nativa (expo-speech), offline. Estudar no ônibus.

### 6. Limpeza

Sai o badge FLOW ATIVO de todas as telas, sai a faixa de ganhos inventados, o
tema deixa de ter viés azul no fundo (preto neutro, como o modo escuro do
sistema) e o azul JOVI fica só onde é ação.

## Roteiro dos 4 minutos

1. Abre no visor. Carrossel desliza para AULA sozinho.
2. Foto. Processamento: câmera trabalha, depois IA.
3. "Confirmado pela sua grade". Salvar, criando pasta na hora.
4. Resumo. Play: o celular lê.
5. Questões da própria lousa.
6. Segunda foto. "Página 2 da mesma aula".
7. Estudos: abre a pasta, abre a aula, renomeia.

## Fora do escopo

Login, backend, envio real para Classroom/Drive, chat sobre a aula.
