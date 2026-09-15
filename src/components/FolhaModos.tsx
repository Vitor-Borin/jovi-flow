import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { modosJovi } from '../data/mock';
import { TOQUE_MIN, colors, font, radius, spacing } from '../theme';

type Props = {
  aberto: boolean;
  selecionado: string;
  onSelecionar: (nome: string) => void;
  onFechar: () => void;
};

/**
 * A folha do "Mais", com os modos que a camera do JOVI V50 tem de verdade.
 *
 * Os cinco que este prototipo implementa sao tocaveis. Os outros aparecem
 * apagados, com o aviso de que existem no aparelho e ficaram fora do
 * prototipo: a regra do DESIGN.md e que a tela nunca afirme o que nao faz, e
 * esconder a camera real seria afirmar que o Flow e a camera inteira.
 *
 * Tem um segundo papel, de pitch: e aqui que se ve "Documento em Ultra HD" ao
 * lado do "Aula", que e o argumento de que o Flow especializa um modo que a
 * JOVI ja vende.
 */
export function FolhaModos({ aberto, selecionado, onSelecionar, onFechar }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={aberto} animationType="slide" transparent onRequestClose={onFechar}>
      <View style={styles.camada}>
        <Pressable
          style={styles.scrim}
          onPress={onFechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar os modos"
        />

        <View style={[styles.folha, { paddingBottom: insets.bottom + spacing(5) }]}>
          <View style={styles.alca} />
          <Text style={styles.titulo}>Modos</Text>

          <ScrollView contentContainerStyle={styles.grade}>
            {modosJovi.map((m) => {
              const ativo = m.nome === selecionado;
              const disponivel = m.noPrototipo === true;
              return (
                <Pressable
                  key={m.nome}
                  onPress={
                    disponivel
                      ? () => {
                          void Haptics.selectionAsync();
                          onSelecionar(m.nome);
                          onFechar();
                        }
                      : undefined
                  }
                  disabled={!disponivel}
                  accessibilityRole="button"
                  accessibilityLabel={
                    disponivel
                      ? `Modo ${m.nome}`
                      : `${m.nome}. Existe na câmera do JOVI, fora deste protótipo.`
                  }
                  accessibilityState={{ selected: ativo, disabled: !disponivel }}
                  style={({ pressed }) => [
                    styles.item,
                    ativo && styles.itemAtivo,
                    !disponivel && styles.itemForaDoEscopo,
                    pressed && disponivel && styles.itemPressionado,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={m.icone}
                    size={22}
                    color={
                      ativo
                        ? colors.visor.destaque
                        : disponivel
                          ? colors.visor.icone
                          : colors.textFaint
                    }
                  />
                  <Text
                    style={[
                      styles.nome,
                      ativo && styles.nomeAtivo,
                      !disponivel && styles.nomeForaDoEscopo,
                    ]}
                    numberOfLines={2}
                  >
                    {m.nome}
                  </Text>
                  {m.nota ? (
                    <Text style={[styles.nota, !disponivel && styles.notaForaDoEscopo]} numberOfLines={2}>
                      {m.nota}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.rodape}>
            Os modos apagados são da câmera do JOVI V50 e ficaram fora do protótipo. O Modo Aula
            nasce do "Documento em Ultra HD", que a JOVI já tem.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  camada: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  folha: {
    maxHeight: '82%',
    backgroundColor: colors.bgElev,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing(4),
    paddingTop: spacing(3),
  },
  alca: {
    width: spacing(10),
    height: spacing(1),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHi,
    alignSelf: 'center',
    marginBottom: spacing(4),
  },
  titulo: {
    ...font.h3,
    color: colors.visor.icone,
    marginBottom: spacing(4),
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
  },
  item: {
    width: '31%',
    flexGrow: 1,
    minHeight: spacing(22),
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1.5),
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(3),
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  // Dentro da camera o selecionado e amarelo, como na regua de modos.
  itemAtivo: {
    backgroundColor: colors.surfaceHi,
  },
  itemForaDoEscopo: {
    backgroundColor: 'transparent',
  },
  itemPressionado: {
    backgroundColor: colors.surfaceAlt,
  },
  nome: {
    ...font.small,
    fontWeight: '600',
    color: colors.visor.icone,
    textAlign: 'center',
  },
  nomeAtivo: {
    color: colors.visor.destaque,
  },
  nomeForaDoEscopo: {
    color: colors.textFaint,
    fontWeight: '400',
  },
  nota: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primaryHi,
    textAlign: 'center',
  },
  notaForaDoEscopo: {
    color: colors.textDim,
  },
  rodape: {
    ...font.small,
    color: colors.textFaint,
    lineHeight: 17,
    marginTop: spacing(4),
    minHeight: TOQUE_MIN,
  },
});
