import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { ALTURA_BOTAO, colors, font, radius, spacing } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  icon,
  style,
}: Props) {
  const bloqueado = disabled || loading;

  const aoTocar = () => {
    if (bloqueado) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={aoTocar}
      disabled={bloqueado}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: bloqueado, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        bloqueado && styles.bloqueado,
        pressed && !bloqueado && styles.pressionado,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <View style={styles.conteudo}>
          {icon ? (
            <Ionicons name={icon} size={18} color={colors.onPrimary} style={styles.icone} />
          ) : null}
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: ALTURA_BOTAO,
    width: '100%',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(4),
  },
  bloqueado: {
    opacity: 0.4,
  },
  pressionado: {
    backgroundColor: colors.primaryDim,
  },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icone: {
    marginRight: spacing(2),
  },
  label: {
    ...font.h3,
    color: colors.onPrimary,
  },
});
