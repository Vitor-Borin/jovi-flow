# JOVI Flow — instruções do projeto

Protótipo do Challenge FIAP × JOVI 2026. O JOVI Flow é uma funcionalidade da
câmera do aparelho que transforma a foto da lousa em material de estudo
organizado: `Capturar → Entender → Organizar → Estudar`.

Sprint 4: 1 minuto de fala e 4 minutos de protótipo na mão. Tudo o que a tela
mostra precisa funcionar.

## Como rodar

```bash
npm install
npx expo start          # ler o QR com o Expo Go; celular e PC na mesma rede
```

Análise por IA: na câmera, engrenagem → Análise por IA → colar a chave da
Anthropic e Guardar. Uma vez só: fica no cofre do aparelho e a análise liga
sozinha ao abrir o app. Nada de `.env`.

Antes de commitar:

```bash
npx tsc --noEmit        # passa
npx expo-doctor         # 21/21 (SDK 57)
npm run testar:lousa    # 8 de 8, sempre que mexer em quadro.ts
```

## Regras que não se quebram

Cada uma destas já custou caro para descobrir.

| Regra | Motivo |
|---|---|
| Expo SDK fica no **57** | É o que o Expo Go da App Store roda desde que o iPhone da apresentação se atualizou em 15/09/2026. No iOS não dá para instalar Expo Go antigo: o SDK do projeto segue o do app, e mudar o SDK sem o Expo Go do aparelho acompanhar quebra o app na banca. |
| Logado na **mesma conta Expo** no terminal e no Expo Go | Exigencia nova do SDK 57 no iOS. Sem isso o app nem abre. `npx expo login` no PC e o mesmo login no app. |
| Nenhuma cor fora de `src/theme.ts` | Fonte única de cor, raio e espaçamento. Faltou token? Adicione lá. |
| Sem `any`, sem `@ts-ignore` | TypeScript estrito. |
| Emoji nunca como ícone | Depende da fonte do sistema e não aceita token de cor. Use `Ionicons` ou `MaterialCommunityIcons`. |
| Todo texto visível em **português do Brasil** | |
| Rede só em `src/services/analiseAoVivo.ts` | Nenhum outro arquivo faz chamada externa. |
| Skia **nunca** pela raiz do pacote em código que roda | Em 16/09 o app nem abriu no iPhone: a raiz `@shopify/react-native-skia` carrega também o vídeo do Skia, que chama o `react-native-reanimated` ao abrir, e ele não está instalado. A API do Skia vem só de `skiaNativo()` em `procurarLousa.ts`; da raiz, só `import type`. O build web e o teste da lousa não pegam isso: confira o bundle do iPhone (`npx expo export -p ios --no-bytecode --no-minify`) e procure `createWorkletRuntime`, que não pode aparecer. |
| Chave da API só no cofre do aparelho | Nunca em `.env` nem no Git: variável `EXPO_PUBLIC_*` entra no pacote que o PC serve pela rede, e qualquer um no mesmo Wi-Fi lê a chave. |
| Nenhuma barra de abas de aplicativo | O Flow mora na câmera, na galeria (Fotos e Aulas) e nos ajustes da câmera. Tela inicial ou aba Perfil dizem "app para baixar", o contrário da tese. |
| O acervo só muda pelas ações do `AcervoContext` | Nenhuma tela guarda cópia própria de pasta ou aula. |
| A foto é do estudante: o app **não altera** | Aparece, vai para a aula e é lida pela IA como a câmera tirou. Em 16/09 o tratamento que endireitava e limpava a lousa saiu depois do teste no iPhone: numa foto de tela de computador ele deu zoom e inventou brilho. Ver `DESIGN.md` → "Honestidade da interface". |
| A tela nunca afirma o que o app não sabe | Ver `DESIGN.md` → "Honestidade da interface". |
| Campo de texto nunca fica atrás do teclado | Folha com campo usa `KeyboardAvoidingView`; tela com rolagem usa `automaticallyAdjustKeyboardInsets`. Em 16/09 o teclado cobria o campo de "Nova pasta" e o estudante digitava sem ver. |
| Controle que não muda nada não existe | Ou o controle age, ou sai da tela. |

## Mapa do código

```
App.tsx                        providers e navegação raiz
src/theme.ts                   cor, raio, espaçamento, tipografia
src/data/mock.ts               grade horária, sub-modos, etapas, conteúdo de
                               exemplo, modos reais do JOVI V50, plataformas
src/data/acervo.ts             tipos do acervo, funções puras, sessão pela
                               grade, as 5 aulas de exemplo
src/store/AcervoContext.tsx    pastas e aulas, gravadas no aparelho
src/store/FlowContext.tsx      a captura em andamento
src/services/analiseAoVivo.ts  as 3 chamadas à IA (único ponto de rede)
src/services/quadro.ts         acha a lousa escrita numa foto pequena;
                               matemática pura, testável no computador
src/services/procurarLousa.ts  a procura da lousa no aparelho, com Skia; a
                               versão .web.ts não procura
scripts/testar-lousa.js        cenas 3D sintéticas contra o mesmo código do app
src/hooks/                     captura contínua, procura da lousa, leitura em
                               voz alta, reduzir movimento
src/navigation/                RootStack e GaleriaTabs (Fotos e Aulas)
src/components/                13 componentes
src/screens/                   14 telas
```

A tela mais sensível é `src/screens/CameraScreen.tsx`: é ela que sustenta a tese
de que o Flow mora dentro da câmera da JOVI.

## Estado atual

Tudo abaixo está implementado e verificado rodando o build web e dirigindo por
Playwright (a câmera cai no `WhiteboardFallback` sem permissão, o resto se
comporta igual ao aparelho).

- **Câmera no layout da JOVI, medida em capturas reais do V50.** Preto de ponta
  a ponta, visor 4:3 sem borda, barra de cima só com atalho que age, zoom 1x/2
  em texto, modos com capitalização normal e o selecionado em amarelo,
  obturador vazado de 68 pt com anel amarelo. `Aula` é um modo do carrossel;
  `Mais` abre a folha com os modos reais do V50.
- **A câmera acha a lousa sozinha.** Em Foto, ela tira uma foto pequena em
  silêncio a cada segundo e procura um quadro inteiro com escrita dentro. Duas
  procuras seguidas achando, o carrossel desliza para Aula com o aviso "Lousa
  reconhecida". Lousa vazia, porta, parede e tela apagada não trocam o modo.
  Para durante a captura, com flash, na lente frontal, na captura contínua e
  com outra tela por cima.
- **A câmera avisa se a foto vai servir.** Em Aula, a procura continua rodando:
  com a lousa inteira no enquadramento, os cantos da moldura ficam amarelos e
  mais grossos, o celular vibra e o VoiceOver fala "Lousa inteira enquadrada"
  (e "A lousa saiu do enquadramento" quando sai). Só confirmação positiva: o
  visor nunca diz "lousa cortada", porque nas cenas de teste uma parede com
  porta pareceria. Depois da foto, a leitura da IA (uns 2 s) diz se pegou tudo;
  se não, "Conteúdo identificado" abre com "A foto não pegou tudo", o que faltou
  e "Tirar outra", com vibração e aviso falado.
- **A câmera lembra.** A mesma chamada de classificação recebe as 30 aulas mais
  recentes e aponta qual esta foto continua, com o motivo numa frase. Só aula
  que existe: o id devolvido é conferido contra a lista, e o que não bate some.
  "Conteúdo identificado" mostra "Continua uma aula sua", que abre a aula. A
  aula salva guarda a ligação, e a tela da aula mostra "Continua" e "Continuada
  em". Só com a análise por IA ligada.
- **Busca no texto da lousa.** A busca da galeria entra no texto lido de cada
  página e no resumo, e não só no título.
- **A foto fica como a câmera tirou.** Ela aparece inteira em "Conteúdo
  identificado", sem corte e sem zoom, vai assim para a aula e para a galeria, e
  é a que a IA lê. Validado no iPhone em 16/09: a procura da lousa roda em uns
  200 a 340 ms por foto pequena, e reconheceu uma tela com texto.
- **Galeria em vez de app com abas.** A miniatura abre a galeria: em Aula, na
  aba Aulas (pastas, recentes e o cartão da próxima aula pela grade); nos outros
  modos, na aba Fotos, com tudo o que a câmera tirou. A engrenagem abre Ajustes.
  A tela Início e as abas Revisão e Perfil saíram; a revisão abre pela aula.
- **Análise por IA sempre pronta.** Chave colada uma vez em Ajustes, guardada no
  cofre do aparelho (`expo-secure-store`) e conferida com a Anthropic na hora. A
  análise liga sozinha ao abrir o app, a menos que o usuário tenha desligado.
- **Acervo real.** Pastas e aulas gravadas com AsyncStorage; a foto é copiada
  para o diretório de documentos. Criar, renomear, mover e excluir funcionam.
- **Tela Aula.** Páginas, resumo, texto, flashcards, questões, ouvir, menu.
- **Leitura da foto.** Três chamadas paralelas: classificação, transcrição e
  material de estudo (flashcards e questões).
- **Sessão de aula pela grade.** Fotos da mesma aula do horário viram páginas da
  mesma aula. Fora do horário vale a sessão livre: mesma pasta, meia hora.
- **Ouvir a aula.** `expo-speech`, offline, com a sessão de áudio de reprodução
  (`expo-audio`) para funcionar com o iPhone no silencioso. Usa a voz pt-BR
  mais natural instalada e nunca as vozes de novidade do iOS (Eddy, Flo,
  Grandma…), que imitam robô. O texto é limpo antes (seta e barra viram pausa).
  Ajustes → Voz do Ouvir mostra a voz em uso, testa, e ensina a baixar a
  Aprimorada ou a Premium quando só há a básica. A aula tem também "Ouvir o
  texto", que lê a lousa inteira.
- **Acessibilidade no fluxo, e não num modo à parte.** Todos os 47 controles
  tocáveis têm rótulo falado (conferido por script), o Controle por Voz do iOS
  funciona com eles, e os avisos que importam são falados pelo VoiceOver:
  lousa reconhecida, lousa enquadrada e foto que não pegou tudo.
- **Viabilidade técnica.** Inclui o achado de que o JOVI V50 já tem
  "Documento em Ultra HD".

## Para fazer agora, nesta ordem

1. [x] **Destaque do pitch, decidido em 17/09.** A câmera avisa se a foto serve e
       a câmera lembra (ver "Estado atual" e "Destaque do pitch"). Falta testar
       com a chave e ensaiar. O Vitor quer ajuda para montar como mostrar tudo
       isso: é o próximo passo depois do teste.
2. [ ] **Chave nova da API.** Revogar a antiga no console da Anthropic, criar
       outra com limite de gasto baixo, colar em Ajustes → Análise por IA →
       Guardar a chave, e conferir a mensagem "A Anthropic aceitou a chave".
       Apagar o `.env` do PC: o código não lê mais esse arquivo.
3. [ ] **Vincular o projeto à conta Expo**: `npx expo login` e depois
       `npx eas-cli@latest init`, e commitar o `app.json` com o `projectId`.
       Até lá, aulas e chave guardadas pelo iPhone ficam presas ao PC que rodou
       o servidor.
4. [ ] **Testar no iPhone 17** a lista "No celular" abaixo. O que mudou desde o
       teste de 16/09 às 22h: a foto sem tratamento, "Nova pasta" e renomear
       com o teclado aberto, a voz do Ouvir, o cartão da grade, a moldura que
       acende, "A foto não pegou tudo", "Continua uma aula sua" e a busca no
       texto.
5. [x] **Resolver o que é encenado.** O "Lousa reconhecida" virou verdade e o
       antes e depois saiu. Sobrou um ponto menor, na seção "Encenado" abaixo.
6. [x] **Roteiro da apresentação**, montado em 17/09: página do pitch (ver
       "Onde está o resto") e resumo no README. São quatro avaliadores da JOVI
       e um celular só: o iPhone vai no projetor por um adaptador USB-C para
       HDMI (a sala liga o projetor por HDMI no notebook). Falta comprar e
       testar o adaptador, inclusive o som do Ouvir com ele ligado, levar a
       lousa de Flexbox sobre fundo escuro e ensaiar três vezes com o
       cronômetro da página.

## O que falta

Nada disso dá para fechar sem um aparelho ou sem um navegador com sessão real.

### No celular

- [ ] Câmera real em Aula: foto → processamento → a sua foto, inteira e sem
      zoom, no topo de "Conteúdo identificado". Salvar e abrir a aula: a mesma
      foto. Aulas salvas na tarde de 16/09 com a lousa tratada voltam a mostrar
      a foto original sozinhas.
- [ ] "Nova pasta" (Organizar → Alterar pasta de destino), renomear pasta e aula,
      e a chave em Ajustes: o campo sobe junto com o teclado.
- [ ] Ajustes → Voz do Ouvir → Testar. Se aparecer "Básica", baixar a Luciana
      Aprimorada ou Premium no iPhone e voltar: a tela troca sozinha. No terminal
      aparece `[JOVI Flow] voz da leitura: ...` com a voz usada.
- [ ] **Moldura que acende.** Em Aula, apontar para uma lousa escrita inteira:
      em uns 2 s os cantos ficam amarelos e grossos e o celular vibra; tirar a
      lousa do enquadramento: os cantos voltam brancos. Com o VoiceOver ligado
      (três cliques no botão lateral), ouvir "Lousa inteira enquadrada".
- [ ] **A foto não pegou tudo.** Com a chave, fotografar a lousa cortada de
      propósito: "Conteúdo identificado" abre com o aviso e o que faltou, e
      "Tirar outra" volta para a câmera. No terminal:
      `[JOVI Flow] classificacao ... · leitura parcial: ...`. Fotografar a lousa
      inteira: nenhum aviso.
- [ ] **A câmera lembra.** Com a chave, fotografar algo parecido com uma aula
      de exemplo (Flexbox e a aula de Grid; um laço `for` e a de Listas): aparece
      "Continua uma aula sua", que abre a aula. Salvar e abrir a aula nova:
      "Continua · Grid..."; na de Grid, "Continuada em". Fotografar um assunto
      sem relação: nada aparece. No terminal: `· continua ex-grid`.
- [ ] Galeria → Aulas → buscar uma palavra que só está no texto da lousa.
- [ ] Percorrer o fluxo com o VoiceOver: câmera, processamento, conteúdo
      identificado, organizar, ações e aula. Antes disso, não afirmar no pitch
      que o app é acessível para quem não enxerga.
- [ ] **Lousa reconhecida.** Abrir a câmera em Foto apontando para uma lousa
      escrita, inteira no enquadramento: em 2 ou 3 s o carrossel vai para Aula
      com o aviso. Apontar para parede, porta ou lousa vazia: fica em Foto. Cada
      procura aparece no terminal como
      `[JOVI Flow] procura: quadro com X% da foto, traco Y% -> LOUSA`. Se lousa
      escrita de verdade der traço abaixo de 1,5%, baixar `DETALHE_MINIMO` em
      `quadro.ts`.
- [ ] Em Foto, com a procura rodando: o obturador continua tirando foto (espera
      a procura soltar a câmera, menos de 1 s) e o visor não engasga.
- [ ] Modo ao vivo com chave: matéria, tema, tópico, transcrição, resumo,
      flashcards e questões vindos da foto.
- [ ] Ouvir **com o iPhone no silencioso**: a sessão de áudio é de reprodução.
- [ ] Fechar e reabrir o app: as aulas capturadas continuam lá, com foto, e a
      Análise por IA abre ligada, sem colar a chave de novo.
- [ ] Galeria: foto em Aula aparece em Fotos (com o selo de aula) e em Aulas;
      foto em Foto aparece só em Fotos.
- [ ] Captura contínua (ícone na barra de cima, só em Aula).
- [ ] Háptico e a rolagem do carrossel de modos.

### Fidelidade visual à câmera da JOVI

Fechada na Sprint 4, com capturas reais do V50 no lugar de estimativa. O que
mudou e as medidas estão em `DESIGN.md` → "O visor é a câmera da JOVI", e as
fontes em `docs/CONTINUAR-LOCAL.md`.

Ficou de fora, por decisão e não por esquecimento:

- [ ] Círculo escuro atrás dos ícones da barra de cima. É o único ponto em que o
      OriginOS 6 desenha diferente do Funtouch OS 15, e as medidas vieram do
      V50 com Funtouch. Se for copiar, copie do OriginOS inteiro.
- [ ] Conferir no aparelho, se alguém tiver um V50 à mão, se a régua de modos e
      o obturador continuam com as mesmas medidas depois do OriginOS 6.

### Destaque do pitch

Decidido em 17/09, depois de debater as ideias da Nicole (funções de estudo) e
do Ryan (acessibilidade). O brief da JOVI pede "a próxima geração da experiência
de câmera", e não um app de estudo.

- [x] **A câmera avisa se a foto serve** (Nicole: "identificar partes
      incompletas"; Ryan: guia de enquadramento com vibração). Antes de o
      professor apagar a lousa, que é a primeira frase do pitch.
- [x] **A câmera lembra o que já viu** (Nicole: "Flow lembra", "conectar
      conteúdos", "prever o que você precisa"). Memória é traço de câmera, e
      nenhuma câmera tem.
- [x] Nos bastidores: busca no texto, "Ouvir o texto", rótulos e avisos falados.
- Ficou de fora, com o motivo: chat sobre a aula, "não entendi", correção e
  geração de exercício além do que já existe, tradução (todo grupo tem, e
  ChatGPT e NotebookLM já fazem); mapa mental, modo prova, progresso e "o que
  falta estudar" (app de estudo genérico); exportar PDF (utilidade, não
  destaque); fonte para dislexia (sem ganho comprovado, e o projeto não usa
  fonte própria: vale respeitar Texto Maior, Negrito e Aumentar Contraste do
  iOS); comandos de voz próprios (não dá no Expo Go, e o Controle por Voz do
  iOS já funciona com os rótulos); modo de acessibilidade separado e virar
  "ferramenta de inclusão" (dilui a tese, e ninguém testou com pessoas com
  deficiência).
- [x] ~~O antes e depois da lousa tratada.~~ Funcionou nas cenas de teste, mas
      saiu em 16/09: numa foto de tela de computador deu zoom e inventou brilho,
      e o Vitor decidiu que a foto do estudante não se altera. O código está no
      commit 6460146, se um dia voltar como cópia opcional, nunca no lugar da
      foto.

### Encenado, e a banca pode perceber

Resolvidos em 16/09:

- [x] ~~Antes e depois da tela de processamento com a foto entortada de
      propósito.~~ A cena saiu: a foto não é alterada.
- [x] ~~"Lousa reconhecida" depois de 2,5 s com qualquer coisa na frente da
      câmera.~~ Ver "A câmera acha a lousa sozinha". Limite conhecido: janela
      com árvore ou prédio ocupando o vidro tem traço e pode passar por lousa.
- [x] ~~"Confirmado pela sua grade" com qualquer matéria, só por haver aula no
      horário.~~ Agora só confirma quando a matéria da foto é a da aula.
- [x] ~~"38 KB de texto no lugar de 4,2 MB de foto" na tela de ações.~~ O app
      guarda a foto inteira; a linha saiu.

Sobrou um ponto menor:

- [ ] **Etapas de "Analisando conteúdo".** Seguem o relógio, e não as respostas
      da IA. Com a análise ligada as três chamadas rodam de verdade em paralelo,
      mas a transcrição leva uns 8 s e a tela não espera por ela. Sem chave, as
      etapas animam sobre o conteúdo de exemplo.

### Antes de apresentar

- [ ] **Vincular o projeto à conta Expo**, uma vez e já logado:
      `npx eas-cli@latest init`. Sem isso o Expo Go separa os dados do iPhone
      pelo computador que roda o servidor: aulas e chave guardadas usando um PC
      não aparecem usando outro.
- [ ] **Revogar a chave da API** que foi exposta numa conversa, e guardar uma
      nova, com limite de gasto baixo, em Ajustes → Análise por IA. Apagar o
      `.env` antigo do computador: o código não lê mais esse arquivo.
- [ ] Desligar a atualização automática de apps no aparelho, senão o Expo Go
      atualiza e o app não abre.
- [ ] Decidir se as capturas de teste ficam ou se usa Ajustes → "Apagar capturas
      e voltar aos exemplos".

## Fora do escopo

Login, cadastro, onboarding, backend, envio real para Classroom e Drive, chat
sobre a aula.

## Onde está o resto

| Arquivo | O que tem |
|---|---|
| `README.md` | O produto: o que é, como roda, os diferenciais, o roteiro dos 4 minutos. |
| `DESIGN.md` | Regras visuais. Manda na aparência; onde conflitar, vale ele. |
| `docs/CONTINUAR-LOCAL.md` | A pesquisa sobre a câmera da JOVI e o passo a passo para continuar. |
| `docs/superpowers/specs/` | As decisões de cada sprint, com o porquê. |
| [Pitch do JOVI Flow](https://claude.ai/artifact/3ZubmN43rEcvhsdnGRQ8Y7) | O roteiro dos 5 minutos: falas, toques, plano B, a lousa, o checklist e as perguntas da banca. Página privada do Vitor; ele compartilha com o grupo. Se uma tela do app mudar, o roteiro muda junto. |
