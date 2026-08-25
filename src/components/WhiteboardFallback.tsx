import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../theme';

type Props = {
  style?: StyleProp<ViewStyle>;
};

/**
 * Lousa de aula desenhada apenas com View e Text, sem arquivo de imagem.
 *
 * Entra no lugar do visor quando a permissao de camera e negada ou o app roda em
 * emulador, para a demonstracao nunca mostrar uma tela preta.
 *
 * Ela e FUNDO, e nao conteudo. A versao anterior era uma ficha de consulta com
 * dezessete linhas sobre Flexbox, competindo com os badges, a pilula de
 * deteccao, os chips e o cartao de descoberta que ficam por cima dela. Precisa
 * apenas parecer um quadro de aula num relance.
 */
export function WhiteboardFallback({ style }: Props) {
  return (
    <View
      style={[styles.quadro, style]}
      accessible
      accessibilityLabel="Lousa de aula sobre Flexbox, usada como exemplo quando a câmera não está disponível."
    >
      <Text style={styles.titulo}>FLEXBOX</Text>
      <View style={styles.sublinhado} />

      <Text style={styles.codigo}>display: flex</Text>

      {/* Container com tres itens, como um professor rascunharia no quadro. */}
      <View style={styles.demo}>
        <View style={styles.item} />
        <View style={styles.item} />
        <View style={styles.item} />
      </View>

      <Text style={styles.eixo}>justify-content →</Text>
      <Text style={styles.eixo}>align-items ↓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  quadro: {
    flex: 1,
    backgroundColor: colors.board,
    borderRadius: radius.lg,
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(6),
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(4),
    overflow: 'hidden',
  },
  titulo: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 4,
    color: colors.boardBlue,
  },
  sublinhado: {
    height: 2,
    width: spacing(24),
    backgroundColor: colors.boardBlue,
    marginTop: -spacing(3),
  },
  codigo: {
    fontSize: 15,
    color: colors.boardInk,
  },
  demo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    borderWidth: 1.5,
    borderColor: colors.boardInk,
    borderRadius: radius.sm,
    padding: spacing(2),
    marginTop: spacing(2),
  },
  item: {
    width: spacing(11),
    height: spacing(8),
    borderRadius: 2,
    backgroundColor: colors.boardBlue,
    opacity: 0.7,
  },
  eixo: {
    fontSize: 13,
    color: colors.boardRed,
    alignSelf: 'flex-start',
  },
});
