import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { Rascunho } from './_Rascunho';

type Props = NativeStackScreenProps<RootStackParamList, 'Processing'>;

export function ProcessingScreen({ navigation }: Props) {
  return (
    <Rascunho
      titulo="Processando"
      fase="FASE 5"
      descricao={
        'Duas fases: otimização da câmera e análise de conteúdo, separadas pela cena ' +
        'de antes e depois usando a foto real. Ao terminar usa replace, para o botão ' +
        'voltar não retornar ao processamento.'
      }
      onVoltar={() => navigation.goBack()}
      acoes={[
        {
          label: 'Concluir análise',
          onPress: () => navigation.replace('Identified'),
          principal: true,
        },
      ]}
    />
  );
}
