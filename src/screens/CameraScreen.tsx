import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { Rascunho } from './_Rascunho';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

export function CameraScreen({ navigation }: Props) {
  return (
    <Rascunho
      titulo="Câmera"
      fase="FASE 4"
      descricao={
        'Visor real da câmera, barra superior, carrossel de modos e obturador. ' +
        'O Modo Aula ativa sozinho em 2,5s, mostra os chips de otimização da captura ' +
        'e o obturador vira anel verde.'
      }
      onVoltar={() => navigation.goBack()}
      acoes={[
        {
          label: 'Capturar',
          onPress: () => navigation.navigate('Processing'),
          principal: true,
        },
      ]}
    />
  );
}
