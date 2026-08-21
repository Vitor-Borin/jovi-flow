# JOVI FLOW — Plano de Construção do Protótipo
### Documento de execução para Claude Code · Challenge FIAP × JOVI 2026

> **Este arquivo é a fonte da verdade do projeto.** Leia por completo antes de escrever a primeira linha.
> Execute **uma fase por vez**, na ordem. Não avance de fase com erro aberto.

---

## 0. Contexto do projeto

**Cliente:** JOVI — marca de smartphones da vivo Mobile Communication Co., Ltd.
**Brief:** propor a próxima geração da **experiência de câmera**, para **estudantes universitários full-time**.
**Produto:** **JOVI Flow** — uma experiência de estudo integrada à câmera.
**Conceito central:** `Capturar → Entender → Organizar → Estudar`
**Prazo inegociável:** apresentação em **27 de agosto de 2026**. Pitch de 5 minutos, ao vivo, com o app rodando em celular real via Expo Go.

**Frase de posicionamento:**
> "Todo mundo já tem OCR. Ninguém tem uma câmera que sabe que você está em aula."

### 0.1 Os dois diferenciais que NÃO podem ser cortados

Estes dois pontos foram adicionados depois de uma análise crítica da proposta e são o que separa este projeto de "mais um app de notas". Estão marcados no documento inteiro como **[D1]** e **[D2]**.

**[D1] O Modo Aula muda o comportamento da CÂMERA, não só o destino da foto.**
Sem isso, a banca pergunta: *"isso roda em qualquer Android, cadê a inovação de câmera da JOVI?"* — e o projeto perde. O Modo Aula precisa demonstrar, na tela, que a câmera está capturando **diferente**:
- combinação de múltiplos frames (reduz ruído e tremida)
- supressão de reflexo do quadro
- correção de perspectiva (deskew) — a lousa fica reta
- realce de traço de caneta/giz (contraste priorizando texto, não rosto)

**[D2] O Flow cruza o conteúdo com a GRADE HORÁRIA do estudante.**
Sem isso, a banca pergunta: *"e se a IA errar a matéria?"*. Com isso, a resposta é forte: o Flow não adivinha — ele **confirma**. Terça, 10:00 = Cálculo I, sala A-312. Isso é contexto que o Google Lens não tem.

---

## 1. Regras de trabalho — LEIA COM ATENÇÃO

Estas regras existem para o projeto **nunca ficar quebrado**. O prazo é curto e não há margem para um dia perdido debugando.

### 1.1 Portões de qualidade (quality gates)

Ao final de **cada fase**, execute nesta ordem e só avance se tudo passar:

```bash
npx tsc --noEmit          # 1. zero erro de tipo. Obrigatório.
npx expo-doctor           # 2. zero problema de dependência
npx expo start --clear    # 3. o bundle compila e o app abre no celular
```

- **Se `tsc` apontar qualquer erro: pare e conserte antes de escrever qualquer código novo.** Não acumule erro "pra resolver depois" — em React Native um erro de tipo vira crash de tela branca no celular.
- Nunca use `any` para calar o compilador. Se o tipo está difícil, o desenho do dado está errado — conserte o dado.
- Nunca use `@ts-ignore`.

### 1.2 Como trabalhar

- **Um arquivo por vez, completo.** Não deixe arquivo pela metade nem `TODO` no meio do caminho.
- **Nunca quebre uma tela que já funcionava.** Se uma mudança afeta uma tela pronta, reteste ela.
- **Commite ao final de cada fase**, com mensagem descritiva em português: `feat(fase-4): camera e modo aula`.
- **Antes de instalar qualquer dependência nova, pergunte.** A lista da Fase 0 é fechada e foi escolhida por compatibilidade com Expo Go.
- **Sempre use `npx expo install <pacote>`**, nunca `npm install <pacote>` para libs nativas — o `expo install` trava a versão compatível com o SDK.
- Todo texto visível ao usuário é em **português do Brasil**.
- Comentários no código: em português, e só onde a intenção não é óbvia.

### 1.3 Checkpoints de teste no celular real

Nas fases **3, 4, 5 e 8** é obrigatório parar e pedir ao Vitor para testar no celular antes de continuar. Emulador não vale para a fase de câmera.

### 1.4 O que este protótipo NÃO é

- **Não** chama nenhuma API externa. Zero rede. O OCR e a IA são **simulados** com delay e conteúdo pré-definido.
  *Motivo:* o Wi-Fi do campus não é confiável e um pitch de 5 minutos não sobrevive a um timeout.
- **Não** persiste dados em banco. Estado em memória (React Context) é suficiente.
- **Não** implementa login, cadastro, onboarding ou configurações. Fora do escopo.

---

## 2. Stack e versões

Ambiente: **Windows**, Node.js 20+ instalado, celular com o app **Expo Go** (versão da loja, que suporta o SDK mais recente).

| Item | Versão | Observação |
|---|---|---|
| Expo SDK | `~57.0.15` | O Expo Go da loja acompanha o SDK mais recente |
| React Native | `0.86.2` | vem com o SDK 57 |
| React | `19.2.3` | |
| TypeScript | `~6.0.3` | modo estrito |
| Template | `blank-typescript` | |

**Dependências fechadas** (nenhuma além destas sem perguntar):

```
@react-navigation/native
@react-navigation/native-stack
@react-navigation/bottom-tabs
react-native-screens
react-native-safe-area-context
react-native-svg
expo-camera
expo-linear-gradient
expo-haptics
expo-blur
```

`@expo/vector-icons` já vem com o Expo — use `Ionicons` e `MaterialCommunityIcons` dele para todos os ícones. **Não** instale outra biblioteca de ícones.

---

## 3. Estrutura de arquivos

```
jovi-flow/
├── App.tsx                        # providers + navegação raiz
├── app.json
├── src/
│   ├── theme.ts                   # tokens — FONTE ÚNICA de cor/espaço/tipo
│   ├── data/
│   │   └── mock.ts                # todo conteúdo simulado
│   ├── store/
│   │   └── FlowContext.tsx        # estado da captura em andamento
│   ├── components/
│   │   ├── Badge.tsx
│   │   ├── PrimaryButton.tsx
│   │   ├── GhostButton.tsx
│   │   ├── Card.tsx
│   │   ├── ScreenHeader.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── StepList.tsx
│   │   └── WhiteboardFallback.tsx
│   ├── navigation/
│   │   ├── RootStack.tsx
│   │   └── MainTabs.tsx
│   └── screens/
│       ├── HomeScreen.tsx         # Início
│       ├── CameraScreen.tsx       # telas 1, 2, 3
│       ├── ProcessingScreen.tsx   # tela 4  [D1]
│       ├── IdentifiedScreen.tsx   # tela 5  [D1][D2]
│       ├── OrganizeScreen.tsx     # tela 6
│       ├── ActionsScreen.tsx      # tela 7
│       ├── SummaryScreen.tsx      # tela 8
│       ├── QuestionsScreen.tsx    # extra
│       ├── StudiesScreen.tsx      # tela 9
│       ├── ReviewScreen.tsx       # tela 10
│       └── ProfileScreen.tsx      # simples
└── INTEGRANTES.TXT                # exigência da FIAP
```

**Regra rígida:** nenhum valor de cor, raio ou espaçamento escrito direto no componente. Tudo vem de `src/theme.ts`. Se faltar um token, adicione ao theme — não improvise no arquivo da tela.

---

## 4. Design System — extraído das telas do grupo

Tema **escuro**, quase preto com leve viés verde. Verde é a cor de ação e de "Flow ativo" — usar com parcimônia, só para o que é acionável ou para sinalizar que o Modo Aula está ligado.

### 4.1 `src/theme.ts` — copie exatamente

```ts
export const colors = {
  bg: '#0B0F0D',
  bgElev: '#111815',
  surface: '#151D19',
  surfaceAlt: '#1B2521',
  surfaceHi: '#222E28',
  border: '#28352F',
  borderSoft: '#1F2A25',

  primary: '#12A150',
  primaryHi: '#16C060',
  primaryDim: '#0C6E37',
  primarySoft: 'rgba(18,161,80,0.14)',
  primaryEdge: 'rgba(18,161,80,0.45)',

  text: '#F1F5F3',
  textDim: '#93A29B',
  textFaint: '#5D6B64',

  warn: '#F0B429',
  danger: '#E5484D',
  info: '#3B82F6',

  overlay: 'rgba(5,8,7,0.82)',
  scrim: 'rgba(0,0,0,0.55)',
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

export const spacing = (n: number) => n * 4;

export const font = {
  h1:      { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2:      { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3:      { fontSize: 16, fontWeight: '600' as const },
  body:    { fontSize: 14, fontWeight: '400' as const },
  bodyMed: { fontSize: 14, fontWeight: '600' as const },
  small:   { fontSize: 12, fontWeight: '400' as const },
  tiny:    { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.3 },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
};
```

### 4.2 Regras de uso

| Elemento | Regra |
|---|---|
| Fundo da tela | `colors.bg` |
| Card / campo | `colors.surface`, borda `1px colors.border`, raio `radius.md` |
| Botão primário | fundo `colors.primary`, texto `#FFF`, altura **52**, raio `radius.md`, peso 600 |
| Botão secundário | transparente, borda `colors.border`, texto `colors.text` |
| Botão texto | só texto `colors.textDim`, sem fundo |
| Badge "FLOW ATIVO" | fundo `colors.primary`, texto branco, `font.tiny`, raio `pill`, padding 6×10 |
| Badge "MODO AULA" | fundo `colors.primarySoft`, borda `colors.primaryEdge`, texto `colors.primaryHi` |
| Título de seção | `font.h2`, `colors.text` |
| Rótulo de campo | `font.small`, `colors.textDim`, acima do valor |
| Divisor | `1px colors.borderSoft` |

### 4.3 Acessibilidade (vale nota em Front-End Design)

- Toda área tocável: mínimo **44×44 pt**.
- Todo botão/ícone acionável: `accessibilityRole` e `accessibilityLabel` preenchidos.
- Nunca comunicar estado **só** por cor — o badge "FLOW ATIVO" tem texto, não só um ponto verde.
- Contraste mínimo 4.5:1 para texto normal. `colors.textFaint` só para texto decorativo, nunca para informação essencial.
- Respeitar `AccessibilityInfo.isReduceMotionEnabled()` — se ligado, cortar animações longas e ir direto ao estado final.

---

## 5. FASES DE EXECUÇÃO

---

### FASE 0 — Ambiente e esqueleto

**Objetivo:** projeto criado, dependências instaladas, app abrindo no celular.

```bash
node -v                 # precisa ser 20 ou maior
npx create-expo-app@latest jovi-flow --template blank-typescript
cd jovi-flow
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context react-native-svg expo-camera expo-linear-gradient expo-haptics expo-blur
```

Em `app.json`, configurar:
- `"name": "JOVI Flow"`, `"slug": "jovi-flow"`
- `"userInterfaceStyle": "dark"`
- `"backgroundColor": "#0B0F0D"` (em `expo` e em `android.adaptiveIcon`)
- `"orientation": "portrait"`
- plugin do `expo-camera` com a permissão em português:
  `"O JOVI Flow usa a câmera para capturar o conteúdo das suas aulas."`

Em `tsconfig.json`, garantir `"strict": true`.

**✅ Critério de aceite**
- [ ] `npx tsc --noEmit` sem erro
- [ ] `npx expo-doctor` sem problema
- [ ] `npx expo start` gera QR e o app abre no Expo Go com fundo escuro

---

### FASE 1 — Fundação visual

**Objetivo:** tokens e componentes reutilizáveis prontos e testados isoladamente.

**Arquivos:** `src/theme.ts` (seção 4.1, cópia exata) + os 8 componentes de `src/components/`.

Especificação de cada componente:

- **`Badge.tsx`** — props: `label: string`, `variant: 'solid' | 'soft' | 'neutral'`, `dot?: boolean`. Pílula pequena. `solid` = fundo primary; `soft` = fundo primarySoft com borda; `neutral` = surfaceAlt.
- **`PrimaryButton.tsx`** — props: `label`, `onPress`, `disabled?`, `loading?`, `icon?`. Altura 52, largura total, raio `md`, estado `disabled` com opacidade 0.4. Dispara `Haptics.impactAsync(Light)` no toque.
- **`GhostButton.tsx`** — props: `label`, `onPress`, `variant: 'outline' | 'text'`.
- **`Card.tsx`** — container padrão: `surface`, borda, raio `md`, padding 16. Props: `children`, `style?`, `onPress?` (vira tocável com feedback se receber `onPress`).
- **`ScreenHeader.tsx`** — props: `title?`, `onBack?`, `right?: ReactNode`. Seta de voltar à esquerda (área tocável 44×44), título centralizado ou à esquerda, slot livre à direita (usado para o badge FLOW ATIVO).
- **`ProgressRing.tsx`** — anel circular de progresso em `react-native-svg`. Props: `progress: number` (0 a 1), `size?`, `stroke?`, `children?` (conteúdo central, normalmente um ícone). Trilha em `colors.border`, arco em `colors.primary`, ponta arredondada, animado suavemente.
- **`StepList.tsx`** — lista vertical de etapas. Props: `steps: {id, label, detalhe}[]`, `activeIndex: number`. Cada linha: ícone à esquerda (✓ verde se concluída, spinner se ativa, círculo vazio `colors.textFaint` se pendente), label e detalhe. Concluídas ficam com texto normal; pendentes com `colors.textFaint`.
- **`WhiteboardFallback.tsx`** — um "quadro" desenhado só com Views e Text (nada de arquivo de imagem), simulando a lousa de Função: título "FUNÇÃO", blocos "Definição" e "Exemplos", as fórmulas. Usado quando a permissão de câmera é negada ou o app roda em emulador. **Motivo:** garante que a demo funcione em qualquer situação.

**✅ Critério de aceite**
- [ ] `npx tsc --noEmit` sem erro
- [ ] Crie uma tela temporária de teste renderizando **todos** os componentes em todas as variantes, valide no celular, e **apague essa tela** antes de commitar
- [ ] Nenhum hex escrito fora de `theme.ts` (confira com: `grep -rn "#[0-9a-fA-F]\{6\}" src/ --include=*.tsx`)

---

### FASE 2 — Dados e estado

**Objetivo:** toda a camada simulada pronta, sem UI.

**`src/data/mock.ts`** — conteúdo completo fornecido na **seção 7** deste documento. Copie exatamente.

**`src/store/FlowContext.tsx`** — Context + hook `useFlow()`. Estado:

```ts
type FlowState = {
  flowAtivo: boolean;              // Modo Aula ligado/desligado
  fotoUri: string | null;          // foto REAL capturada pelo usuário
  destino: string[];               // ex.: ['Matemática','Cálculo','Funções']
  resumoSalvo: boolean;
  ativarFlow: (v: boolean) => void;
  definirFoto: (uri: string | null) => void;
  definirDestino: (d: string[]) => void;
  salvarResumo: () => void;
  reiniciar: () => void;           // volta ao estado inicial para repetir a demo
};
```

`reiniciar()` é essencial: permite refazer o pitch várias vezes sem fechar o app.

**✅ Critério de aceite**
- [ ] `npx tsc --noEmit` sem erro
- [ ] `slotAtual()` devolve um slot válido testado em pelo menos 3 dias/horários diferentes (inclusive fora de horário de aula — precisa cair no fallback, nunca retornar `undefined`)

---

### FASE 3 — Navegação 🔴 *testar no celular*

**Objetivo:** todas as rotas navegáveis com telas ainda vazias.

**`src/navigation/MainTabs.tsx`** — 5 abas, barra inferior fundo `colors.bgElev`, borda superior `colors.borderSoft`, ícone ativo `colors.primary`, inativo `colors.textFaint`:

| Aba | Ícone (Ionicons) | Tela |
|---|---|---|
| Início | `home` / `home-outline` | HomeScreen |
| Estudos | `folder` / `folder-outline` | StudiesScreen |
| **(botão central)** | `add` | **abre a CameraScreen** |
| Revisão | `albums` / `albums-outline` | ReviewScreen |
| Perfil | `person` / `person-outline` | ProfileScreen |

O botão central é um **círculo verde elevado** (56×56, `colors.primary`, sombra `shadow.glow`), sobreposto à barra — não é uma aba de verdade: ele intercepta o toque e chama `navigation.navigate('Camera')`.

**`src/navigation/RootStack.tsx`** — Stack nativo, `headerShown: false`, fundo `colors.bg`:

```
Tabs (MainTabs)
Camera          → animation: 'fade',       gestureEnabled: false
Processing      → animation: 'fade',       gestureEnabled: false
Identified      → animation: 'slide_from_right'
Organize        → animation: 'slide_from_right'
Actions         → animation: 'slide_from_bottom'
Summary         → animation: 'slide_from_right'
Questions       → animation: 'slide_from_right'
```

`gestureEnabled: false` em Camera e Processing evita que um swipe acidental quebre a demo no meio do pitch.

Tipar as rotas com `RootStackParamList` e usar `NativeStackScreenProps` — nada de `navigation: any`.

**✅ Critério de aceite**
- [ ] `npx tsc --noEmit` sem erro
- [ ] **No celular:** navegar por todas as 5 abas e todas as 7 telas do stack, ida e volta, sem crash
- [ ] O botão verde central abre a câmera

---

### FASE 4 — Câmera e Modo Aula 🔴 *testar no celular* · **[D1]**

**Objetivo:** as telas 1, 2 e 3 do design, com câmera real e o Modo Aula demonstrando que a captura muda.

Tudo em `CameraScreen.tsx`, controlado por um estado local:
`type Etapa = 'inativo' | 'ativo' | 'confirmar'`

#### Tela 1 — Câmera com Flow desativado (`etapa: 'inativo'`)

- `CameraView` do `expo-camera` ocupando a área central, proporção 4:3, cantos arredondados `radius.lg`.
  - Se a permissão for negada ou a câmera falhar → renderizar `WhiteboardFallback` no lugar. **A tela nunca fica preta.**
  - Pedir permissão com `useCameraPermissions()`. Se negada, mostrar um aviso discreto e um botão "Permitir câmera".
- **Barra superior** (ícones `colors.text`, fundo transparente): flash · HDR · timer · `4:3` · engrenagem. São decorativos, exceto o **flash**, que alterna visualmente.
- **Badge "FLOW"** no canto superior direito do visor: variante `neutral`, apagado. Tocável — é o que liga o Modo Aula.
- **Pílula de zoom** `1x` centralizada na base do visor.
- **Carrossel de modos** horizontal: `Noite · Retrato · Foto · Vídeo · Mais`. O selecionado fica em `colors.primary`; os demais em `colors.textDim`. Rolagem horizontal com snap.
- **Linha do obturador:** miniatura da galeria (quadrado `surfaceAlt`, raio `sm`) · **obturador branco sólido** (72×72, círculo) · ícone de inverter câmera.

**Gatilho da demo:** 2,5 segundos depois de a tela abrir, o app "detecta" a lousa e transita sozinho para `'ativo'`. Também é possível ir na mão tocando no badge FLOW. O automático é o que impressiona no pitch; o manual é a garantia se o timing falhar.

#### Tela 2 — Flow ativado / Modo Aula (`etapa: 'ativo'`)

Muda em relação à tela 1:

- No topo do visor, dois badges lado a lado: **`FLOW ATIVO`** (solid) e **`MODO AULA`** (soft).
- **Pílula de detecção** flutuando sobre o visor, entrando com fade + leve subida:
  - ponto verde pulsante · **"Apontado para lousa"** em `bodyMed` · **"Detectamos conteúdo de aula"** em `small` / `textDim`
- **[D1] Chips de otimização da câmera** — uma linha rolável logo abaixo da pílula, cada chip com ícone e texto, entrando em cascata (80ms entre cada):
  - `⬛ Anti-reflexo` · `📐 Perspectiva` · `✍️ Traço realçado` · `🎞️ 4 frames`
  - Estes chips são **o coração do diferencial**. Deixe-os visualmente evidentes: fundo `primarySoft`, borda `primaryEdge`, texto `primaryHi`.
- **[D1] Toggle "Captura contínua"** no canto inferior do visor: quando ligado, um texto pequeno explica *"a câmera captura sozinha quando a lousa mudar"*. É só visual, mas é uma pergunta a menos na banca.
- **O obturador muda de forma:** deixa de ser branco sólido e vira um **anel verde** (`colors.primary`) com centro escuro — sinal de que a câmera está em outro modo. Adicione um `Animated` de pulso sutil e infinito no anel.
- **Moldura de detecção:** um retângulo com apenas os 4 cantos desenhados, em `colors.primary`, animando levemente para "encaixar" na lousa.

#### Tela 3 — Confirmar captura (`etapa: 'confirmar'`)

Aparece ao tocar no obturador. **Tire a foto de verdade antes de mostrar a folha** (`cameraRef.current.takePictureAsync()`) e guarde o `uri` no `FlowContext` — a foto real do usuário será usada nas telas seguintes. Se falhar, siga sem foto (as telas seguintes usam o fallback).

- Visor escurece com `colors.scrim`.
- **Bottom sheet** subindo (fundo `surface`, cantos superiores `radius.xl`, alça cinza no topo):
  - Título **"Capturar como conteúdo de aula?"** (`font.h3`)
  - Subtítulo *"O Flow irá analisar, organizar e salvar para seus estudos."* (`small` / `textDim`)
  - `PrimaryButton` **"Capturar"** → navega para `Processing`
  - `GhostButton variant="text"` **"Cancelar"** → volta para `'ativo'`

**✅ Critério de aceite**
- [ ] `npx tsc --noEmit` sem erro
- [ ] **No celular:** câmera abre, mostra imagem real, transiciona sozinha para Modo Aula em ~2,5s
- [ ] Os 4 chips de otimização aparecem em cascata e são legíveis
- [ ] A foto tirada é realmente salva no contexto (logar o `uri` para conferir)
- [ ] Negar a permissão de câmera **não** quebra a tela — cai no `WhiteboardFallback`

---

### FASE 5 — Processamento e reconhecimento 🔴 *testar no celular* · **[D1][D2]**

**Objetivo:** telas 4 e 5. É aqui que o pitch é ganho ou perdido.

#### Tela 4 — `ProcessingScreen.tsx` — **duas fases, não uma**

O design original tinha só a fase de IA. **Divida em duas**, para provar que a câmera trabalhou antes da IA:

**Fase A — "Otimizando captura"** (~2,4s, 600ms por etapa)
- Título **"Otimizando captura..."**, subtítulo *"A câmera está ajustando a imagem da lousa."*
- `ProgressRing` com ícone de câmera (`camera-iris`) no centro
- `StepList` com `etapasCamera` do mock: Combinando 4 frames → Suprimindo reflexo → Corrigindo perspectiva → Realçando traço de caneta

**Transição — o momento "antes e depois"** (~1,6s) — **a cena mais importante do pitch**
- Mostrar a **foto real que o usuário acabou de tirar** dentro de um card
- Ela começa com `transform: [{ rotate: '-4deg' }, { skewX: '3deg' }]` e um overlay branco translúcido simulando reflexo
- Anima para `0deg / 0skew`, o overlay de reflexo some, e o contraste "sobe"
- Rótulos **"ANTES"** → **"DEPOIS"** trocando junto
- Se não houver `fotoUri`, aplicar o mesmo efeito sobre o `WhiteboardFallback`

**Fase B — "Analisando conteúdo"** (~2,4s)
- Título **"Analisando conteúdo..."**, subtítulo *"Isso pode levar alguns segundos."*
- `ProgressRing` com ícone de cérebro (`brain`) no centro
- `StepList` com `etapasIA`: Identificando texto → Reconhecendo contexto → Organizando conteúdo → Finalizando

Ao terminar: `navigation.replace('Identified')` — **`replace`, não `navigate`**, para que o botão voltar não retorne ao processamento.

`GhostButton variant="outline"` **"Cancelar"** fixo na base, volta para a câmera.

> ⚠️ Limpe todos os `setTimeout` no `useEffect` de saída. Timer vazando depois de desmontar a tela é a causa nº 1 de crash aleatório em demo.

#### Tela 5 — `IdentifiedScreen.tsx`

- `ScreenHeader` com voltar + badge `FLOW ATIVO` à direita
- Título **"Conteúdo identificado!"** com ✨
- **[D2] Card de confirmação pela grade — coloque LOGO ABAIXO DO TÍTULO, é o diferencial mais forte da tela:**
  - Ícone de calendário, fundo `primarySoft`, borda `primaryEdge`
  - Texto: **"Confirmado pela sua grade"**
  - Detalhe: *"Terça-feira, 10:00 — Cálculo I · Sala A-312"* (vindo de `slotAtual()`)
  - Rodapé em `small`/`textDim`: *"O Flow não adivinhou a matéria: ele cruzou com o seu horário."*
- **[D1] Faixa "Ganhos da captura"** — 3 mini-cards lado a lado com `ganhosCaptura`:
  `Nitidez do texto +62%` · `Reflexo removido 3 pontos` · `Inclinação −12°`
- **Campos identificados**, cada um como rótulo pequeno + valor em card:
  - Matéria: `📐 Matemática` · Tema: `📊 Cálculo — Função` · Tópico: `📌 Definição e tipos de função` · Data: `📅` data e hora reais de agora
- **"Texto extraído:"** — card com `maxHeight` ~180 e scroll interno, fonte monoespaçada (`fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'`), conteúdo de `conteudoIdentificado.textoExtraido`
- `PrimaryButton` **"Organizar e salvar"** → `Organize`

**✅ Critério de aceite**
- [ ] `npx tsc --noEmit` sem erro
- [ ] **No celular:** as duas fases rodam na ordem e o "antes/depois" usa a foto real tirada na Fase 4
- [ ] O card da grade mostra dia e horário coerentes
- [ ] Sair da tela no meio do processamento não gera warning de state update em componente desmontado
- [ ] O texto extraído rola dentro do card sem empurrar o botão para fora da tela

---

### FASE 6 — Organização e ações

#### Tela 6 — `OrganizeScreen.tsx`

- Header com badge `FLOW ATIVO`
- Título **"Será salvo em:"**
- **Árvore de pastas indentada e animada**, cada nível entrando com 120ms de atraso, com linha de conexão vertical em `colors.borderSoft`:
  ```
  📁 Matemática
     └ 📁 Cálculo
        └ 📁 Funções
           └ 📄 Função — Aula 18/08     ← destaque em primarySoft
  ```
- `PrimaryButton` **"Salvar aqui"** → `Actions`
- `GhostButton variant="text"` **"Alterar pasta de destino"** → abre um `Modal` simples listando as matérias de `biblioteca`; escolher atualiza `destino` no contexto e fecha. Funcional de verdade — a banca costuma testar exatamente o link que parece decorativo.

#### Tela 7 — `ActionsScreen.tsx`

- Título **"Conteúdo salvo com sucesso!"** com ✅ e um ícone de check animado (escala 0 → 1 com mola) + `Haptics.notificationAsync(Success)`
- Subtítulo **"O que deseja fazer agora?"**
- **Grade 2×3** de cards tocáveis (`Card` com `onPress`), altura uniforme, ícone + título + descrição curta:

| Card | Ícone | Descrição | Destino |
|---|---|---|---|
| Gerar resumo | 📝 | Resuma o conteúdo em tópicos | `Summary` |
| Criar questões | ❓ | Gere perguntas para praticar | `Questions` |
| Revisar | 🧠 | Estude com flashcards | aba `Revisão` |
| Editar texto | ✏️ | Revise e edite o texto extraído | modal de edição |
| Compartilhar | 🔗 | Envie para uma plataforma | `Share.share()` nativo |
| Ver pasta | 📁 | Acessar onde foi salvo | aba `Estudos` |

**Todos os 6 cards precisam levar a algum lugar.** Card morto em protótipo é ponto perdido.

**✅ Critério de aceite**
- [ ] `npx tsc --noEmit` sem erro
- [ ] Os 6 cards navegam corretamente; nenhum é decorativo
- [ ] "Alterar pasta de destino" realmente muda o texto da árvore
- [ ] Os cards da grade têm a mesma altura mesmo com descrições de tamanhos diferentes

---

### FASE 7 — Conteúdo de estudo

#### Tela 8 — `SummaryScreen.tsx`
- Título **"Resumo gerado com IA"** ✨
- Card com os bullets de `resumoIA`, revelados um a um em fade (150ms entre cada) — simula geração sem precisar de API
- Rodapé com dois botões lado a lado: `GhostButton "Copiar"` (usa `Clipboard`, mostra confirmação) e `PrimaryButton "Salvar resumo"` (marca `resumoSalvo`, dispara háptico, volta para `Actions` com o card "Gerar resumo" agora marcado como feito)

#### `QuestionsScreen.tsx` (extra, não estava no design)
- Quiz simples com as 3 questões de `questoes`: enunciado + 4 alternativas
- Ao tocar: alternativa certa fica verde, errada fica `colors.danger` e a certa se revela
- Ao final, placar: *"Você acertou X de 3"*

#### Tela 9 — `StudiesScreen.tsx`
- Header: ícone de menu · **"Meus Estudos"** · ícone de busca (abre um `TextInput` que filtra as aulas de verdade)
- **Abas "Pastas" | "Recentes"** — indicador verde deslizando sob a aba ativa
- **Pastas:** árvore expansível a partir de `biblioteca`, com chevron rotacionando ao abrir. Cada aula: título, data e hora, e um `⋮` que abre um `ActionSheet`/`Alert` com Abrir · Renomear · Excluir
- **Recentes:** lista plana ordenada por data, mais nova primeiro
- A aula recém-capturada aparece no topo com um badge **"NOVO"**

#### Tela 10 — `ReviewScreen.tsx`
- Header **"Revisão"** com contador `1/10` à direita
- **Card de flashcard** ocupando a área central: pergunta centralizada + *"Clique para ver a resposta"*
- Ao tocar: **animação de virada 3D** (`rotateY` interpolado de 0° a 180°, com `backfaceVisibility: 'hidden'` nas duas faces) revelando a resposta
- Três botões na base: `✕ Não lembrei` (danger) · `↻ Difícil` (warn) · `✓ Fácil` (primary) — cada um avança o card e alimenta o contador
- **Barra de progresso** fina na base, preenchendo em `colors.primary`
- Ao final dos 10: tela de conclusão com o resultado e botão **"Revisar novamente"**

#### `HomeScreen.tsx` (aba Início)
- Saudação: **"Boa tarde, Vitor"** (variando por horário)
- **[D2] Card "Sua próxima aula"** — vindo de `slotAtual()`: matéria, disciplina, horário, sala. Se estiver em horário de aula: badge **"AGORA"** pulsante e o texto muda para *"Você está em aula"*
- **Botão grande "Abrir Modo Aula"** com ícone de câmera → `Camera`. É a ação principal do app, precisa dominar a tela
- **"Continue de onde parou"** — carrossel horizontal com as 3 aulas mais recentes
- **Faixa de estatísticas:** `12 aulas capturadas` · `4 matérias` · `38 flashcards`

#### `ProfileScreen.tsx`
Simples: avatar com iniciais, nome, curso ("Engenharia de Software — FIAP"), e uma lista de itens estáticos (Grade horária, Plataformas conectadas, Preferências do Modo Aula, Sobre). **Não** invente funcionalidade aqui — fora do escopo.

**✅ Critério de aceite**
- [ ] `npx tsc --noEmit` sem erro
- [ ] A virada do flashcard não deixa os dois lados visíveis ao mesmo tempo em nenhum frame
- [ ] A busca em Meus Estudos filtra de verdade
- [ ] As 10 questões de revisão percorrem até o fim e a tela final aparece

---

### FASE 8 — Polimento e blindagem da apresentação 🔴 *testar no celular*

**Objetivo:** o app não pode falhar no dia 27.

**Fluxo completo, ponta a ponta, 5 vezes seguidas sem fechar o app:**
`Início → Modo Aula → captura → otimização → antes/depois → identificado → organizar → ações → resumo → estudos → revisão`
Depois de cada volta, usar `reiniciar()` do contexto. Se travar ou ficar lento em alguma volta, há vazamento de memória — investigue os timers e os `Animated` em loop.

**Checklist final:**
- [ ] Modo avião ligado: **o app funciona 100%** (é a prova de que não há chamada de rede)
- [ ] Todos os `setTimeout` / `setInterval` limpos no unmount
- [ ] Nenhum warning amarelo no console durante o fluxo completo
- [ ] `AccessibilityInfo.isReduceMotionEnabled()` respeitado
- [ ] Todo tocável com `accessibilityLabel`
- [ ] Testado em tela pequena (largura ≤ 360px) sem corte nem sobreposição
- [ ] Textos longos não estouram o layout (`numberOfLines` + `ellipsizeMode` onde couber)
- [ ] `INTEGRANTES.TXT` na raiz com nome completo e RM de cada integrante
- [ ] `README.md` com: o que é o projeto, como rodar (`npm install` → `npx expo start`), e a lista de integrantes

**Plano B da banca — faça isso, não pule:**
1. **Grave um vídeo de tela** (screen record) do fluxo completo funcionando, com o celular. Se o Expo Go falhar no campus, você projeta o vídeo e o pitch continua.
2. Antes de apresentar: celular no **modo avião**, **não perturbe** ligado, **brilho no máximo**, bateria carregada.
3. Rode `npx expo start` e **abra o app no celular antes de subir ao palco**. Uma vez carregado, o bundle fica em memória.
4. Leve o notebook com o servidor já rodando e o celular no **hotspot do próprio notebook** — não dependa do Wi-Fi do campus.

---

## 6. Erros comuns e como resolver

| Sintoma | Causa provável | Solução |
|---|---|---|
| Tela branca no celular, sem erro | erro de tipo virou erro de runtime | `npx tsc --noEmit` e corrigir tudo |
| "Unable to resolve module" | dependência instalada com `npm` em vez de `expo install` | `npx expo install <pacote>` e `npx expo start --clear` |
| Câmera preta no Android | permissão não concedida | conferir `useCameraPermissions()` e o plugin no `app.json` |
| Warning "Can't perform a React state update on an unmounted component" | `setTimeout` não limpo | retornar `clearTimeout` no `useEffect` |
| Animação travada / app lento | `Animated` sem `useNativeDriver: true` | ativar onde for `transform`/`opacity` |
| Expo Go diz "SDK incompatível" | app da loja desatualizado | atualizar o Expo Go, ou alinhar o SDK do projeto |
| Mudança no código não aparece | cache do Metro | `npx expo start --clear` |
| QR não conecta | celular e PC em redes diferentes | mesma rede, ou usar `npx expo start --tunnel` |

---

## 7. `src/data/mock.ts` — conteúdo completo

Copie este arquivo **exatamente como está**. Ele já contém a grade horária **[D2]** e as etapas de otimização de câmera **[D1]**.

```ts
/**
 * Camada de dados simulada do JOVI Flow.
 * Nada aqui chama rede: o protótipo roda 100% offline por decisão de projeto,
 * para que a demonstração na banca não dependa do Wi-Fi do campus.
 */

export type Slot = {
  dia: number; // 0 = domingo
  inicio: string;
  fim: string;
  materia: string;
  disciplina: string;
  sala: string;
};

/** Diferencial: a grade horária do estudante dá contexto à câmera.
 *  O Flow não adivinha a matéria — ele confirma com o horário. */
export const gradeHoraria: Slot[] = [
  { dia: 1, inicio: '08:00', fim: '09:40', materia: 'Física',     disciplina: 'Mecânica II',   sala: 'B-204' },
  { dia: 2, inicio: '10:00', fim: '11:40', materia: 'Matemática', disciplina: 'Cálculo I',     sala: 'A-312' },
  { dia: 3, inicio: '08:00', fim: '09:40', materia: 'Química',    disciplina: 'Orgânica I',    sala: 'C-101' },
  { dia: 4, inicio: '10:00', fim: '11:40', materia: 'Matemática', disciplina: 'Cálculo I',     sala: 'A-312' },
  { dia: 5, inicio: '14:00', fim: '15:40', materia: 'Física',     disciplina: 'Mecânica II',   sala: 'B-204' },
];

/** Sempre devolve um slot para a demo funcionar em qualquer dia/hora. */
export function slotAtual(agora = new Date()): { slot: Slot; aoVivo: boolean } {
  const dia = agora.getDay();
  const min = agora.getHours() * 60 + agora.getMinutes();
  const toMin = (h: string) => {
    const [a, b] = h.split(':').map(Number);
    return a * 60 + b;
  };
  const emAula = gradeHoraria.find(
    (s) => s.dia === dia && min >= toMin(s.inicio) && min <= toMin(s.fim)
  );
  if (emAula) return { slot: emAula, aoVivo: true };
  return { slot: gradeHoraria[1], aoVivo: false };
}

/** Etapas de otimização da CÂMERA (antes da IA).
 *  É o que amarra o projeto ao brief da JOVI: o Modo Aula muda como a câmera captura. */
export const etapasCamera = [
  { id: 'frames',   label: 'Combinando 4 frames',        detalhe: 'Reduz ruído e tremida' },
  { id: 'reflexo',  label: 'Suprimindo reflexo',          detalhe: 'Remove brilho do quadro' },
  { id: 'deskew',   label: 'Corrigindo perspectiva',      detalhe: 'Deixa a lousa reta' },
  { id: 'texto',    label: 'Realçando traço de caneta',   detalhe: 'Contraste otimizado' },
];

/** Etapas de leitura/IA (depois da câmera). */
export const etapasIA = [
  { id: 'ocr',      label: 'Identificando texto',    detalhe: 'OCR do conteúdo' },
  { id: 'contexto', label: 'Reconhecendo contexto',  detalhe: 'Cruzando com sua grade' },
  { id: 'organiza', label: 'Organizando conteúdo',   detalhe: 'Matéria › Tema › Aula' },
  { id: 'fim',      label: 'Finalizando',            detalhe: 'Preparando ações' },
];

export const ganhosCaptura = [
  { label: 'Nitidez do texto', valor: '+62%' },
  { label: 'Reflexo removido', valor: '3 pontos' },
  { label: 'Inclinação', valor: '-12°' },
];

export const conteudoIdentificado = {
  materia: 'Matemática',
  tema: 'Cálculo — Função',
  topico: 'Definição e tipos de função',
  textoExtraido: `1. Definição
É uma relação que associa cada elemento de um conjunto A a exatamente um elemento de um conjunto B.

f: A → B
x ↦ f(x)

2. Exemplos
f(x) = 2x + 1
f(x) = x² - 4
f(x) = 1/x , x ≠ 0

3. Tipos de função
• Função Afim:      f(x) = ax + b   (a ≠ 0)
• Função Quadrática: f(x) = ax² + bx + c  (a ≠ 0)
• Função Constante:  f(x) = c
• Função Identidade: f(x) = x`,
};

export const caminhoSalvar = ['Matemática', 'Cálculo', 'Funções'];

export const resumoIA = [
  'Função é uma relação que associa cada elemento de um conjunto A a exatamente um elemento de um conjunto B.',
  'Representação: f: A → B  e  x ↦ f(x).',
  'Função Afim: f(x) = ax + b, com a ≠ 0 — gráfico é uma reta.',
  'Função Quadrática: f(x) = ax² + bx + c, com a ≠ 0 — gráfico é uma parábola.',
  'Função Constante: f(x) = c — valor de saída não depende de x.',
  'Função Identidade: f(x) = x — cada entrada devolve ela mesma.',
];

export const flashcards = [
  { p: 'O que é uma função?', r: 'Uma relação que associa cada elemento de um conjunto A a exatamente um elemento de um conjunto B.' },
  { p: 'Qual a forma geral da função afim?', r: 'f(x) = ax + b, com a ≠ 0. O gráfico é uma reta.' },
  { p: 'Qual a forma geral da função quadrática?', r: 'f(x) = ax² + bx + c, com a ≠ 0. O gráfico é uma parábola.' },
  { p: 'O que caracteriza a função constante?', r: 'f(x) = c — a saída é sempre a mesma, independente de x.' },
  { p: 'O que é a função identidade?', r: 'f(x) = x — cada entrada devolve ela mesma.' },
  { p: 'Na notação f: A → B, o que é A?', r: 'A é o domínio: o conjunto de todas as entradas possíveis.' },
  { p: 'Por que f(x) = 1/x exige x ≠ 0?', r: 'Porque a divisão por zero não é definida, então 0 fica fora do domínio.' },
  { p: 'O gráfico de f(x) = ax + b é o quê?', r: 'Uma reta, com inclinação dada por a e intercepto em b.' },
  { p: 'O que significa x ↦ f(x)?', r: 'Que o elemento x é levado (mapeado) ao elemento f(x).' },
  { p: 'Uma função pode levar um x a dois valores diferentes?', r: 'Não. Cada elemento do domínio tem exatamente uma imagem.' },
];

export const questoes = [
  { q: 'Dada f(x) = 2x + 1, calcule f(3).', alt: ['5', '7', '6', '8'], certa: 1 },
  { q: 'Qual dessas é uma função quadrática?', alt: ['f(x) = 3x + 2', 'f(x) = x² - 4', 'f(x) = 5', 'f(x) = x'], certa: 1 },
  { q: 'Para f(x) = 1/x, qual valor NÃO pertence ao domínio?', alt: ['1', '-1', '0', '2'], certa: 2 },
];

export type Aula = { id: string; titulo: string; data: string; hora: string; novo?: boolean };
export type Pasta = { nome: string; icone: string; subpastas: { nome: string; aulas: Aula[] }[] };

export const biblioteca: Pasta[] = [
  {
    nome: 'Matemática',
    icone: '📐',
    subpastas: [
      {
        nome: 'Cálculo',
        aulas: [
          { id: 'a1', titulo: 'Função — Aula 18/08', data: '18/08/2026', hora: '10:32' },
          { id: 'a2', titulo: 'Função Afim — Aula 11/08', data: '11/08/2026', hora: '09:15' },
          { id: 'a3', titulo: 'Limites — Aula 04/08', data: '04/08/2026', hora: '10:20' },
        ],
      },
    ],
  },
  {
    nome: 'Física',
    icone: '🧲',
    subpastas: [
      {
        nome: 'Mecânica II',
        aulas: [
          { id: 'b1', titulo: 'Torque — Aula 17/08', data: '17/08/2026', hora: '08:40' },
          { id: 'b2', titulo: 'Momento de inércia — Aula 10/08', data: '10/08/2026', hora: '08:35' },
        ],
      },
    ],
  },
  {
    nome: 'Química',
    icone: '⚗️',
    subpastas: [
      {
        nome: 'Orgânica I',
        aulas: [{ id: 'c1', titulo: 'Hidrocarbonetos — Aula 19/08', data: '19/08/2026', hora: '08:12' }],
      },
    ],
  },
];
```

---

## 8. Roteiro de pitch — 5 minutos

O protótipo existe para servir este roteiro. A demo ao vivo ocupa **2 minutos inteiros** — o dobro do que a versão anterior previa.

| Tempo | O quê | Na tela |
|---|---|---|
| **0:00–0:30** | **Cena, não dado.** "O professor termina a demonstração e apaga a lousa em 40 segundos. Você tem um único movimento: pegar o celular e fotografar." | Slide único, sem texto |
| **0:30–1:00** | **A dor real.** A foto foi tirada — e some entre 4 mil fotos da galeria. Ninguém revisita. A dor não é tirar a foto, é o que acontece depois dela. | Galeria bagunçada |
| **1:00–3:00** | **DEMO AO VIVO.** Abrir a câmera, apontar para um quadro de verdade na sala, o Modo Aula ativar sozinho, capturar, mostrar a correção de perspectiva e reflexo, o conteúdo reconhecido, a confirmação pela grade horária, o resumo e o flashcard. | Celular projetado |
| **3:00–4:00** | **Por que é JOVI e não um app.** O Modo Aula muda como a câmera captura: multi-frame, anti-reflexo, deskew, realce de traço. E cruza com a grade do aluno. Isso vive no sistema de câmera, não numa loja de apps. | 1 slide |
| **4:00–5:00** | **Fechamento.** "Hoje o estudante usa a câmera para registrar. Com o JOVI Flow, a câmera passa a entender." | Slide final |

**Regras do pitch:**
- Não explicar a pesquisa. Usar a pesquisa para sustentar uma história simples.
- Não dizer "não inventamos o OCR" nesse tom. Dizer: **"Todo mundo já tem OCR. Ninguém tem uma câmera que sabe que você está em aula."**
- Levar pelo menos **um número** — a banca de Storytelling cobra. Ex.: tempo economizado por aula, ou % de fotos de estudo nunca revisitadas.
- Nome do produto: **JOVI Flow**, sempre. Não misturar com "StudyLens" (nome antigo).

---

## 9. Ordem final de execução

```
FASE 0  Ambiente e esqueleto
FASE 1  Fundação visual
FASE 2  Dados e estado
FASE 3  Navegação             🔴 testar no celular
FASE 4  Câmera e Modo Aula    🔴 testar no celular   [D1]
FASE 5  Processamento         🔴 testar no celular   [D1][D2]
FASE 6  Organização e ações
FASE 7  Conteúdo de estudo
FASE 8  Polimento e blindagem 🔴 testar no celular
```

Ao final de cada fase: `npx tsc --noEmit` → `npx expo-doctor` → commit.
Nas fases 🔴: parar e pedir teste no celular antes de seguir.
