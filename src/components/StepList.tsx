import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, font, spacing } from '../theme';

export type Step = {
  id: string;
  label: string;
  detalhe: string;
};

type Props = {
  steps: Step[];
  /** Indice da etapa em andamento. Etapas antes dela contam como concluidas. */
  activeIndex: number;
  style?: StyleProp<ViewStyle>;
};

const TAMANHO_ICONE = 22;

export function StepList({ steps, activeIndex, style }: Props) {
  return (
    <View style={style}>
      {steps.map((etapa, indice) => {
        const concluida = indice < activeIndex;
        const ativa = indice === activeIndex;

        return (
          <View
            key={etapa.id}
            style={styles.linha}
            accessible
            accessibilityLabel={`${etapa.label}. ${
              concluida ? 'Concluido' : ativa ? 'Em andamento' : 'Pendente'
            }.`}
          >
            <View style={styles.icone}>
              {concluida ? (
                <Ionicons name="checkmark-circle" size={TAMANHO_ICONE} color={colors.primary} />
              ) : ativa ? (
                <ActivityIndicator size="small" color={colors.primaryHi} />
              ) : (
                <Ionicons name="ellipse-outline" size={TAMANHO_ICONE} color={colors.textFaint} />
              )}
            </View>

            <View style={styles.textos}>
              <Text
                style={[styles.label, !concluida && !ativa && styles.pendente]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {etapa.label}
              </Text>
              <Text
                style={[styles.detalhe, !concluida && !ativa && styles.pendente]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {etapa.detalhe}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(2.5),
  },
  icone: {
    width: TAMANHO_ICONE + spacing(2),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(3),
  },
  textos: {
    flex: 1,
  },
  label: {
    ...font.bodyMed,
    color: colors.text,
  },
  detalhe: {
    ...font.small,
    color: colors.textDim,
    marginTop: spacing(0.5),
  },
  pendente: {
    color: colors.textFaint,
  },
});
