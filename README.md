# JOVI Flow

Protótipo de uma experiência de estudo dentro da câmera da JOVI, feita para estudante universitário.

Challenge FIAP × JOVI 2026 · Sprint 4: 1 minuto de fala, 4 minutos de protótipo na mão

## O que é

O professor apaga a lousa em uns 40 segundos. Dá tempo de um movimento só: pegar o celular e fotografar. O problema aparece depois, quando aquela foto se perde no meio de milhares de outras na galeria e ninguém volta nela.

O JOVI Flow pega essa foto e faz o resto do caminho:

`Capturar → Entender → Organizar → Estudar`

O Flow é uma funcionalidade da câmera do aparelho, do mesmo jeito que a galeria é. Por isso o protótipo abre direto no visor em vez de abrir num menu, e o visor copia a câmera do JOVI V50 (a JOVI é a marca da vivo no Brasil), medida em capturas reais do aparelho: preto de ponta a ponta, ícones brancos soltos em cima, zoom em texto sobre a imagem, modos com capitalização normal e o selecionado em amarelo, obturador vazado com anel amarelo. **Aula é um modo do carrossel**, entre Foto e Vídeo, igual a Retrato ou Noite. O Flow não tem tela inicial nem barra de abas de aplicativo: a miniatura da câmera abre a **galeria** do aparelho, onde as aulas organizadas ficam numa aba ao lado das fotos, e a engrenagem abre os **ajustes** do Modo Aula.

### O que o protótipo faz de verdade

Tudo o que aparece na tela funciona. Pastas e aulas são estado real, gravado no aparelho, e sobrevivem a fechar o app. Criar pasta, renomear, mover e excluir funcionam. Tocar numa aula abre a aula, com as fotos, o resumo, os flashcards e as questões dela.

Com a análise por IA ligada, a IA lê a foto que você acabou de tirar e devolve matéria, tema, tópico, pasta, transcrição, resumo, flashcards e questões. Nada de Flexbox se a lousa era de Cálculo.

### Os diferenciais

**O Modo Aula muda o comportamento da câmera, e não apenas a pasta onde a foto cai.**

Em Foto, a câmera procura a lousa sozinha: tira uma foto pequena em silêncio a cada segundo e, quando acha um quadro inteiro com escrita dentro, desliza o carrossel para Aula. Lousa vazia, porta e tela apagada não trocam o modo.

Em Aula, a câmera avisa se a foto vai servir. Com a lousa inteira no enquadramento, os cantos da moldura acendem em amarelo, o celular vibra e o VoiceOver fala "Lousa inteira enquadrada". Depois da foto, a leitura da IA diz em uns 2 segundos se pegou tudo; se não pegou, a tela mostra o que faltou e oferece "Tirar outra", enquanto o professor ainda não apagou a lousa.

A foto do estudante nunca é alterada: ela aparece, vai para a aula e é lida pela IA do jeito que a câmera tirou.

O Modo Aula também separa três superfícies que têm problemas ópticos opostos entre si, e diz à IA qual delas está na foto:

| Modo | O problema que resolve |
|---|---|
| Lousa | reflexo da janela, giz apagado, foto tirada de lado |
| Slide | projeção estourada em sala escura, com cintilação |
| Caderno | sombra da própria mão, papel curvado sobre a mesa |

Um "modo documento" genérico trata os três do mesmo jeito e erra nos três.

E isso não é hipótese: a câmera do JOVI V50 **já tem** "Documento em Ultra HD" na lista de modos. O carrossel da câmera do protótipo mostra isso: em **Mais**, a folha traz os modos reais do aparelho, com "Documento em Ultra HD" ao lado do "Aula". O Modo Aula não inventa capacidade nova — ele especializa uma que a JOVI já vende, e liga a captura ao horário do estudante. A tela Ajustes → Viabilidade técnica diz isso com todas as letras.

**A grade horária do estudante entra como contexto.**

O app não chuta a matéria. Quando não dá para confirmar, a tela avisa que não deu, em vez de inventar. São três situações possíveis:

| Situação | O que a tela afirma |
|---|---|
| Em aula agora | "Confirmado pela sua grade · Front-End Design · LAB 402 · agora" |
| Fora de aula, mas o assunto é de uma disciplina sua | "Uma das suas disciplinas: Front-End Design" |
| Assunto que não está na grade | "Assunto fora da sua grade. O Flow vai abrir uma pasta nova" |

A terceira situação cobre quem está revisando em casa, no fim de semana, longe da faculdade. A grade continua sendo a camada mais forte quando ela existe, mas deixou de ser a única.

**A sessão de aula junta as fotos em vez de espalhar.**

Duas fotos tiradas durante a mesma aula da grade viram páginas da **mesma aula**, e não dois itens soltos. A tela Organizar avisa antes de salvar: "Entra na aula de hoje como página 2". Fora do horário da grade vale a sessão livre: mesma pasta, mesmo dia, menos de meia hora desde a última foto. É a grade como contexto virando funcionalidade.

**A câmera lembra o que já viu.**

A leitura da foto recebe as aulas que o estudante já fotografou e aponta qual esta foto continua: "Continua *Grid e Bento Layout*, da aula de 14/08", com o motivo numa frase. A aula salva guarda a ligação e mostra "Continua" e "Continuada em", uma linha do aprendizado que se monta sozinha. A memória só aponta para aula que existe: o app confere o que a IA devolve contra o acervo e descarta o resto.

**O celular lê a aula em voz alta.**

Botão de play no resumo e no texto inteiro da lousa. Usa a síntese de voz nativa do aparelho, offline, com a voz mais natural instalada. Serve para revisar no ônibus, e serve para quem não enxerga bem a lousa. Os controles têm rótulo falado e os avisos importantes saem pelo VoiceOver, dentro do fluxo normal, sem um modo à parte.

## Como rodar

Precisa de Node.js 20.19.4 ou mais novo, e do app Expo Go no celular.

```bash
npm install
```

```bash
npx expo start
```

Leia o QR code com a câmera do iPhone, ou pelo próprio Expo Go no Android. O celular e o computador precisam estar na mesma rede.

### Atenção à versão do Expo Go

O projeto está no Expo SDK 57, que é a versão do Expo Go na App Store.

Desde o SDK 57, o Expo Go do iOS exige **login na mesma conta Expo nos dois lados**: rode `npx expo login` no computador e entre com a mesma conta no Expo Go (aba Home, avatar no canto superior direito). Sem isso ele mostra *"You need to be signed in to Expo Go and Expo CLI"*. Confira com `npx expo whoami`.

O projeto e o Expo Go do celular precisam estar no mesmo SDK. Foi o que aconteceu em 15/09/2026: o Expo Go atualizou sozinho do 54 para o 57, o app parou de abrir com *"Project is incompatible with this version of Expo Go"*, e o projeto teve de subir junto, porque no iOS não existe como instalar um Expo Go antigo. Antes de apresentar, desligue a atualização automática de apps no aparelho.

## Análise por IA

Sem chave, o app roda inteiramente offline, com conteúdo de exemplo. Com chave, a IA lê de verdade a foto que você acabou de tirar, seja qual for o assunto no quadro.

### Como ligar

Na câmera, toque na engrenagem → **Análise por IA**, cole uma chave da API da Anthropic e toque em **Guardar a chave**. É uma vez só: a chave fica no cofre do aparelho (o Keychain, no iPhone), a análise liga sozinha toda vez que o app abre, e o app confere na hora se a Anthropic aceitou a chave. Dá para conferir de novo em **Testar a chave**.

> **Sobre a chave.** Ela não vai em `.env` nem no Git. Variável `EXPO_PUBLIC_*` é embutida no pacote que o computador serve pela rede, e qualquer um no mesmo Wi-Fi conseguiria ler. Mesmo no cofre, use uma chave com limite de gasto baixo no Console e revogue depois da apresentação.
>
> Num produto real a credencial ficaria no backend da JOVI e o aparelho nunca a veria. Aqui ela está no aparelho porque isto é protótipo.

### Os dados do iPhone valem em qualquer computador?

Só com o projeto vinculado a uma conta Expo. Sem vínculo, o Expo Go separa os dados pelo computador que roda o servidor: aulas capturadas e a chave guardada usando o PC de casa não aparecem quando o app roda pelo PC da faculdade. Para vincular, uma vez, já logado com `npx expo login`:

```bash
npx eas-cli@latest init
```

Isso grava o `projectId` no `app.json`, e ele vai no commit.

### A classificação faz três trabalhos

A chamada rápida, de uns 2 segundos, é a única que chega a tempo de mudar o que o estudante faz na hora. Por isso ela diz onde salvar, se a foto pegou todo o conteúdo e qual aula já fotografada esta foto continua. Para isso ela leva junto a lista das 30 aulas mais recentes. O tempo dessa chamada com a lista ainda não foi medido no aparelho.

### Por que são três chamadas em vez de uma

O que demora não é a rede, é a geração da resposta. Medido contra a API real, sobre a mesma imagem:

| Tarefa | Saída | Sonnet 5 | Opus 5 |
|---|---|---|---|
| Só classificar | 49 tokens | 2,1s | 5,1s |
| Transcrever tudo | 682 tokens | 8,2s | 11,5s |

A transcrição inteira é a parte cara de gerar, e é justamente a que fica embaixo da tela, num card com rolagem. Matéria, tema e tópico ficam no topo, e são os primeiros que alguém lê.

Por isso o trabalho é dividido em três chamadas independentes, disparadas em paralelo no momento da captura:

```
classificação   imagem de 768px    ~21 KB    ~2s    topo da tela e pasta de destino
transcrição     imagem de 1568px   ~250 KB   ~8s    texto extraído e resumo
estudo          imagem de 1568px   ~250 KB   ~8s    flashcards e questões
```

A classificação usa imagem pequena de propósito. Medido, ela acerta igual com 768px e com 1568px, e assim a parte visível da tela para de depender de banda, porque 21 KB sobem em qualquer rede. Os 250 KB alimentam o que ainda está fora da tela.

### O que acontece quando falha

Sem chave, sem internet, resposta lenta ou JSON inválido: aquela parte cai no conteúdo de exemplo e o fluxo continua normalmente. As três chamadas são independentes, então uma falhar não derruba as outras. Existe uma repetição automática em falha de rede, e teto de tempo em cada chamada.

Como a análise roda em paralelo com a animação de processamento, que dura uns 2,7 s, ligar o modo ao vivo não acrescenta espera perceptível: o topo da tela chega pela classificação, que leva uns 2 s, e o resto preenche quando a transcrição chegar.

## Decisões de projeto

O app funciona offline por padrão. Toda a rede está em `src/services/analiseAoVivo.ts`, e ela só acontece com o modo ao vivo ligado. Com ele desligado o app roda 100% em modo avião. O motivo é prático: o Wi-Fi do campus não é confiável, e um pitch de 5 minutos não sobrevive a um timeout.

O acervo (pastas e aulas) fica gravado no aparelho com AsyncStorage, e a foto de cada captura é copiada do cache da câmera para o diretório de documentos, para não sumir. Não há banco nem backend: um React Context com persistência dá conta do escopo do protótipo. A captura em andamento (a foto que ainda não foi salva) fica só em memória.

Na primeira abertura o acervo nasce com cinco aulas de exemplo, cada uma com resumo, flashcards e questões, para as pastas não estarem vazias. Ajustes → "Apagar capturas e voltar aos exemplos" volta a esse estado.

Login, cadastro, onboarding e configurações ficaram fora do escopo.

As regras do projeto para quem for mexer no código estão em [`CLAUDE.md`](CLAUDE.md), e as visuais em [`DESIGN.md`](DESIGN.md). A direção é a de um instrumento de câmera, com dado numérico à mostra, e não a de um aplicativo de notas com tema escuro.

## Viabilidade técnica

O Flow não depende de tecnologia que ainda não existe. A tela Ajustes → Viabilidade técnica lista, dentro do próprio app, qual API aberta sustenta cada peça:

| Capacidade | API | Onde roda |
|---|---|---|
| Achar os cantos da lousa na foto | ML Kit Document Scanner | no aparelho |
| Múltiplos frames e anti-reflexo | CameraX / Camera2 | no aparelho |
| Reconhecer que o alvo é uma lousa | ML Kit Image Labeling | no aparelho |
| Leitura do texto | ML Kit Text Recognition v2 | no aparelho |
| Resumo, flashcards e questões | Gemini API, ou Gemini Nano | nuvem ou aparelho |
| Cruzar com a grade | Google Calendar API | nuvem |
| Enviar para a turma | Google Classroom e Drive API | nuvem |

No protótipo, a câmera já reconhece a lousa escrita de verdade, com Skia no próprio aparelho e sem internet.

O protótipo usa a API da Anthropic no modo ao vivo para demonstrar o conceito ponta a ponta. Numa JOVI de verdade esse papel seria do Gemini Nano rodando no próprio aparelho.

## Stack

| Item | Versão |
|---|---|
| Expo SDK | 57 |
| React Native | 0.86 |
| React | 19.2 |
| TypeScript | 6.0, modo estrito |

Navegação com React Navigation, usando stack nativo e abas. Gráficos com `react-native-svg`, câmera com `expo-camera`, procura da lousa com `@shopify/react-native-skia`, redimensionamento de imagem com `expo-image-manipulator`, ícones do `@expo/vector-icons`.

## Estrutura

```
App.tsx                       providers e navegação raiz
docs/superpowers/specs/       decisões de cada sprint
src/
├── theme.ts                  fonte única de cor, espaço e tipografia
├── data/mock.ts              grade horária, sub-modos, etapas, conteúdo de exemplo, plataformas
├── data/acervo.ts            tipos do acervo, funções puras, sessão pela grade, exemplos iniciais
├── store/AcervoContext.tsx   pastas e aulas, gravadas no aparelho
├── store/FlowContext.tsx     a captura em andamento
├── services/                 análise ao vivo (o único ponto que toca a rede) e a procura da lousa
├── hooks/                    captura contínua, procura da lousa, leitura em voz alta, reduzir movimento
├── components/               13 componentes reutilizáveis
├── navigation/               RootStack, GaleriaTabs e os tipos de rota
└── screens/                  14 telas
```

## Regras do projeto

Quem for mexer no código precisa respeitar estas, que já custaram caro para descobrir:

O SDK do projeto acompanha o do Expo Go do aparelho da apresentação, hoje o 57. Mudar um sem o outro quebra o app na banca.

A rede vive isolada em `src/services/analiseAoVivo.ts`. Nenhum outro arquivo faz chamada externa.

O acervo só muda pelas ações do `AcervoContext`. Nenhuma tela guarda cópia própria de pasta ou aula.

Nada de `any` nem de `@ts-ignore`.

Nenhuma cor escrita fora de `src/theme.ts`.

Emoji nunca entra como ícone. O motivo está no `DESIGN.md`.

Todo texto visível ao usuário em português do Brasil.

### Uma armadilha conhecida

Se o Metro reclamar de um módulo que existe, quase sempre é um processo Node órfão segurando a porta 8081 com o mapa de módulos antigo. Mate o processo e suba de novo com `npx expo start --clear`.

## Qualidade

```bash
npx tsc --noEmit
```

```bash
npx expo-doctor
```

```bash
npm run testar:lousa
```

Os três passam sem erro: o `expo-doctor` fecha 21 de 21, e o teste da lousa confere 8 de 8 cenas. Esse teste monta cenas 3D sintéticas (lousa branca e verde vistas de lado, caderno, lousa vazia, janela, porta) e roda sobre elas o mesmo código que decide o aviso "Lousa reconhecida", com o Skia do CanvasKit: confere se a procura só afirma lousa onde há lousa escrita. As fotos das cenas ficam em `scripts/saida-lousa/`. Ele não substitui a câmera real: foto de verdade tem ruído, reflexo e lousa suja.

Sobre acessibilidade: área tocável de no mínimo 44×44 pt, `accessibilityRole` e `accessibilityLabel` em todo elemento acionável, estado nunca comunicado só por cor, e animação reduzida quando o sistema pede menos movimento.

## Roteiro dos 5 minutos

Um minuto de fala e quatro com o protótipo na mão, para quatro avaliadores da JOVI. O celular não passa de mão em mão: o iPhone vai direto no projetor por um adaptador USB-C para HDMI, que espelha a tela sem aplicativo e sem internet (iPhone 15 em diante, exceto os modelos "e").

 A versão completa, com o texto de cada fala, o que fazer se algo falhar, as perguntas prováveis da banca e um cronômetro de ensaio, está na página do pitch (link no `CLAUDE.md`). Papéis: um narrador, um operador com o iPhone e um apoio com a lousa e o tempo.

1. **0:00** Minuto de fala, com a câmera virada para baixo: a foto da lousa some na galeria; ninguém abre outro aplicativo no meio da aula; o JOVI Flow é um modo da câmera da JOVI.
2. **1:00** A câmera acha a lousa: o carrossel desliza sozinho para Aula, os cantos acendem e o celular vibra.
3. **1:25** Uma foto cortada de propósito abre com "A foto não pegou tudo".
4. **1:55** Tirar outra: a IA lê a matéria, confere com a grade e mostra "Continua uma aula sua". Tocar no cartão abre a aula de Grid.
5. **2:40** Organizar e salvar, e Ouvir por uns 6 segundos.
6. **3:15** Abrir a aula: a foto inteira e a linha do aprendizado.
7. **3:40** `Mais` no visor: o "Documento em Ultra HD" já existe no V50, e o Flow especializa o que a JOVI já vende.
8. **4:10** Fechamento. **4:25** Folga para a IA demorar ou para a pergunta da banca.

A lousa da demonstração é uma folha A3 escrita com Flexbox, presa sobre um fundo escuro: sem contraste com a parede, a câmera não acha a lousa. Flexbox é de propósito. A IA liga Flexbox à aula de exemplo de Grid, e, se a rede cair, o conteúdo de exemplo do app também é Flexbox.

## Antes de apresentar

- [ ] Adaptador USB-C para HDMI testado com o iPhone numa TV ou monitor, e o som do Ouvir testado com ele ligado (o som passa a sair pelo HDMI)
- [ ] Desligar atualização automática de apps no iPhone, senão o Expo Go atualiza e o app não abre
- [ ] Vincular o projeto à conta Expo (`npx eas-cli@latest init`), para as aulas e a chave valerem em qualquer computador
- [ ] Ajustes → Análise por IA: guardar a chave nova e tocar em Testar a chave, com a rede do local
- [ ] Tirar uma foto de teste e conferir que matéria e tema vêm da foto
- [ ] Ensaiar com a lousa da demonstração: a troca sozinha para Aula, a foto cortada e a memória
- [ ] Ajustes → Voz do Ouvir: deixar a Luciana Aprimorada ou Premium baixada no iPhone da apresentação
- [ ] Ajustes → "Apagar capturas e voltar aos exemplos" antes de subir: a aula de Grid, que é a memória da demonstração, é um dos exemplos
- [ ] Recarregar o app e deixá-lo em Foto, com a câmera longe da lousa: o reconhecimento automático só acontece uma vez por abertura
- [ ] Desligar o Wi-Fi e ficar só no 5G, porque o iOS prefere Wi-Fi mesmo quando ele está congestionado
- [ ] Rodar o fluxo completo algumas vezes seguidas, usando Ajustes → Reiniciar demonstração entre as voltas
- [ ] Abrir o app no celular antes de subir ao palco, para o bundle já estar em memória
- [ ] Gravar um vídeo de tela do fluxo funcionando, como plano B
- [ ] Depois da apresentação, revogar a chave da API
