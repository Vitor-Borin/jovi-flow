import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../theme';

type Props = {
  style?: StyleProp<ViewStyle>;
};

/**
 * Lousa da aula de Front-End Design desenhada apenas com View e Text — nenhum
 * arquivo de imagem.
 *
 * Motivo: entra no lugar do visor quando a permissao de camera e negada ou o app
 * roda em emulador. Garante que a demonstracao funcione em qualquer situacao,
 * sem nunca deixar a tela preta.
 *
 * O conteudo e Flexbox de proposito: e o que a disciplina em que a apresentacao
 * acontece esta ensinando, e o que o proprio brief da Sprint 2 exige.
 */
export function WhiteboardFallback({ style }: Props) {
  return (
    <View
      style={[styles.quadro, style]}
      accessible
      accessibilityLabel="Lousa da aula de Front-End Design, sobre Flexbox: eixos, alinhamento e propriedades dos itens."
    >
      <Text style={styles.titulo}>FLEXBOX</Text>
      <View style={styles.sublinhadoTitulo} />

      <View style={styles.caixaCodigo}>
        <Text style={styles.codigo}>.container {'{'} display: flex; {'}'}</Text>
      </View>

      <View style={styles.colunas}>
        <View style={styles.coluna}>
          <Text style={styles.secaoVermelha}>EIXO PRINCIPAL</Text>
          <Text style={styles.corpo}>justify-content</Text>
          <Text style={styles.valor}>flex-start</Text>
          <Text style={styles.valor}>center</Text>
          <Text style={styles.valor}>space-between</Text>
        </View>

        <View style={styles.divisorVertical} />

        <View style={styles.coluna}>
          <Text style={styles.secaoAzul}>EIXO CRUZADO</Text>
          <Text style={styles.corpo}>align-items</Text>
          <Text style={styles.valor}>stretch</Text>
          <Text style={styles.valor}>center</Text>
          <Text style={styles.valor}>baseline</Text>
        </View>
      </View>

      {/* Desenho do container com tres itens, como um professor rascunharia. */}
      <View style={styles.demo}>
        <View style={styles.demoItem} />
        <View style={styles.demoItem} />
        <View style={styles.demoItem} />
      </View>
      <Text style={styles.legendaDemo}>row · space-between</Text>

      <View style={styles.divisorHorizontal} />

      <Text style={styles.secaoAzul}>NOS ITENS</Text>
      <Text style={styles.item}>• flex-grow → cresce se sobrar espaço</Text>
      <Text style={styles.item}>• flex-shrink → encolhe se faltar</Text>
      <Text style={styles.item}>• flex-basis → tamanho de partida</Text>
      <Text style={styles.itemDestaque}>flex: 1 == flex: 1 1 0%</Text>
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
    letterSpacing: 3,
    textAlign: 'center',
    color: colors.boardBlue,
  },
  sublinhadoTitulo: {
    height: 2,
    width: '38%',
    alignSelf: 'center',
    backgroundColor: colors.boardBlue,
    marginTop: spacing(0.5),
    marginBottom: spacing(2.5),
  },
  caixaCodigo: {
    borderWidth: 1,
    borderColor: colors.boardRed,
    borderRadius: radius.sm,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2.5),
    alignSelf: 'center',
    marginBottom: spacing(3),
  },
  codigo: {
    fontSize: 12,
    color: colors.boardInk,
  },
  colunas: {
    flexDirection: 'row',
  },
  coluna: {
    flex: 1,
  },
  divisorVertical: {
    width: 1,
    backgroundColor: colors.boardLine,
    marginHorizontal: spacing(3),
  },
  divisorHorizontal: {
    height: 1,
    backgroundColor: colors.boardRed,
    marginVertical: spacing(2.5),
  },
  secaoVermelha: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.boardRed,
    marginBottom: spacing(1.5),
  },
  secaoAzul: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.boardBlue,
    marginBottom: spacing(1.5),
  },
  corpo: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.boardInk,
    marginBottom: spacing(1),
  },
  valor: {
    fontSize: 10,
    lineHeight: 15,
    color: colors.boardInk,
  },
  demo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.boardInk,
    borderRadius: radius.sm,
    padding: spacing(1.5),
    marginTop: spacing(3),
  },
  demoItem: {
    width: spacing(7),
    height: spacing(5),
    borderRadius: 2,
    backgroundColor: colors.boardBlue,
    opacity: 0.75,
  },
  legendaDemo: {
    fontSize: 9,
    color: colors.boardInk,
    textAlign: 'center',
    marginTop: spacing(1),
  },
  item: {
    fontSize: 11,
    lineHeight: 17,
    color: colors.boardInk,
  },
  itemDestaque: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.boardRed,
    marginTop: spacing(1),
  },
});
