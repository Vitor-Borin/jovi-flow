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

### Os quatro diferenciais

**O Modo Aula muda o comportamento da câmera, e não apenas a pasta onde a foto cai.**

Quando reconhece uma superfície de estudo, a captura passa a combinar vários frames, suprimir reflexo, corrigir perspectiva e realçar o traço. Ele separa três superfícies que têm problemas ópticos opostos entre si:

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

**O celular lê a aula em voz alta.**

Botão de play no resumo e na tela da aula. Usa a síntese de voz nativa do aparelho, offline. Serve para revisar no ônibus, e serve para quem não enxerga bem a lousa.

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

Como a análise roda em paralelo com a animação de processamento, que dura uns 6,4s, ligar o modo ao vivo não acrescenta espera perceptível.

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
| Recorte, perspectiva e realce | ML Kit Document Scanner | no aparelho |
| Múltiplos frames e anti-reflexo | CameraX / Camera2 | no aparelho |
| Reconhecer que o alvo é uma lousa | ML Kit Image Labeling | no aparelho |
| Leitura do texto | ML Kit Text Recognition v2 | no aparelho |
| Resumo, flashcards e questões | Gemini API, ou Gemini Nano | nuvem ou aparelho |
| Cruzar com a grade | Google Calendar API | nuvem |
| Enviar para a turma | Google Classroom e Drive API | nuvem |

O protótipo usa a API da Anthropic no modo ao vivo para demonstrar o conceito ponta a ponta. Numa JOVI de verdade esse papel seria do Gemini Nano rodando no próprio aparelho.

## Stack

| Item | Versão |
|---|---|
| Expo SDK | 57 |
| React Native | 0.86 |
| React | 19.2 |
| TypeScript | 6.0, modo estrito |

Navegação com React Navigation, usando stack nativo e abas. Gráficos com `react-native-svg`, câmera com `expo-camera`, redimensionamento de imagem com `expo-image-manipulator`, ícones do `@expo/vector-icons`.

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
├── services/                 análise ao vivo, o único ponto que toca a rede
├── hooks/                    captura contínua, leitura em voz alta, reduzir movimento
├── components/               12 componentes reutilizáveis
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

Os dois passam sem erro: o `expo-doctor` fecha 21 de 21. O código não usa `any` nem `@ts-ignore`, e nenhuma cor é escrita fora de `src/theme.ts`.

Sobre acessibilidade: área tocável de no mínimo 44×44 pt, `accessibilityRole` e `accessibilityLabel` em todo elemento acionável, estado nunca comunicado só por cor, e animação reduzida quando o sistema pede menos movimento.

## Roteiro dos 4 minutos

1. **0:00** Abre no visor. Aponta para a lousa e o carrossel desliza para Aula.
2. **0:15** Foto. A IA lê de verdade: matéria, tópico e a pasta, confirmada pela grade.
3. **0:50** Destaque do pitch, ainda em definição.
4. **2:05** Miniatura → galeria. Em Fotos, a foto é só mais uma; em Aulas, já está na matéria certa. Ouvir por 10 segundos.
5. **2:50** `Mais` no visor: o "Documento em Ultra HD" já existe no V50, e o Flow especializa o que a JOVI já vende.
6. **3:10** Folga para a IA demorar ou para a pergunta da banca.

## Antes de apresentar

- [ ] Desligar atualização automática de apps no iPhone, senão o Expo Go atualiza e o app não abre
- [ ] Vincular o projeto à conta Expo (`npx eas-cli@latest init`), para as aulas e a chave valerem em qualquer computador
- [ ] Ajustes → Análise por IA: guardar a chave nova e tocar em Testar a chave, com a rede do local
- [ ] Tirar uma foto de teste e conferir que matéria e tema vêm da foto
- [ ] Decidir se as capturas de teste ficam ou se "Apagar capturas e voltar aos exemplos" antes de subir
- [ ] Desligar o Wi-Fi e ficar só no 5G, porque o iOS prefere Wi-Fi mesmo quando ele está congestionado
- [ ] Rodar o fluxo completo algumas vezes seguidas, usando Ajustes → Reiniciar demonstração entre as voltas
- [ ] Abrir o app no celular antes de subir ao palco, para o bundle já estar em memória
- [ ] Gravar um vídeo de tela do fluxo funcionando, como plano B
- [ ] Depois da apresentação, revogar a chave da API
