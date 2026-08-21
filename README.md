# JOVI Flow

Protótipo da próxima geração da experiência de câmera da **JOVI**, voltado a estudantes universitários em tempo integral.

**Challenge FIAP × JOVI 2026** · Apresentação em 27/08/2026

> "Todo mundo já tem OCR. Ninguém tem uma câmera que sabe que você está em aula."

---

## O que é

O professor apaga a lousa em 40 segundos. Você tem um único movimento: pegar o celular e fotografar. A dor não é tirar a foto — é o que acontece depois dela, quando a foto some entre milhares de outras na galeria e nunca mais é revisitada.

O **JOVI Flow** é uma experiência de estudo integrada à câmera, organizada em quatro passos:

`Capturar → Entender → Organizar → Estudar`

### Os dois diferenciais

**1. O Modo Aula muda o comportamento da câmera, não só o destino da foto.**
Ao reconhecer uma lousa, a captura passa a combinar múltiplos frames, suprimir o reflexo do quadro, corrigir a perspectiva e realçar o traço de caneta. Isso vive no sistema de câmera, não numa loja de aplicativos.

**2. O Flow cruza o conteúdo com a grade horária do estudante.**
O app não adivinha a matéria — ele confirma. Terça-feira, 10:00, Cálculo I, sala A-312. É contexto que um leitor de texto genérico não tem.

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

**Não atualize o SDK.** Se o Expo Go do celular for atualizado para uma versão mais nova, o app deixa de abrir com a mensagem *"Project is incompatible with this version of Expo Go"*. Antes da apresentação, desligue a atualização automática de apps.

---

## Decisões de projeto

**Zero rede.** Não há nenhuma chamada HTTP no código. O OCR e a IA são simulados com atraso e conteúdo pré-definido. O motivo é prático: o Wi-Fi do campus não é confiável e um pitch de 5 minutos não sobrevive a um timeout. O app funciona 100% em modo avião.

**Estado em memória.** Sem banco de dados. Um React Context basta para o escopo do protótipo.

**Fora do escopo.** Login, cadastro, onboarding e configurações não foram implementados.

**Aparência.** As regras visuais estão em [`DESIGN.md`](DESIGN.md), que tem precedência sobre o plano de build. A direção é a de um instrumento de câmera — denso, técnico e numérico — e não a de um aplicativo de notas com tema escuro.

---

## Stack

| Item | Versão |
|---|---|
| Expo SDK | 54 |
| React Native | 0.81.5 |
| React | 19.1.0 |
| TypeScript | 5.9 (modo estrito) |

Navegação com React Navigation (stack nativo + abas), gráficos com `react-native-svg`, câmera com `expo-camera`, ícones do `@expo/vector-icons`.

---

## Estrutura

```
App.tsx                    providers + navegação raiz
src/
├── theme.ts               tokens — fonte única de cor, espaço e tipografia
├── data/mock.ts           todo o conteúdo simulado, incluindo a grade horária
├── store/FlowContext.tsx  estado da captura em andamento
├── hooks/                 useReduzirMovimento
├── components/            8 componentes reutilizáveis
├── navigation/            RootStack, MainTabs e os tipos de rota
└── screens/               11 telas
```

---

## Qualidade

```bash
npx tsc --noEmit     # zero erro de tipo
npx expo-doctor      # zero problema de dependência
```

O código não usa `any` nem `@ts-ignore`, e nenhuma cor é escrita fora de `src/theme.ts`.

**Acessibilidade:** áreas tocáveis de no mínimo 44×44 pt, `accessibilityRole` e `accessibilityLabel` em todo elemento acionável, estado nunca comunicado apenas por cor, e animações reduzidas quando o sistema pede menos movimento.

