# Continuar o JOVI Flow na máquina local

Este arquivo tem duas coisas: o passo a passo para retomar o trabalho localmente
e o dossiê da pesquisa sobre a câmera da JOVI, para nada se perder na troca.

Para as regras do projeto e a lista do que falta, o arquivo é o
[`CLAUDE.md`](../CLAUDE.md) na raiz.

## Primeiros passos

```bash
git clone https://github.com/Vitor-Borin/jovi-flow.git
cd jovi-flow
git checkout claude/significado-prototipo-nltojc
npm install
npx expo start
```

Ler o QR com a câmera do iPhone ou pelo Expo Go no Android. Celular e computador
na mesma rede.

Para o modo ao vivo: `cp .env.example .env` e colar uma chave da Anthropic, ou
colar direto no app em Perfil → Análise ao vivo.

> **Antes de qualquer coisa:** a chave usada no desenvolvimento foi exposta numa
> conversa. Revogue no console da Anthropic e gere outra, com limite de gasto
> baixo.

## A pesquisa sobre a câmera da JOVI

A JOVI é a marca da vivo no Brasil. O V50 roda Funtouch OS 15, sobre Android 15.

### Os modos que a câmera tem de verdade

Da ficha técnica oficial da JOVI Brasil, câmera principal traseira:

Foto, Retrato, Noite, Vídeo, Microfilme, Alta Resolução, Panorâmica,
**Documento em Ultra HD**, Câmera Lenta, Intervalo, Superlua, Astro,
Profissional, Instantâneo, Comida, Visualização Dupla, Foto em Movimento.

Esta lista está em `src/data/mock.ts`, em `modosJovi`, e alimenta a folha que o
`MAIS` abre no visor.

### Por que o "Documento em Ultra HD" importa

É o achado que mais serve ao pitch. A câmera da JOVI **já tem** um modo
Documento. O Modo Aula não inventa capacidade nova: ele especializa uma que a
JOVI já vende, separando lousa, slide e caderno (que têm problemas ópticos
opostos) e ligando a captura ao horário do estudante.

A objeção natural — "então por que não usar o modo documento?" — já tinha
resposta no `DESIGN.md`: um modo documento genérico trata os três do mesmo jeito
e erra nos três.

Isso entrou em dois lugares do app: na tela Perfil → Viabilidade técnica, como
item e nota de fecho, e na folha do `MAIS`, onde "Documento em Ultra HD" aparece
ao lado do "Aula".

### O que se sabe da interface

- O carrossel de modos fica embaixo e pode ser simplificado para Foto, Vídeo,
  Retrato e Mais.
- A barra de cima é uma barra de atalhos personalizável com **até quatro**
  controles. O protótipo usa quatro: flash, HDR, foto ao vivo (que em AULA vira
  captura contínua) e ajustes.
- Existe um botão de 2× no visor, sem teleobjetiva dedicada.
- O Funtouch OS 15 refez os menus de seleção, inclusive na câmera, com cantos
  mais arredondados.
- Existem cinco predefinições de interface de câmera, que reorganizam o
  carrossel e a barra de ferramentas.

Fontes: [ficha técnica do JOVI
V50](https://www.jovimobile.com/br/products/param/v50), [review do V50 na
GSMArena](https://www.gsmarena.com/vivo_v50-review-2815p5.php), [Android
Authority sobre o app de câmera da
vivo](https://www.androidauthority.com/vivo-x300-ultra-camera-app-customization-google-samsung-3666874/),
[mudanças do Funtouch OS
15](https://www.smartprix.com/bytes/15-changes-in-funtouch-os-15-nobodys-talking-about/),
[review do V50 na PetaPixel](https://petapixel.com/2025/03/28/vivo-v50-review-marvelous-mid-range-photo-prowess/).

### O que ficou faltando, e por quê

Falta uma captura do **visor comum** da câmera, para comparar pixel a pixel.

A GSMArena não publicou nenhuma no review do V50: a página de câmera só tem
amostras de foto. Os reviews brasileiros que abriram também não trazem. A
PetaPixel tem uma foto da tela, mas do modo Film, que é uma pele diferente — dela
veio a confirmação do padrão de quatro ícones na barra de cima.

O artigo do Android Authority é exatamente sobre o app de câmera da vivo e tem
muitas capturas, mas bloqueia `curl` por Cloudflare. Num navegador normal, na
sua máquina, ele abre.

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

1. Abre no visor. Em dois segundos o carrossel desliza sozinho para AULA.
2. Foto. Processamento: primeiro a câmera trabalha, depois a IA.
3. "Confirmado pela sua grade". Salvar, criando pasta na hora se precisar.
4. Resumo. Play: o celular lê.
5. Questões da própria lousa.
6. Segunda foto. "Entra na aula de hoje como página 2".
7. Estudos: abre a pasta, abre a aula, renomeia.

Se sobrar tempo, ou se a banca perguntar de viabilidade: `MAIS` no visor mostra
os modos reais da JOVI, com o "Documento em Ultra HD" ao lado do "Aula".
