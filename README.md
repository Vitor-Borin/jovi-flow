# JOVI Flow

Protótipo da próxima geração da experiência de câmera da **JOVI**, voltado a estudantes universitários.

**Challenge FIAP × JOVI 2026** · Apresentação em 27/08/2026

> "Todo mundo já tem OCR. Ninguém tem uma câmera que sabe que você está em aula."

---

## O que é

O professor apaga a lousa em 40 segundos. Você tem um único movimento: pegar o celular e fotografar. A dor não é tirar a foto — é o que acontece depois dela, quando a foto some entre milhares de outras na galeria e nunca mais é revisitada.

O **JOVI Flow** é uma experiência de estudo integrada à câmera, organizada em quatro passos:

`Capturar → Entender → Organizar → Estudar`

**Não é um aplicativo de loja.** É uma funcionalidade da câmera do aparelho — por isso o protótipo abre direto no visor, e não numa tela de menu. As demais telas são o que o Flow produziu, alcançáveis a partir da câmera, como a galeria é alcançável de dentro de qualquer câmera nativa.

### Os dois diferenciais

**1. O Modo Aula muda o comportamento da câmera, não só o destino da foto.**

Ao reconhecer uma superfície de estudo, a captura passa a combinar múltiplos frames, suprimir reflexo, corrigir perspectiva e realçar o traço. E distingue três superfícies com problemas ópticos opostos:

| Modo | O problema que resolve |
|---|---|
| **Lousa** | reflexo da janela, giz apagado, foto tirada de lado |
| **Slide** | projeção estourada em sala escura, com cintilação |
| **Caderno** | sombra da própria mão, papel curvado sobre a mesa |

Um "modo documento" genérico trata os três igual e falha nos três.

**2. O Flow usa a grade horária do estudante como contexto.**

O app não adivinha a matéria. E, quando não tem como confirmar, ele **diz que não tem** em vez de inventar. São três estados:

| Situação | O que a tela afirma |
|---|---|
| Em aula agora | "Confirmado pela sua grade — Front-End Design · LAB 402 · **agora**" |
| Fora de aula, mas o assunto é de uma disciplina sua | "Uma das suas disciplinas — Front-End Design" |
| Assunto que não está na grade | "Assunto fora da sua grade — o Flow vai abrir uma pasta nova" |

O terceiro estado cobre o estudante revisando em casa, no fim de semana, longe da faculdade. A grade continua sendo a camada mais forte quando existe, mas deixou de ser a única.

---

## Como rodar

Requisitos: **Node.js 20+** e o app **Expo Go** no celular.

```bash
npm install
npx expo start
```

Leia o QR code com a câmera do iPhone (ou pelo próprio Expo Go no Android). O celular e o computador precisam estar na mesma rede.

### Atenção à versão do Expo Go

O projeto está fixado no **Expo SDK 54**, porque essa é a versão suportada pelo Expo Go do aparelho usado na apresentação.

**Não atualize o SDK.** Se o Expo Go do celular for atualizado para uma versão mais nova, o app deixa de abrir com a mensagem *"Project is incompatible with this version of Expo Go"*. Antes da apresentação, desligue a atualização automática de apps no aparelho.

---

## Modo de análise ao vivo

Por padrão o app roda **inteiramente offline**, com conteúdo de exemplo. O modo ao vivo, opcional, faz a IA **ler de verdade** a foto capturada — qualquer lousa, qualquer papel, qualquer assunto.

### Como ligar

```bash
cp .env.example .env
```

Cole uma chave da API da Anthropic na última linha do `.env` e reinicie:

```bash
npx expo start --clear
```

Depois, no aplicativo: **Perfil → Análise ao vivo**. Sem chave configurada, o interruptor aparece desabilitado e o app segue funcionando offline.

> **Segurança.** Variáveis `EXPO_PUBLIC_*` são embutidas no pacote do aplicativo — qualquer pessoa com acesso ao bundle consegue lê-las. Use uma chave descartável, com limite de gasto configurado no Console, e revogue depois da apresentação. O `.env` está no `.gitignore` e nunca deve ser commitado.
>
> Num produto real, a credencial ficaria no backend da JOVI e o aparelho jamais a veria. Aqui ela está no app porque é protótipo.

### Como funciona: duas chamadas, não uma

O gargalo não é a rede — é a **geração da resposta**. Medido contra a API real, sobre a mesma imagem:

| Tarefa | Saída | Sonnet 5 | Opus 5 |
|---|---|---|---|
| Só classificar | 49 tokens | **2,1s** | 5,1s |
| Transcrever tudo | 682 tokens | 8,2s | 11,5s |

A parte cara de gerar — a transcrição inteira — é justamente a que fica **embaixo da tela**, num card com rolagem. Matéria, tema e tópico ficam no topo e são os primeiros que alguém lê.

Por isso o trabalho é dividido em duas chamadas independentes, disparadas em paralelo no momento da captura:

```
classificação   imagem de 768px    ~21 KB    ~2s    → topo da tela e pasta de destino
transcrição     imagem de 1568px   ~250 KB   ~8s    → texto extraído e resumo
```

A classificação usa imagem pequena de propósito: medido, ela acerta igual com 768px e com 1568px. **A parte visível da tela deixa de depender de banda** — 21 KB sobem em qualquer rede. Os 250 KB alimentam o que ainda está fora da tela.

### O que acontece quando falha

Nada quebra. Sem chave, sem internet, resposta lenta ou JSON inválido: aquela parte cai no conteúdo de exemplo e o fluxo continua. As duas chamadas são independentes — uma falhar não derruba a outra. Há uma repetição automática em falha de rede, e teto de tempo em cada chamada.

Como a análise roda **em paralelo com a animação de processamento**, que dura ~6,4s, o modo ao vivo não adiciona nenhuma espera percebida.

---

## Decisões de projeto

**Offline por padrão, rede isolada e opcional.** Existe exatamente **uma** chamada de rede em todo o código, em `src/services/analiseAoVivo.ts`, e ela só acontece com o modo ao vivo ligado. Com ele desligado o app funciona 100% em modo avião. O motivo é prático: o Wi-Fi do campus não é confiável e um pitch de 5 minutos não sobrevive a um timeout.

**Estado em memória.** Sem banco de dados. Um React Context basta para o escopo do protótipo. Fechar o app zera tudo — é uma limitação conhecida e aceita.

**Fora do escopo.** Login, cadastro, onboarding e configurações não foram implementados.

**Aparência.** As regras visuais estão em [`DESIGN.md`](DESIGN.md), que tem precedência sobre o plano de build. A direção é a de um instrumento de câmera — denso, técnico e numérico — e não a de um aplicativo de notas com tema escuro.

---

## Viabilidade técnica

O Flow não depende de tecnologia que ainda não existe. A tela **Perfil → Viabilidade técnica** lista, dentro do próprio app, qual API aberta sustenta cada peça:

| Capacidade | API | Onde roda |
|---|---|---|
| Recorte, perspectiva e realce | ML Kit Document Scanner | no aparelho |
| Múltiplos frames e anti-reflexo | CameraX / Camera2 | no aparelho |
| Reconhecer que o alvo é uma lousa | ML Kit Image Labeling | no aparelho |
| Leitura do texto | ML Kit Text Recognition v2 | no aparelho |
| Resumo, flashcards e questões | Gemini API, ou Gemini Nano | nuvem ou aparelho |
| Cruzar com a grade | Google Calendar API | nuvem |
| Enviar para a turma | Google Classroom e Drive API | nuvem |

O protótipo usa a API da Anthropic no modo ao vivo para demonstrar o conceito ponta a ponta. Numa JOVI de verdade, esse papel seria do Gemini Nano rodando no próprio aparelho.

---

## Stack

| Item | Versão |
|---|---|
| Expo SDK | 54 |
| React Native | 0.81.5 |
| React | 19.1.0 |
| TypeScript | 5.9 (modo estrito) |

Navegação com React Navigation (stack nativo + abas), gráficos com `react-native-svg`, câmera com `expo-camera`, redimensionamento com `expo-image-manipulator`, ícones do `@expo/vector-icons`.

---

## Estrutura

```
App.tsx                     providers + navegação raiz
.env.example                modelo de configuração do modo ao vivo
src/
├── theme.ts                tokens — fonte única de cor, espaço e tipografia
├── data/mock.ts            conteúdo de exemplo, grade horária, sub-modos, plataformas
├── store/FlowContext.tsx    estado da captura em andamento
├── services/               análise ao vivo — o único ponto que toca a rede
├── hooks/                  useReduzirMovimento
├── components/             8 componentes reutilizáveis
├── navigation/             RootStack, MainTabs e os tipos de rota
└── screens/                13 telas
```

---

## Qualidade

```bash
npx tsc --noEmit     # zero erro de tipo
npx expo-doctor      # zero problema de dependência
```

O código não usa `any` nem `@ts-ignore`, e nenhuma cor é escrita fora de `src/theme.ts`.

**Acessibilidade:** áreas tocáveis de no mínimo 44×44 pt, `accessibilityRole` e `accessibilityLabel` em todo elemento acionável, estado nunca comunicado apenas por cor, e animações reduzidas quando o sistema pede menos movimento.

---

## Antes de apresentar

- [ ] Desligar **atualização automática de apps** no iPhone — se o Expo Go atualizar, o app não abre
- [ ] Desligar o **Wi-Fi** e ficar só no 5G — o iOS prefere Wi-Fi mesmo quando ele está congestionado
- [ ] Rodar o fluxo completo algumas vezes seguidas, usando **Perfil → Reiniciar demonstração** entre as voltas
- [ ] Abrir o app no celular **antes** de subir ao palco, para o bundle já estar em memória
- [ ] Gravar um vídeo de tela do fluxo funcionando, como plano B
- [ ] Depois da apresentação: **revogar a chave da API**
