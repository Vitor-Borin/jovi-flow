import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TOQUE_MIN, colors, font, spacing } from '../theme';

type Props = {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  /** Desliga o recuo da area segura. Para cabecalho que nao fica no topo da tela,
   *  como dentro de um bottom sheet. */
  semAreaSegura?: boolean;
};

/**
 * Cabecalho de tela: voltar a esquerda, titulo ao centro, slot livre a direita.
 *
 * Os slots laterais tem largura fixa para o titulo nao dancar entre telas.
 * O recuo do topo respeita a area segura. Sem isso o cabecalho fica embaixo do
 * notch ou da Dynamic Island. O recuo vai num container proprio para nao se
 * misturar com a altura minima da barra.
 */
export function ScreenHeader({ title, onBack, right, semAreaSegura = false }: Props) {
  const insets = useSafeAreaInsets();
  const recuoTopo = semAreaSegura ? 0 : insets.top;

  return (
    <View style={{ paddingTop: recuoTopo }}>
      <View style={styles.barra}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
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
