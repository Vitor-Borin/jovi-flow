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
  const { plataformasConectadas, plataformasAutomaticas, alternarPlataforma, alternarAutomatico } =
    useFlow();

  return (
    <View style={styles.tela}>
      <ScreenHeader title="Plataformas" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing(8) }]}
      >
        <Text style={styles.chamada}>Para onde o conteúdo vai sozinho</Text>
        <Text style={styles.subchamada}>
          A aula capturada chega nas ferramentas que você já usa, sem você reabrir nada. Ligue as
          que quiser e escolha, uma por uma, se ela pode enviar sozinha ou se precisa perguntar
          antes.
        </Text>

        <View style={styles.contador}>
          <Text style={styles.valorContador}>{plataformasConectadas.length}</Text>
          <Text style={styles.rotuloContador}>
            de {plataformas.length} plataformas conectadas
          </Text>
        </View>

        {plataformas.map((p) => {
          const conectada = plataformasConectadas.includes(p.id);
          const automatica = plataformasAutomaticas.includes(p.id);
          return (
            <View key={p.id} style={styles.bloco}>
            <Pressable
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

            {/* So aparece quando a plataforma esta ligada: escolher o modo de
                envio de uma plataforma desconectada nao significaria nada. */}
            {conectada ? (
              <View style={styles.linhaModo}>
                <Pressable
                  onPress={() => {
                    if (automatica) return;
                    void Haptics.selectionAsync();
                    alternarAutomatico(p.id);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: automatica }}
                  accessibilityLabel={`${p.nome} envia sozinho`}
                  style={[styles.opcaoModo, automatica && styles.opcaoModoAtiva]}
                >
                  <MaterialCommunityIcons
                    name="flash-outline"
                    size={14}
                    color={automatica ? colors.primaryHi : colors.textFaint}
                  />
                  <Text style={[styles.textoModo, automatica && styles.textoModoAtivo]}>
                    Envia sozinho
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    if (!automatica) return;
                    void Haptics.selectionAsync();
                    alternarAutomatico(p.id);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: !automatica }}
                  accessibilityLabel={`${p.nome} pergunta antes de enviar`}
                  style={[styles.opcaoModo, !automatica && styles.opcaoModoAtiva]}
                >
                  <MaterialCommunityIcons
                    name="hand-back-right-outline"
                    size={14}
                    color={!automatica ? colors.primaryHi : colors.textFaint}
                  />
                  <Text style={[styles.textoModo, !automatica && styles.textoModoAtivo]}>
                    Pergunta antes
                  </Text>
                </Pressable>
              </View>
            ) : null}
            </View>
          );
        })}

        <View style={styles.nota}>
          <MaterialCommunityIcons name="shield-lock-outline" size={16} color={colors.textDim} />
          <Text style={styles.textoNota}>
            Nada é publicado sem a sua escolha. O padrão manda sozinho só para o seu próprio
            Drive. Onde o conteúdo sai para outras pessoas, como o Classroom e o GitHub, o Flow
            pergunta antes.
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

  bloco: {
    marginBottom: spacing(3),
  },
  linhaModo: {
    flexDirection: 'row',
    gap: spacing(2),
    marginTop: -spacing(1),
    paddingLeft: spacing(4),
  },
  opcaoModo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    minHeight: spacing(9),
    paddingHorizontal: spacing(3),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  opcaoModoAtiva: {
    borderColor: colors.primaryEdge,
    backgroundColor: colors.primarySoft,
  },
  textoModo: {
    ...font.tiny,
    color: colors.textFaint,
  },
  textoModoAtivo: {
    color: colors.primaryHi,
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
