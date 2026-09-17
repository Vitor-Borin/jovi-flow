import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GhostButton } from '../components/GhostButton';
import { ProgressRing } from '../components/ProgressRing';
import { StepList } from '../components/StepList';
import { etapasIA } from '../data/mock';
import type { RootStackParamList } from '../navigation/types';
import { useFlow } from '../store/FlowContext';
import { colors, font, fontDado, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Processing'>;

const MS_POR_ETAPA = 600;
const MS_RESPIRO = 320;

/**
 * A espera entre a foto e o conteudo identificado. A foto nao e tratada nem
 * alterada: ela segue como a camera tirou. A cena de antes e depois saiu em
 * 16/09, depois do teste no iPhone: mexer na foto do estudante inventava zoom e
 * brilho que nao estavam la.
 */
export function ProcessingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [indice, setIndice] = useState(0);
  // A analise ja foi disparada na captura, para aproveitar tambem o tempo da
  // navegacao. Aqui a gente so observa o resultado.
  const { modoAoVivo, classificacao, analisando } = useFlow();
  const statusAoVivo = !modoAoVivo
    ? 'off'
    : classificacao !== null
      ? 'ok'
      : analisando
        ? 'analisando'
        : 'simulado';

  // Toda a sequencia e agendada de uma vez e limpa junto. Timer sobrevivendo ao
  // unmount e a causa numero 1 de crash aleatorio em demonstracao.
  useEffect(() => {
    const timers = etapasIA.map((_, i) =>
      setTimeout(() => setIndice(i + 1), (i + 1) * MS_POR_ETAPA)
    );
    // replace, e nao navigate: o botao voltar nao pode retornar ao processamento.
    timers.push(
      setTimeout(
        () => navigation.replace('Identified'),
        etapasIA.length * MS_POR_ETAPA + MS_RESPIRO
      )
    );
    return () => timers.forEach(clearTimeout);
  }, [navigation]);

  return (
    <View style={[styles.tela, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.corpo}>
        <Text style={styles.titulo}>Analisando conteúdo...</Text>
        <Text style={styles.subtitulo}>Isso pode levar alguns segundos.</Text>

        <View style={styles.areaAnel}>
          <ProgressRing progress={indice / etapasIA.length} size={148} stroke={8}>
            <MaterialCommunityIcons name="brain" size={46} color={colors.primary} />
          </ProgressRing>
        </View>

        <StepList steps={etapasIA} activeIndex={indice} style={styles.etapas} />
      </View>

      <View style={styles.rodape}>
        {statusAoVivo !== 'off' ? (
          <Text style={styles.selo}>
            {statusAoVivo === 'analisando'
              ? 'ANÁLISE AO VIVO EM ANDAMENTO'
              : statusAoVivo === 'ok'
                ? 'CONTEÚDO LIDO DA SUA FOTO'
                : 'SEM RESPOSTA A TEMPO · USANDO EXEMPLO'}
          </Text>
        ) : null}
        <GhostButton label="Cancelar" variant="outline" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  corpo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing(6),
  },
  rodape: {
    paddingHorizontal: spacing(6),
    paddingBottom: spacing(4),
  },
  selo: {
    ...fontDado.rotulo,
    color: colors.textFaint,
    textAlign: 'center',
    marginBottom: spacing(3),
  },
  titulo: {
    ...font.h2,
    color: colors.text,
    textAlign: 'center',
  },
  subtitulo: {
    ...font.small,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing(2),
  },
  areaAnel: {
    marginVertical: spacing(8),
  },
  etapas: {
    alignSelf: 'stretch',
  },
});
