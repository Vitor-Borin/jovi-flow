import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { Rascunho } from './_Rascunho';

type Props = NativeStackScreenProps<RootStackParamList, 'Questions'>;

export function QuestionsScreen({ navigation }: Props) {
  return (
    <Rascunho
      titulo="Questões"
      fase="FASE 7"
      descricao={
        'Quiz com as três questões: a alternativa certa fica verde, a errada fica ' +
        'vermelha e revela a correta. No fim, o placar de acertos.'
      }
      onVoltar={() => navigation.goBack()}
      acoes={[{ label: 'Voltar às ações', onPress: () => navigation.goBack(), principal: true }]}
    />
  );
}
