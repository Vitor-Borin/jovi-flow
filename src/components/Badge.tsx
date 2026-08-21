import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, font, radius, spacing } from '../theme';

export type BadgeVariant = 'solid' | 'soft' | 'neutral';

type Props = {
  label: string;
  variant: BadgeVariant;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Pilula pequena de status. O texto sempre acompanha a cor: nunca comunicamos
 *  estado so por cor (requisito de acessibilidade do projeto). */
export function Badge({ label, variant, dot = false, style }: Props) {
  return (
    <View style={[styles.base, variantesContainer[variant], style]}>
      {dot ? <View style={[styles.dot, variantesDot[variant]]} /> : null}
      <Text style={[styles.label, variantesTexto[variant]]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2.5),
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  label: {
    ...font.tiny,
  },
  dot: {
    width: spacing(1.5),
    height: spacing(1.5),
    borderRadius: radius.pill,
    marginRight: spacing(1.5),
  },
});

const variantesContainer = StyleSheet.create({
  solid: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  soft: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryEdge,
  },
  neutral: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
});

const variantesTexto = StyleSheet.create({
  solid: { color: colors.onPrimary },
  soft: { color: colors.primaryHi },
  neutral: { color: colors.textDim },
});

const variantesDot = StyleSheet.create({
  solid: { backgroundColor: colors.onPrimary },
  soft: { backgroundColor: colors.primaryHi },
  neutral: { backgroundColor: colors.textFaint },
});
