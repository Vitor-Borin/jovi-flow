import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { Rascunho } from './_Rascunho';

type Props = NativeStackScreenProps<RootStackParamList, 'Identified'>;

export function IdentifiedScreen({ navigation }: Props) {
  return (
    <Rascunho
      titulo="Conteúdo identificado"
      fase="FASE 5"
      descricao={
        'Card de confirmação pela grade horária logo abaixo do título, faixa com os ' +
        'ganhos da captura, campos identificados e o texto extraído com rolagem própria.'
      }
      onVoltar={() => navigation.goBack()}
      acoes={[
        {
          label: 'Organizar e salvar',
          onPress: () => navigation.navigate('Organize'),
          principal: true,
        },
      ]}
    />
  );
}
