# Continuar o JOVI Flow na máquina local

Este arquivo tem duas coisas: o passo a passo para retomar o trabalho localmente
e o dossiê da pesquisa sobre a câmera da JOVI, para nada se perder na troca.

Para as regras do projeto e a lista do que falta, o arquivo é o
[`CLAUDE.md`](../CLAUDE.md) na raiz.

## Primeiros passos

```bash
git clone https://github.com/Vitor-Borin/jovi-flow.git
cd jovi-flow
npm install
npx expo start
```

O trabalho vai direto na `main`, que é a branch padrão. Ler o QR com a câmera
do iPhone ou pelo Expo Go no Android. Celular e computador na mesma rede.

Para a análise por IA: na câmera, engrenagem → Análise por IA → colar a chave e
Guardar. Fica no cofre do aparelho; nada de `.env`.

> **Antes de qualquer coisa:** a chave usada no desenvolvimento foi exposta numa
> conversa. Revogue no console da Anthropic e gere outra, com limite de gasto
> baixo.

## Trabalhar pelo celular

Duas formas. Use uma de cada vez, porque as duas mexem na mesma pasta.

- **Remote Control da própria conversa** (a melhor): no app do Claude no PC,
  ligue o Remote Control da conversa. O celular continua a mesma conversa, e o
  que for feito lá aparece no PC.
- **Cópia da conversa pelo terminal**: dentro da pasta do projeto, rode
  `claude --resume <id> --fork-session --remote-control jovi`. É outra
  conversa: o que for feito nela não aparece na original. O id aparece na lista
  que `claude --resume` abre.

Nos dois casos o Claude roda no PC. PC em suspensão ou app fechado derruba o
acesso: deixe o PC na tomada, com a suspensão desligada.

## A pesquisa sobre a câmera da JOVI

A JOVI é a marca da vivo no Brasil. O V50 saiu de fábrica com Funtouch OS 15,
sobre Android 15, mas **recebe o OriginOS 6, sobre Android 16, desde meados de
dezembro de 2025** ([Canaltech](https://canaltech.com.br/apps/originos-6-leva-o-android-16-aos-celulares-da-jovi-confira-novidades/),
[Mundo Conectado](https://www.mundoconectado.com.br/smartphones/jovi-originos-6-atualizacao/),
ambos de 19/01/2026). A vivo aposentou o Funtouch no mundo todo a partir da
linha X300. Quem abrir a câmera de um V50 atualizado hoje vê o OriginOS, e o
site da JOVI Brasil já tem "OriginOS" no menu.

Isso importa para a fidelidade: o artigo do Android Authority mostra o
**OriginOS 6** num X300 Ultra, que é topo de linha com outro conjunto de lentes.
Nos pontos que o visor do Flow copia, os dois sistemas desenham igual. A
diferença é que o OriginOS põe um círculo escuro atrás dos ícones da barra de
cima e do inverter câmera; o Funtouch deixa os ícones soltos.

### Os modos que a câmera tem de verdade

Da ficha técnica oficial da JOVI Brasil, câmera principal traseira:

Foto, Retrato, Noite, Vídeo, Microfilme, Alta Resolução, Panorâmica,
**Documento em Ultra HD**, Câmera Lenta, Intervalo, Superlua, Astro,
Profissional, Instantâneo, Comida, Visualização Dupla, Foto em Movimento.

Esta lista está em `src/data/mock.ts`, em `modosJovi`, e alimenta a folha que o
`Mais` abre no visor.

### Por que o "Documento em Ultra HD" importa

É o achado que mais serve ao pitch. A câmera da JOVI **já tem** um modo
Documento. O Modo Aula não inventa capacidade nova: ele especializa uma que a
JOVI já vende, separando lousa, slide e caderno (que têm problemas ópticos
opostos) e ligando a captura ao horário do estudante.

A objeção natural — "então por que não usar o modo documento?" — já tinha
resposta no `DESIGN.md`: um modo documento genérico trata os três do mesmo jeito
e erra nos três.

Isso entrou em dois lugares do app: na tela Ajustes → Viabilidade técnica, como
item e nota de fecho, e na folha do `Mais`, onde "Documento em Ultra HD" aparece
ao lado do "Aula".

### O que se sabe da interface

- O carrossel de modos fica embaixo e pode ser simplificado para Foto, Vídeo,
  Retrato e Mais.
- A barra de cima é personalizável. No OriginOS 6 cabem **até quatro** atalhos
  mais os ajustes; no V50 com Funtouch, o modo Foto mostra seis ícones: Google
  Lens, flash, foto ao vivo, estilos, supermacro e ajustes. **HDR não fica
  nessa barra**, e sim no painel de ajustes.
- Fora do modo Foto, o próprio V50 reduz a barra a flash e ajustes. É esse
  layout reduzido que o protótipo usa, porque só flash, captura contínua e
  ajustes agem de verdade aqui.
- Existe um botão de 2× no visor, sem teleobjetiva dedicada.
- Existem cinco predefinições de interface de câmera, que reorganizam o
  carrossel e a barra de ferramentas.

### As medidas do visor, tiradas de capturas reais do V50

Das capturas da review da FoneArena (1080 × 2392; com densidade 2,75× dá ≈ 393
dp, quase a mesma escala de pontos de um iPhone) e da foto da barra de cima na
review da Digital Camera World:

| Elemento | Medida |
|---|---|
| Amarelo da seleção | `#F6CE3A`, medido nas áreas sólidas. No anel fino do obturador o JPEG desbota a cor, então a área sólida é a medida boa. |
| Obturador | 187 px, ou 68 pt: anel branco de 4, vão de 3, anel amarelo de 1,5, centro vazio. |
| Modos | Maiúscula de 29 px, o que dá fonte de ~15 pt. Traço de 6 px no ativo e nos outros: **todos negrito**, só a cor muda. 26 pt entre rótulos. |
| Zoom | Algarismos de 21 px, fonte de ~11 pt, negrito. Texto solto, separado por `···`, com o ativo em amarelo. |
| Barra de cima | Ícones de ~19 pt, soltos. Flash a 32 pt da borda esquerda, ajustes a 32 pt da direita. |
| Miniatura e inverter | 40 pt e ~26 pt, com o centro a 41 pt da borda. |
| Distâncias | O visor 4:3 começa a 119 pt do topo; o carrossel fica 25 pt abaixo dele e o centro do obturador, 94 pt. |

Fontes das capturas: [review do V50 na
FoneArena](https://www.fonearena.com/blog/446971/vivo-v50-review.html) (série
`vivo-V50-screenshots_fonearena-*.jpg`, com a 11 e a 13 mostrando a câmera) e
[review do V50 na Digital Camera
World](https://www.digitalcameraworld.com/tech/android-phones/vivo-v50-review).

Fontes: [ficha técnica do JOVI
V50](https://www.jovimobile.com/br/products/param/v50), [review do V50 na
GSMArena](https://www.gsmarena.com/vivo_v50-review-2815p5.php), [Android
Authority sobre o app de câmera da
vivo](https://www.androidauthority.com/vivo-x300-ultra-camera-app-customization-google-samsung-3666874/),
[mudanças do Funtouch OS
15](https://www.smartprix.com/bytes/15-changes-in-funtouch-os-15-nobodys-talking-about/),
[review do V50 na PetaPixel](https://petapixel.com/2025/03/28/vivo-v50-review-marvelous-mid-range-photo-prowess/).

### Onde as capturas estavam, depois de procurar

Ficou registrado para ninguém repetir a busca:

- **GSMArena não serve.** Nem no review do V50 nem no do X200 FE: as páginas de
  câmera só têm amostras de foto, nenhuma da interface.
- **Reviews brasileiras não servem.** A da Oficina da Net tem galeria grande, mas
  só de fotos tiradas com o aparelho.
- **A página oficial da JOVI não serve.** Ela monta o conteúdo por rolagem e as
  imagens não ficam no HTML.
- **FoneArena serve**, e é a melhor fonte: série numerada de 25 capturas reais do
  V50, com a câmera na 11, na 12 e na 13.
- **Digital Camera World serve** para a barra de cima no modo Foto.
- **Android Authority** abre num navegador normal (bloqueia `curl` por
  Cloudflare) e é a referência do OriginOS 6, não do Funtouch.

Uma coisa continua faltando: captura do visor de um V50 **já com OriginOS 6**.
Só existe de X300 Ultra.

## Como conferir tela sem celular

Foi assim que as telas desta sprint foram validadas:

```bash
npx expo export --platform web --output-dir /tmp/jovi-web
python3 -m http.server 8765 --directory /tmp/jovi-web
```

Abrir `http://localhost:8765`. Sem permissão de câmera o visor cai no
`WhiteboardFallback`, que é a lousa de exemplo; o resto das telas se comporta
igual ao aparelho. Dá para dirigir por Playwright e tirar capturas de cada passo.

## Roteiro dos 4 minutos

Mora no `README.md`, em "Roteiro dos 4 minutos", para não haver duas versões. O
trecho do destaque do pitch ainda está em aberto; ver `CLAUDE.md`.
