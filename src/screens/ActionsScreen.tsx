import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { Rascunho } from './_Rascunho';

type Props = NativeStackScreenProps<RootStackParamList, 'Actions'>;

export function ActionsScreen({ navigation }: Props) {
  return (
    <Rascunho
      titulo="Ações"
      fase="FASE 6"
      descricao={
        'Confirmação de conteúdo salvo com check animado e grade de seis cards. ' +
        'Todos levam a algum lugar: resumo, questões, revisão, edição, ' +
        'compartilhamento e pasta.'
      }
      onVoltar={() => navigation.goBack()}
      acoes={[
        {
          label: 'Gerar resumo',
          onPress: () => navigation.navigate('Summary'),
          principal: true,
        },
        { label: 'Criar questões', onPress: () => navigation.navigate('Questions') },
        {
          label: 'Revisar',
          onPress: () => navigation.navigate('Tabs', { screen: 'Revisao' }),
        },
        {
          label: 'Ver pasta',
          onPress: () => navigation.navigate('Tabs', { screen: 'Estudos' }),
        },
      ]}
    />
  );
}
