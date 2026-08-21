import { Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { ALTURA_BOTAO, TOQUE_MIN, colors, font, radius, spacing } from '../theme';

export type GhostVariant = 'outline' | 'text';

type Props = {
  label: string;
  onPress: () => void;
  variant: GhostVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function GhostButton({ label, onPress, variant, disabled = false, style }: Props) {
  const ehOutline = variant === 'outline';

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        ehOutline ? styles.outline : styles.texto,
        pressed && !disabled && styles.pressionado,
        disabled && styles.bloqueado,
        style,
      ]}
    >
      <Text style={[styles.label, ehOutline ? styles.labelOutline : styles.labelTexto]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(4),
  },
  outline: {
    height: ALTURA_BOTAO,
    width: '100%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  texto: {
    minHeight: TOQUE_MIN,
    alignSelf: 'center',
  },
  pressionado: {
    opacity: 0.6,
  },
  bloqueado: {
    opacity: 0.4,
  },
  label: {
    ...font.h3,
  },
  labelOutline: {
    color: colors.text,
  },
  labelTexto: {
    ...font.bodyMed,
    color: colors.textDim,
  },
});
