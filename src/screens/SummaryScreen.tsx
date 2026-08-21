import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { Rascunho } from './_Rascunho';

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

export function SummaryScreen({ navigation }: Props) {
  return (
    <Rascunho
      titulo="Resumo gerado"
      fase="FASE 7"
      descricao={
        'Bullets do resumo revelados um a um em fade, simulando a geração sem chamar ' +
        'nenhuma API, com os botões de copiar e salvar no rodapé.'
      }
      onVoltar={() => navigation.goBack()}
      acoes={[{ label: 'Voltar às ações', onPress: () => navigation.goBack(), principal: true }]}
    />
  );
}
