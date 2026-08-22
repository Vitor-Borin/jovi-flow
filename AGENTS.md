# JOVI Flow

Prototipo React Native + Expo para o Challenge FIAP x JOVI 2026.
Apresentacao ao vivo em 27/08/2026, rodando em iPhone via Expo Go.

## Leia antes de escrever codigo

1. `JOVI_FLOW_BUILD.md` — plano de execucao, fase a fase. Fonte da verdade do escopo.
2. `DESIGN.md` — regras de design. **Vence o plano de build em caso de conflito.**

## Restricoes que nao se negociam

- **SDK 54.** O Expo Go do aparelho de apresentacao e da linha 54. Nao atualizar
  o SDK: o app deixa de abrir no celular e o pitch cai.
- **Offline por padrao.** Existe exatamente UMA chamada de rede no projeto, em
  `src/services/analiseAoVivo.ts`, e ela so acontece com o modo ao vivo ligado no
  Perfil. Desligado, o app roda 100% em modo aviao. Nao introduza rede em
  nenhum outro arquivo.
- **Sem `any` e sem `@ts-ignore`.**
- **Nenhuma cor fixa fora de `src/theme.ts`.**
- **Emoji nunca como icone** — ver `DESIGN.md`.
- Todo texto visivel ao usuario em portugues do Brasil.

## Portoes de qualidade ao fim de cada fase

```bash
npx tsc --noEmit     # zero erro
npx expo-doctor      # zero problema
npx expo start       # o bundle compila e o app abre no celular
```

## Armadilha conhecida

Se o Metro reclamar de modulo que existe, quase sempre e um processo Node orfao
segurando a porta 8081 com o mapa de modulos antigo. Mate o processo e suba com
`npx expo start --clear`.
