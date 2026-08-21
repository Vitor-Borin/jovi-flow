import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { GhostButton } from '../components/GhostButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, font, fontDado, radius, spacing } from '../theme';

export type AcaoRascunho = {
  label: string;
  onPress: () => void;
  principal?: boolean;
};

type Props = {
  titulo: string;
  /** Fase em que esta tela recebe o conteudo real. Ex.: 'FASE 4'. */
  fase: string;
  descricao: string;
  onVoltar?: () => void;
  acoes?: AcaoRascunho[];
};

/**
 * ANDAIME TEMPORARIO — Fase 3.
 *
 * Da corpo as telas ainda sem conteudo para que a navegacao possa ser percorrida
 * inteira no celular. Cada tela substitui este rascunho pelo conteudo real na
 * fase indicada, e o arquivo e apagado quando a ultima delas for escrita.
 */
export function Rascunho({ titulo, fase, descricao, onVoltar, acoes = [] }: Props) {
  return (
    <View style={styles.tela}>
      <ScreenHeader title={titulo} onBack={onVoltar} />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.etiqueta}>
          <Text style={styles.etiquetaTexto}>{fase}</Text>
        </View>

        <Text style={styles.descricao}>{descricao}</Text>

        <View style={styles.divisor} />

        {acoes.map((acao) =>
          acao.principal ? (
            <PrimaryButton
              key={acao.label}
              label={acao.label}
              onPress={acao.onPress}
              style={styles.acao}
            />
          ) : (
            <GhostButton
              key={acao.label}
              label={acao.label}
              variant="outline"
              onPress={acao.onPress}
              style={styles.acao}
            />
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  conteudo: {
    padding: spacing(5),
    paddingBottom: spacing(12),
  },
  etiqueta: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2),
  },
  etiquetaTexto: {
    ...fontDado.rotulo,
    color: colors.textDim,
  },
  descricao: {
    ...font.body,
    color: colors.textDim,
    lineHeight: 21,
    marginTop: spacing(4),
  },
  divisor: {
    height: 1,
    backgroundColor: colors.borderSoft,
    marginVertical: spacing(6),
  },
  acao: {
    marginBottom: spacing(3),
  },
});
