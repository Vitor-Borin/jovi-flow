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

- **Câmera no layout da JOVI.** Preto de ponta a ponta, visor 4:3 sem borda,
  barra de cima com 4 controles, zoom 1×/2 funcional, modos em caixa alta.
  `AULA` é um modo do carrossel; `MAIS` abre a folha com os modos reais do V50.
  A detecção da lousa desliza o carrossel sozinho depois de 2 s.
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

- [ ] Câmera real em AULA: foto → processamento → a sua foto no topo de
      "Conteúdo identificado".
- [ ] Modo ao vivo com chave: matéria, tema, tópico, transcrição, resumo,
      flashcards e questões vindos da foto.
- [ ] Ouvir: a voz em pt-BR depende do que está instalado no aparelho.
- [ ] Fechar e reabrir o app: as aulas capturadas continuam lá, com foto.
- [ ] Captura contínua (ícone na barra de cima, só em AULA).
- [ ] Háptico e a rolagem do carrossel de modos.

### Fidelidade visual à câmera da JOVI

- [ ] Abrir [este artigo do Android
      Authority](https://www.androidauthority.com/vivo-x300-ultra-camera-app-customization-google-samsung-3666874/),
      que é só sobre o app de câmera da vivo e tem muitas capturas de tela.
      Ele bloqueia `curl` por Cloudflare; num navegador normal abre.
- [ ] Comparar com `src/screens/CameraScreen.tsx` nesta ordem de impacto: ordem
      dos ícones na barra de cima, peso e tamanho da fonte dos modos, cor do
      modo selecionado, formato das bolinhas de zoom, diâmetro do obturador.
- [ ] Conferir se o carrossel real usa caixa alta ou capitalização normal.

Contexto da pesquisa já feita: `docs/CONTINUAR-LOCAL.md`.

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
