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

Modo ao vivo (opcional): `cp .env.example .env`, colar uma chave da Anthropic,
ou colar direto no app em Perfil → Análise ao vivo.

Antes de commitar:

```bash
npx tsc --noEmit        # passa
npx expo-doctor         # 18/18
```

## Regras que não se quebram

Cada uma destas já custou caro para descobrir.

| Regra | Motivo |
|---|---|
| Expo SDK fica no **54** | É a versão que o Expo Go do aparelho da apresentação suporta. Atualizar quebra o app na banca. |
| Nenhuma cor fora de `src/theme.ts` | Fonte única de cor, raio e espaçamento. Faltou token? Adicione lá. |
| Sem `any`, sem `@ts-ignore` | TypeScript estrito. |
| Emoji nunca como ícone | Depende da fonte do sistema e não aceita token de cor. Use `Ionicons` ou `MaterialCommunityIcons`. |
| Todo texto visível em **português do Brasil** | |
| Rede só em `src/services/analiseAoVivo.ts` | Nenhum outro arquivo faz chamada externa. |
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
src/hooks/                     captura contínua, leitura em voz alta, reduzir
                               movimento
src/components/                11 componentes
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
  `Mais` abre a folha com os modos reais do V50. A detecção da lousa desliza o
  carrossel sozinho depois de 2 s.
- **Acervo real.** Pastas e aulas gravadas com AsyncStorage; a foto é copiada
  para o diretório de documentos. Criar, renomear, mover e excluir funcionam.
- **Tela Aula.** Páginas, resumo, texto, flashcards, questões, ouvir, menu.
- **Leitura da foto.** Três chamadas paralelas: classificação, transcrição e
  material de estudo (flashcards e questões).
- **Sessão de aula pela grade.** Fotos da mesma aula do horário viram páginas da
  mesma aula. Fora do horário vale a sessão livre: mesma pasta, meia hora.
- **Ouvir a aula.** `expo-speech`, offline.
- **Viabilidade técnica.** Inclui o achado de que o JOVI V50 já tem
  "Documento em Ultra HD".

## O que falta

Nada disso dá para fechar sem um aparelho ou sem um navegador com sessão real.

### No celular

- [ ] Câmera real em Aula: foto → processamento → a sua foto no topo de
      "Conteúdo identificado".
- [ ] Modo ao vivo com chave: matéria, tema, tópico, transcrição, resumo,
      flashcards e questões vindos da foto.
- [ ] Ouvir: a voz em pt-BR depende do que está instalado no aparelho.
- [ ] Fechar e reabrir o app: as aulas capturadas continuam lá, com foto.
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

### Antes de apresentar

- [ ] **Revogar a chave da API** que foi exposta numa conversa, e gerar outra
      com limite de gasto baixo.
- [ ] Desligar a atualização automática de apps no aparelho, senão o Expo Go
      atualiza e o app não abre.
- [ ] Decidir se as capturas de teste ficam ou se usa Perfil → "Apagar capturas
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
