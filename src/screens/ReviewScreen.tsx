import { Rascunho } from './_Rascunho';

export function ReviewScreen() {
  return (
    <Rascunho
      titulo="Revisão"
      fase="FASE 7"
      descricao={
        'Flashcard com virada 3D, contador de progresso, botões Não lembrei, Difícil e Fácil, ' +
        'barra de progresso na base e tela de conclusão ao fim dos 10 cards.'
      }
    />
  );
}
