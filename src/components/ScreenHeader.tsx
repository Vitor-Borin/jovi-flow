import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TOQUE_MIN, colors, font, spacing } from '../theme';

type Props = {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
};

/** Cabecalho de tela: voltar a esquerda, titulo ao centro, slot livre a direita.
 *  Os slots laterais tem largura fixa para o titulo nao dancar entre telas. */
export function ScreenHeader({ title, onBack, right }: Props) {
  return (
    <View style={styles.base}>
      <View style={styles.lateral}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={spacing(2)}
            style={({ pressed }) => [styles.botaoVoltar, pressed && styles.pressionado]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.centro}>
        {title ? (
          <Text style={styles.titulo} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        ) : null}
      </View>

      <View style={[styles.lateral, styles.lateralDireita]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOQUE_MIN + spacing(2),
    paddingHorizontal: spacing(3),
  },
  lateral: {
    minWidth: TOQUE_MIN,
    justifyContent: 'center',
  },
  lateralDireita: {
    alignItems: 'flex-end',
  },
  botaoVoltar: {
    width: TOQUE_MIN,
    height: TOQUE_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressionado: {
    opacity: 0.6,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(2),
  },
  titulo: {
    ...font.h3,
    color: colors.text,
  },
});
