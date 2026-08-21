import { Rascunho } from './_Rascunho';

export function ProfileScreen() {
  return (
    <Rascunho
      titulo="Perfil"
      fase="FASE 7"
      descricao={
        'Avatar com iniciais, nome, curso e lista estática: Grade horária, ' +
        'Plataformas conectadas, Preferências do Modo Aula e Sobre.'
      }
    />
  );
}
