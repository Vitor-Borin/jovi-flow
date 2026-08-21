import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../theme';

type Props = {
  style?: StyleProp<ViewStyle>;
};

/**
 * Lousa da aula de Funcao desenhada apenas com View e Text — nenhum arquivo de imagem.
 *
 * Motivo: entra no lugar do visor quando a permissao de camera e negada ou o app
 * roda em emulador. Garante que a demonstracao funcione em qualquer situacao,
 * sem nunca deixar a tela preta.
 */
export function WhiteboardFallback({ style }: Props) {
  return (
    <View
      style={[styles.quadro, style]}
      accessible
      accessibilityLabel="Lousa da aula de Funcao, com definicao, exemplos e tipos de funcao."
    >
      <Text style={styles.titulo}>FUNÇÃO</Text>
      <View style={styles.sublinhadoTitulo} />

      <View style={styles.colunas}>
        <View style={styles.coluna}>
          <Text style={styles.secaoVermelha}>DEFINIÇÃO</Text>
          <Text style={styles.corpo}>
            É uma relação que associa cada elemento de um conjunto A exatamente a um elemento de um
            conjunto B.
          </Text>
          <View style={styles.caixaFormula}>
            <Text style={styles.formula}>f : A → B</Text>
            <Text style={styles.formulaIndentada}>x ↦ f(x)</Text>
          </View>
        </View>

        <View style={styles.divisorVertical} />

        <View style={styles.coluna}>
          <Text style={styles.secaoAzul}>EXEMPLOS</Text>
          <Text style={styles.formula}>① f(x) = 2x + 1</Text>
          <Text style={styles.formula}>② f(x) = x² − 4</Text>
          <Text style={styles.formula}>③ f(x) = 1/x , x ≠ 0</Text>
        </View>
      </View>

      <View style={styles.divisorHorizontal} />

      <Text style={styles.secaoAzul}>TIPOS DE FUNÇÕES</Text>
      <Text style={styles.item}>• Função Afim: f(x) = ax + b  (a ≠ 0)</Text>
      <Text style={styles.item}>• Função Quadrática: f(x) = ax² + bx + c  (a ≠ 0)</Text>
      <Text style={styles.item}>• Função Constante: f(x) = c</Text>
      <Text style={styles.item}>• Função Identidade: f(x) = x</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  quadro: {
    flex: 1,
    backgroundColor: colors.board,
    borderRadius: radius.lg,
    padding: spacing(4),
    overflow: 'hidden',
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    color: colors.boardBlue,
  },
  sublinhadoTitulo: {
    height: 2,
    width: '42%',
    alignSelf: 'center',
    backgroundColor: colors.boardBlue,
    marginTop: spacing(0.5),
    marginBottom: spacing(3),
  },
  colunas: {
    flexDirection: 'row',
  },
  coluna: {
    flex: 1,
  },
  divisorVertical: {
    width: 1,
    backgroundColor: colors.boardRed,
    marginHorizontal: spacing(3),
  },
  divisorHorizontal: {
    height: 1,
    backgroundColor: colors.boardRed,
    marginVertical: spacing(3),
  },
  secaoVermelha: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.boardRed,
    marginBottom: spacing(1.5),
  },
  secaoAzul: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.boardBlue,
    marginBottom: spacing(1.5),
  },
  corpo: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.boardInk,
  },
  caixaFormula: {
    borderWidth: 1,
    borderColor: colors.boardRed,
    borderRadius: radius.sm,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2.5),
    marginTop: spacing(2),
    alignSelf: 'flex-start',
  },
  formula: {
    fontSize: 12,
    lineHeight: 20,
    color: colors.boardInk,
  },
  formulaIndentada: {
    fontSize: 12,
    lineHeight: 20,
    color: colors.boardInk,
    marginLeft: spacing(3),
  },
  item: {
    fontSize: 11,
    lineHeight: 18,
    color: colors.boardInk,
  },
});
