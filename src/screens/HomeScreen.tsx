import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { Rascunho } from './_Rascunho';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Rascunho
      titulo="Início"
      fase="FASE 7"
      descricao={
        'Saudação por horário, card da próxima aula vindo da grade horária, ' +
        'botão grande de Modo Aula, carrossel de aulas recentes e faixa de estatísticas.'
      }
      acoes={[
        {
          label: 'Abrir Modo Aula',
          onPress: () => navigation.navigate('Camera'),
          principal: true,
        },
      ]}
    />
  );
}
