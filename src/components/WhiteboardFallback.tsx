import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../theme';

type Props = {
  style?: StyleProp<ViewStyle>;
  /** Versao menor, para caber numa miniatura de foto. */
  compacto?: boolean;
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
export function WhiteboardFallback({ style, compacto = false }: Props) {
  return (
    <View
      style={[styles.quadro, compacto && styles.quadroCompacto, style]}
      accessible
      accessibilityLabel="Lousa de aula sobre Flexbox, usada como exemplo quando a câmera não está disponível."
    >
      <Text style={[styles.titulo, compacto && styles.tituloCompacto]}>FLEXBOX</Text>
      <View style={styles.sublinhado} />

      <Text style={styles.codigo}>display: flex</Text>

      {/* Container com tres itens, como um professor rascunharia no quadro. */}
      <View style={[styles.demo, compacto && styles.demoCompacta]}>
        <View style={[styles.item, compacto && styles.itemCompacto]} />
        <View style={[styles.item, compacto && styles.itemCompacto]} />
        <View style={[styles.item, compacto && styles.itemCompacto]} />
      </View>

      {compacto ? null : (
        <>
          <Text style={styles.eixo}>justify-content →</Text>
          <Text style={styles.eixo}>align-items ↓</Text>
        </>
      )}
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
  quadroCompacto: {
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(5),
    gap: spacing(2.5),
  },
  tituloCompacto: {
    fontSize: 20,
  },
  demoCompacta: {
    marginTop: 0,
  },
  itemCompacto: {
    height: spacing(6),
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
