import { Rascunho } from './_Rascunho';

export function StudiesScreen() {
  return (
    <Rascunho
      titulo="Meus Estudos"
      fase="FASE 7"
      descricao={
        'Abas Pastas e Recentes com indicador deslizante, árvore de pastas expansível, ' +
        'busca que filtra as aulas de verdade e menu de ações por aula.'
      }
    />
  );
}
