import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { TOQUE_MIN, colors, font, radius, spacing } from '../theme';

type Props = {
  falando: boolean;
  onPress: () => void;
  rotulo?: string;
  style?: StyleProp<ViewStyle>;
};

/** Play/parar da leitura em voz alta. Pilula, para caber ao lado de outras acoes. */
export function BotaoOuvir({ falando, onPress, rotulo = 'Ouvir', style }: Props) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={falando ? 'Parar a leitura em voz alta' : `${rotulo} em voz alta`}
      accessibilityState={{ selected: falando }}
      style={({ pressed }) => [
        styles.base,
        falando && styles.ativo,
        pressed && styles.pressionado,
        style,
      ]}
    >
      <Ionicons
        name={falando ? 'stop' : 'play'}
        size={14}
        color={falando ? colors.onPrimary : colors.primaryHi}
      />
      <Text style={[styles.texto, falando && styles.textoAtivo]}>
        {falando ? 'Parar' : rotulo}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    minHeight: TOQUE_MIN,
    paddingHorizontal: spacing(4),
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  ativo: {
    backgroundColor: colors.primary,
  },
  pressionado: {
    opacity: 0.7,
  },
  texto: {
    ...font.bodyMed,
    color: colors.primaryHi,
  },
  textoAtivo: {
    color: colors.onPrimary,
  },
});
