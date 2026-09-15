# Continuar o JOVI Flow na máquina local

Escrito em 15/09/2026, no fim da sessão em nuvem da Sprint 4. O ambiente em
nuvem tem a saída de rede restrita a uma lista curta (GitHub, npm,
developer.android.com), então não deu para abrir review de celular nem o site da
JOVI para copiar a câmera pixel a pixel. Na máquina local isso não existe.

Este arquivo é o ponto de partida de quem abrir o projeto lá.

## Como pegar o que já está pronto

```bash
git clone https://github.com/Vitor-Borin/jovi-flow.git
cd jovi-flow
git checkout claude/significado-prototipo-nltojc
npm install
npx expo start
```

O SDK está fixado no Expo 54. Não atualize: é a versão que o Expo Go do aparelho
da apresentação suporta.

Para o modo ao vivo, `cp .env.example .env` e colar uma chave da Anthropic, ou
colar direto no app em Perfil → Análise ao vivo.

> **Chave da API:** a chave usada durante o desenvolvimento foi exposta numa
> conversa. Revogue no console da Anthropic e gere outra, com limite de gasto
> baixo, antes da apresentação.

## O que a Sprint 4 entregou

| Área | Estado |
|---|---|
| Câmera no layout da JOVI | Feito. Preto de ponta a ponta, visor 4:3 sem borda, modos em caixa alta, AULA no carrossel. |
| Acervo real, gravado no aparelho | Feito. Criar, renomear, mover e excluir pasta e aula funcionam. |
| Tela Aula | Nova. Páginas, resumo, texto, flashcards, questões, ouvir, menu. |
| Flashcards e questões lidos da foto | Feito. Terceira chamada paralela à IA. |
| Sessão de aula pela grade | Feito. Fotos da mesma aula viram páginas da mesma aula. |
| Ouvir em voz alta | Feito, com `expo-speech`. |
| Limpeza visual | Feito. Sai o badge FLOW ATIVO e os "ganhos" inventados. |

Detalhe das decisões em
[`specs/2026-09-15-sprint-4-prototipo-design.md`](superpowers/specs/2026-09-15-sprint-4-prototipo-design.md).

## O que falta testar num aparelho de verdade

A sessão em nuvem validou o app renderizando o build web e dirigindo por
Playwright: fluxo de captura, criação de pasta, sessão virando página 2,
persistência depois de recarregar. O que só um celular responde:

- [ ] Câmera real em AULA: foto → processamento → a sua foto no topo de
      "Conteúdo identificado".
- [ ] Modo ao vivo com chave: matéria, tema, tópico, transcrição, resumo,
      flashcards e questões vindos da foto.
- [ ] Ouvir: a voz em pt-BR depende do que está instalado no aparelho.
- [ ] Fechar e reabrir o app: as aulas capturadas continuam lá, com foto.
- [ ] Captura contínua (ícone na barra de cima, só em AULA).
- [ ] Háptico e a rolagem do carrossel de modos.

## A pesquisa sobre a câmera da JOVI

A JOVI é a marca da vivo no Brasil. O V50 roda Funtouch OS 15 (Android 15).
O que deu para apurar por busca, sem conseguir abrir as páginas com imagem:

**Modos da câmera principal traseira do JOVI V50, em português:**
Foto, Retrato, Noite, Vídeo, Microfilme, Alta Resolução, Panorâmica,
**Documento em Ultra HD**, Câmera Lenta, Intervalo, Superlua, Astro,
Profissional, Instantâneo, Comida, Visualização Dupla, Foto em Movimento.

**Isto é o achado que mais serve ao pitch:** a câmera da JOVI *já tem* um modo
Documento. O Modo Aula não inventa capacidade nova, ele especializa uma que a
JOVI já vende. E a resposta para "então por que não usar o modo documento?" já
estava no `DESIGN.md`: um modo documento genérico trata lousa, slide e caderno
do mesmo jeito, e erra nos três. Isso entrou na tela Perfil → Viabilidade
técnica.

**Sobre a interface:**
- O carrossel de modos fica embaixo e pode ser simplificado para Foto, Vídeo,
  Retrato e Mais.
- A barra de cima tem flash, HDR e foto ao vivo; é uma "shortcut bar"
  personalizável com até quatro controles.
- O Funtouch OS 15 refez os menus de seleção, inclusive os da câmera, com
  cantos mais arredondados.
- Existem cinco predefinições de interface de câmera, que reorganizam o
  carrossel e a barra de ferramentas.

Fontes: [Android Authority sobre o app de câmera da
vivo](https://www.androidauthority.com/vivo-x300-ultra-camera-app-customization-google-samsung-3666874/),
[especificações do JOVI V50](https://www.jovimobile.com/br/products/param/v50),
[review do JOVI V50 no
TechTudo](https://www.techtudo.com.br/review/2025/05/jovi-lanca-v50-no-brasil-com-cameras-zeiss-e-superbateria-veja-analise-edmobile.ghtml),
[mudanças do Funtouch OS
15](https://www.smartprix.com/bytes/15-changes-in-funtouch-os-15-nobodys-talking-about/).

### O que já foi aplicado

Depois que a rede do ambiente foi liberada, deu para confirmar e aplicar:

- **MAIS entrou no carrossel** e abre a folha com os modos reais do JOVI V50
  (`src/components/FolhaModos.tsx`). Os cinco que o protótipo implementa são
  tocáveis; os outros aparecem apagados, com o aviso de que existem no aparelho
  e ficaram fora do protótipo. É onde "Documento em Ultra HD" aparece ao lado do
  "Aula", que é a deixa do apresentador.
- **A barra de cima caiu para quatro controles** (flash, HDR, foto ao vivo ou
  captura contínua, ajustes). Quatro é o teto da barra de atalhos da câmera da
  vivo, e era o que se via numa foto da tela do V50.

### O que ainda vale conferir local

1. Abrir um review do JOVI V50 com fotos da interface principal e comparar com
   `src/screens/CameraScreen.tsx`. Nem a GSMArena nem os reviews brasileiros que
   consegui abrir traziam captura do visor comum: os que têm estão em artigos
   bloqueados por Cloudflare, e um navegador com sessão real resolve.
2. Conferir, nesta ordem de impacto: ordem dos ícones na barra de cima, tamanho
   e peso da fonte dos modos, cor do modo selecionado, formato das bolinhas de
   zoom, diâmetro do obturador.
3. Ver se o carrossel real da JOVI usa caixa alta ou capitalização normal.

## Onde mexer

```
src/screens/CameraScreen.tsx     o visor. É aqui que mora a fidelidade à JOVI.
src/theme.ts                     toda cor e espaçamento. Nada de cor solta na tela.
src/data/acervo.ts               tipos do acervo, sessão pela grade, aulas de exemplo.
src/store/AcervoContext.tsx      as ações que mudam o acervo.
src/data/mock.ts                 grade horária, sub-modos, etapas, exemplo, plataformas.
src/services/analiseAoVivo.ts    as três chamadas à IA. Único ponto que toca a rede.
```

Regras que já custaram caro: sem `any`, sem `@ts-ignore`, nenhuma cor fora de
`theme.ts`, emoji nunca como ícone, todo texto visível em português do Brasil.

Antes de commitar:

```bash
npx tsc --noEmit
npx expo-doctor
```

## Como conferir mudança de tela sem celular

Dá para renderizar o app no navegador e dirigir por Playwright, que foi como as
telas desta sprint foram validadas:

```bash
npx expo export --platform web --output-dir /tmp/jovi-web
npx serve /tmp/jovi-web      # ou: python3 -m http.server 8765 --directory /tmp/jovi-web
```

Sem permissão de câmera o visor cai no `WhiteboardFallback`, que é a lousa de
exemplo. O resto das telas se comporta igual ao aparelho.
