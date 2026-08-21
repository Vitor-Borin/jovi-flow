import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '../components/ScreenHeader';
import { plataformas } from '../data/mock';
import type { RootStackParamList } from '../navigation/types';
import { TOQUE_MIN, colors, font, fontDado, radius, spacing } from '../theme';
import { useFlow } from '../store/FlowContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Platforms'>;

export function PlatformsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { plataformasConectadas, alternarPlataforma } = useFlow();

  return (
    <View style={styles.tela}>
      <ScreenHeader title="Plataformas" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing(8) }]}
      >
        <Text style={styles.chamada}>Para onde o conteúdo vai sozinho</Text>
        <Text style={styles.subchamada}>
          A aula capturada chega nas ferramentas que você já usa, sem você reabrir nada. O que
          estiver ligado aqui aparece como destino ao salvar.
        </Text>

        <View style={styles.contador}>
          <Text style={styles.valorContador}>{plataformasConectadas.length}</Text>
          <Text style={styles.rotuloContador}>
            de {plataformas.length} plataformas conectadas
          </Text>
        </View>

        {plataformas.map((p) => {
          const conectada = plataformasConectadas.includes(p.id);
          return (
            <Pressable
              key={p.id}
              onPress={() => {
                void Haptics.selectionAsync();
                alternarPlataforma(p.id);
              }}
              accessibilityRole="switch"
              accessibilityLabel={`${p.nome}. ${p.papel}`}
              accessibilityState={{ checked: conectada }}
              style={({ pressed }) => [
                styles.item,
                conectada && styles.itemConectado,
                pressed && styles.itemPressionado,
              ]}
            >
              <MaterialCommunityIcons
                name={p.icone}
                size={24}
                color={conectada ? colors.primaryHi : colors.textFaint}
              />

              <View style={styles.textos}>
                <Text style={[styles.nome, conectada && styles.nomeConectado]} numberOfLines={1}>
                  {p.nome}
                </Text>
                <Text style={styles.papel} numberOfLines={2}>
                  {p.papel}
                </Text>
              </View>

              <View style={[styles.trilho, conectada && styles.trilhoLigado]}>
                <View style={[styles.botaoTrilho, conectada && styles.botaoTrilhoLigado]} />
              </View>
            </Pressable>
          );
        })}

        <View style={styles.nota}>
          <MaterialCommunityIcons name="shield-lock-outline" size={16} color={colors.textDim} />
          <Text style={styles.textoNota}>
            O envio acontece depois que você confirma a captura. Nada sai do aparelho sem o seu
            toque.
          </Text>
        </View>
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
    paddingHorizontal: spacing(5),
  },
  chamada: {
    ...font.h2,
    color: colors.text,
    marginTop: spacing(2),
  },
  subchamada: {
    ...font.body,
    color: colors.textDim,
    lineHeight: 21,
    marginTop: spacing(3),
  },

  contador: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing(2),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing(4),
    marginTop: spacing(6),
    marginBottom: spacing(5),
  },
  valorContador: {
    ...fontDado.valorGrande,
    color: colors.primaryHi,
  },
  rotuloContador: {
    ...font.small,
    color: colors.textDim,
    flexShrink: 1,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3.5),
    minHeight: spacing(18),
    paddingHorizontal: spacing(4),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    marginBottom: spacing(3),
  },
  itemConectado: {
    borderColor: colors.primaryEdge,
  },
  itemPressionado: {
    backgroundColor: colors.surfaceAlt,
  },
  textos: {
    flex: 1,
  },
  nome: {
    ...font.bodyMed,
    color: colors.textDim,
  },
  nomeConectado: {
    color: colors.text,
  },
  papel: {
    ...font.small,
    color: colors.textFaint,
    marginTop: spacing(0.5),
    lineHeight: 16,
  },

  trilho: {
    width: spacing(11),
    height: spacing(6),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHi,
    padding: spacing(0.75),
    justifyContent: 'center',
    minWidth: TOQUE_MIN - spacing(1),
  },
  trilhoLigado: {
    backgroundColor: colors.primary,
  },
  botaoTrilho: {
    width: spacing(4.5),
    height: spacing(4.5),
    borderRadius: radius.pill,
    backgroundColor: colors.textDim,
  },
  botaoTrilhoLigado: {
    backgroundColor: colors.onPrimary,
    alignSelf: 'flex-end',
  },

  nota: {
    flexDirection: 'row',
    gap: spacing(3),
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing(4),
    marginTop: spacing(4),
  },
  textoNota: {
    ...font.small,
    color: colors.textDim,
    lineHeight: 18,
    flex: 1,
  },
});
