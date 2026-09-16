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
| Chave da API só no cofre do aparelho | Nunca em `.env` nem no Git: variável `EXPO_PUBLIC_*` entra no pacote que o PC serve pela rede, e qualquer um no mesmo Wi-Fi lê a chave. |
| Nenhuma barra de abas de aplicativo | O Flow mora na câmera, na galeria (Fotos e Aulas) e nos ajustes da câmera. Tela inicial ou aba Perfil dizem "app para baixar", o contrário da tese. |
| O acervo só muda pelas ações do `AcervoContext` | Nenhuma tela guarda cópia própria de pasta ou aula. |
| A tela nunca afirma o que o app não sabe | Ver `DESIGN.md` → "Honestidade da interface". |
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
src/services/quadro.ts         cantos da lousa, homografia e proporção real;
                               matemática pura, testável no computador
src/services/tratamentoLousa.ts
                               shaders do Skia: endireitar, luz por igual, traço
src/services/tratarLousa.ts    lê, trata e grava a foto no aparelho [D1]; a
                               versão .web.ts não trata nada
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
  Para durante a captura, com flash, na lente frontal e com outra tela por cima.
- **Lousa tratada no aparelho [D1].** Em Aula, a foto passa pelo Skia antes da
  IA: acha os quatro cantos, endireita a perspectiva com a proporção real do
  quadro, deixa a luz por igual e realça o traço (caneta escura em quadro claro,
  giz em quadro escuro). A tela de processamento mostra o antes e o depois de
  verdade, com o contorno de onde a lousa foi achada e o tempo medido no
  aparelho. A transcrição e o estudo leem a lousa tratada; a aula guarda a
  tratada e a aba Fotos, a original. Sem lousa na foto, a tela diz isso e segue
  com a original. Validado com cenas 3D sintéticas no computador (cantos com
  erro abaixo de 0,3%, proporção dentro de 1%, nenhum falso positivo) e a cena
  conferida no build web com esses resultados. Falta a câmera real.
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
  (`expo-audio`) para funcionar com o iPhone no silencioso.
- **Viabilidade técnica.** Inclui o achado de que o JOVI V50 já tem
  "Documento em Ultra HD".

## Para fazer hoje, 16/09, nesta ordem

1. [x] **Destaque do pitch: o [D1] de verdade.** Feito (ver "Estado atual"). A
       foto torta e com sombra vira lousa reta e limpa na frente da banca, e é
       essa versão que a IA lê. Falta testar com a câmera real (item 4).
2. [ ] **Chave nova da API.** Revogar a antiga no console da Anthropic, criar
       outra com limite de gasto baixo, colar em Ajustes → Análise por IA →
       Guardar a chave, e conferir a mensagem "A Anthropic aceitou a chave".
       Apagar o `.env` do PC: o código não lê mais esse arquivo.
3. [ ] **Vincular o projeto à conta Expo**: `npx expo login` e depois
       `npx eas-cli@latest init`, e commitar o `app.json` com o `projectId`.
       Até lá, aulas e chave guardadas pelo iPhone ficam presas ao PC que rodou
       o servidor.
4. [ ] **Testar no iPhone 17** a lista "No celular" abaixo. O que mudou desde o
       último teste: a lousa tratada e o antes e depois, Ouvir com o silencioso
       ligado, a galeria (Fotos e Aulas), os Ajustes pela engrenagem e a
       análise ligando sozinha ao reabrir.
5. [x] **Resolver o que é encenado.** O antes e depois e o "Lousa reconhecida"
       viraram verdade. Sobrou um ponto menor, na seção "Encenado" abaixo.
6. [ ] **Fechar o roteiro**: o trecho de 0:50 a 2:05 do README agora é o antes e
       depois. Ensaiar com uma lousa de verdade.

## O que falta

Nada disso dá para fechar sem um aparelho ou sem um navegador com sessão real.

### No celular

- [ ] Câmera real em Aula: foto → processamento → a sua lousa, tratada, no
      topo de "Conteúdo identificado".
- [ ] **Lousa tratada.** Fotografar uma lousa de lado e com sombra. Em "Tratando
      a foto", as etapas; no antes e depois, o contorno azul em cima da lousa e
      ela saindo reta e limpa. No terminal do Expo aparece
      `[JOVI Flow] lousa tratada em ...ms` com o tamanho e o tipo de quadro.
      Repetir com lousa verde, caderno, slide projetado e uma foto sem lousa (a
      tela diz "Lousa não encontrada" e segue com a original).
- [ ] O tempo do antes e depois ("NO APARELHO"). Passando de uns 2 s, baixar
      `LADO_ENTRADA` em `tratarLousa.ts` ou `LADO_SAIDA` em
      `tratamentoLousa.ts`.
- [ ] Salvar e abrir a aula: a página é a lousa tratada; em Galeria → Fotos
      aparece a foto original.
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
- [ ] Ouvir **com o iPhone no silencioso**: a sessão de áudio agora é de
      reprodução. A voz escolhida é a melhor pt-BR instalada (premium >
      aprimorada > compacta); a compacta soa robótica, e dá para baixar a
      aprimorada em Ajustes → Acessibilidade → Conteúdo Falado → Vozes.
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

- [x] O [D1] de verdade. O brief da JOVI pede "a próxima geração da experiência
      de câmera", e não um app de estudo: ideia de resumo, flashcard, chat, "não
      entendi" ou correção de exercício não diferencia, porque todo grupo tem. A
      tela promete "luz por igual e traço forte", e não "remove reflexo":
      reflexo estourado não se recupera com uma foto só.
- [ ] Possível próximo passo: ajustar os cantos arrastando, para quando a
      detecção errar ou a lousa não couber inteira na foto.

### Encenado, e a banca pode perceber

Os dois pontos que sustentavam o [D1] viraram verdade em 16/09:

- [x] ~~Antes e depois da tela de processamento.~~ Ver "Lousa tratada no
      aparelho" em "Estado atual".
- [x] ~~"Lousa reconhecida" depois de 2,5 s com qualquer coisa na frente da
      câmera.~~ Ver "A câmera acha a lousa sozinha". Limite conhecido: janela
      com árvore ou prédio ocupando o vidro tem traço e pode passar por lousa.

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
