import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { Rascunho } from './_Rascunho';

type Props = NativeStackScreenProps<RootStackParamList, 'Organize'>;

export function OrganizeScreen({ navigation }: Props) {
  return (
    <Rascunho
      titulo="Organizar"
      fase="FASE 6"
      descricao={
        'Árvore de pastas indentada e animada mostrando onde a aula será salva, ' +
        'com o destino em destaque e a opção de trocar a pasta, que altera o ' +
        'destino de verdade no contexto.'
      }
      onVoltar={() => navigation.goBack()}
      acoes={[
        {
          label: 'Salvar aqui',
          onPress: () => navigation.navigate('Actions'),
          principal: true,
        },
      ]}
    />
  );
}
