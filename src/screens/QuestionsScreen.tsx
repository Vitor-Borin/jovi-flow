import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { questoes as questoesExemplo } from '../data/mock';
import type { RootStackParamList } from '../navigation/types';
import { PX, QUESTOES_MAXIMO, gerarEstudo, prepararImagem } from '../services/analiseAoVivo';
import { useAcervo } from '../store/AcervoContext';
import { useFlow } from '../store/FlowContext';
import { TOQUE_MIN, colors, font, fontDado, radius, spacing } from '../theme';

/** Quantidades que a tela oferece. Mais que o teto da API não é oferecido. */
const QUANTIDADES = [3, 5, QUESTOES_MAXIMO];

type Props = NativeStackScreenProps<RootStackParamList, 'Questions'>;

/** Indice escolhido por questao. null = ainda nao respondida. */
type Respostas = (number | null)[];

export function QuestionsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { aulaPorId, adicionarQuestoes } = useAcervo();
  const { modoAoVivo, subModo } = useFlow();
  const aula = aulaPorId(route.params.aulaId);
  // As questoes sao da propria aula. O exemplo so entra se ela nao tiver nenhuma.
  const questoes = aula !== null && aula.questoes.length > 0 ? aula.questoes : questoesExemplo;
  const [respostas, setRespostas] = useState<Respostas>(() => questoes.map(() => null));
  const [gerando, setGerando] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Questao nova entra no fim da lista, ainda sem resposta.
  useEffect(() => {
    setRespostas((atual) =>
      atual.length === questoes.length
        ? atual
        : questoes.map((_, i) => (i < atual.length ? (atual[i] ?? null) : null))
    );
  }, [questoes.length]);

  // A foto da aula e o que a IA le para criar mais questoes. Aula de exemplo
  // nao tem foto, e por isso nao oferece o botao.
  const fotoDaAula = aula?.paginas.map((p) => p.fotoUri).find((uri) => uri !== null) ?? null;

  const gerarMais = async (quantidade: number) => {
    if (gerando !== null || fotoDaAula === null) return;
    setGerando(quantidade);
    setAviso(null);
    try {
      const b64 = await prepararImagem(fotoDaAula, PX.transcricao, PX.transcricao, PX.transcricao);
      const r = await gerarEstudo(b64, subModo, quantidade, false);
      if (r.estado === 'ok') {
        const novas = r.dados.questoes.filter(
          (nova) => !questoes.some((q) => q.q === nova.q)
        );
        console.log(
          `[JOVI Flow] ${quantidade} questoes pedidas em ${r.ms}ms: ${r.dados.questoes.length} vieram, ${novas.length} novas`
        );
        if (novas.length === 0) {
          setAviso('A IA não achou pergunta nova nesta foto.');
        } else if (aula !== null) {
          adicionarQuestoes(aula.id, novas);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        console.log('[JOVI Flow] questoes novas indisponiveis:', r.estado);
        setAviso(
          r.estado === 'sem-chave'
            ? 'Ligue a Análise por IA em Ajustes para gerar mais questões.'
            : 'Não deu para gerar agora. Tente de novo.'
        );
      }
    } finally {
      setGerando(null);
    }
  };

  const responder = (indiceQuestao: number, indiceAlternativa: number) => {
    if (respostas[indiceQuestao] !== null) return;

    const questao = questoes[indiceQuestao];
    if (!questao) return;

    const acertou = indiceAlternativa === questao.certa;
    void Haptics.notificationAsync(
      acertou
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    );

    setRespostas((atual) =>
      atual.map((r, i) => (i === indiceQuestao ? indiceAlternativa : r))
    );
  };

  const respondidas = respostas.filter((r) => r !== null).length;
  const acertos = respostas.reduce<number>((total, resposta, i) => {
    const questao = questoes[i];
    if (questao && resposta === questao.certa) return total + 1;
    return total;
  }, 0);
  const terminou = respondidas === questoes.length;

  return (
    <View style={styles.tela}>
      <ScreenHeader
        title="Questões"
        onBack={() => navigation.goBack()}
        right={
          <Text style={styles.contador}>
            {respondidas}/{questoes.length}
          </Text>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing(8) }]}
      >
        {questoes.map((questao, indiceQuestao) => {
          const escolhida = respostas[indiceQuestao] ?? null;
          const respondida = escolhida !== null;

          return (
            <View key={questao.q} style={styles.bloco}>
              <Text style={styles.numero}>QUESTÃO {indiceQuestao + 1}</Text>
              <Text style={styles.enunciado}>{questao.q}</Text>

              {questao.alt.map((alternativa, indiceAlternativa) => {
                const ehCerta = indiceAlternativa === questao.certa;
                const ehEscolhida = indiceAlternativa === escolhida;
                // Depois de responder, a certa sempre se revela, mesmo que o
                // usuario tenha errado.
                const marcarCerta = respondida && ehCerta;
                const marcarErrada = respondida && ehEscolhida && !ehCerta;

                return (
                  <Pressable
                    key={alternativa}
                    onPress={() => responder(indiceQuestao, indiceAlternativa)}
                    disabled={respondida}
                    accessibilityRole="button"
                    accessibilityLabel={alternativa}
                    accessibilityState={{ disabled: respondida, selected: ehEscolhida }}
                    style={({ pressed }) => [
                      styles.alternativa,
                      marcarCerta && styles.alternativaCerta,
                      marcarErrada && styles.alternativaErrada,
                      pressed && !respondida && styles.alternativaPressionada,
                    ]}
                  >
                    <Text
                      style={[
                        styles.textoAlternativa,
                        marcarCerta && styles.textoCerta,
                        marcarErrada && styles.textoErrada,
                      ]}
                    >
                      {alternativa}
                    </Text>

                    {marcarCerta ? (
                      <MaterialCommunityIcons name="check" size={18} color={colors.primaryHi} />
                    ) : null}
                    {marcarErrada ? (
                      <MaterialCommunityIcons name="close" size={18} color={colors.danger} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          );
        })}

        {/* A IA le a mesma foto de novo e escreve a quantidade pedida. */}
        {fotoDaAula !== null ? (
          <View style={styles.gerador}>
            <Text style={styles.tituloGerador}>Gerar mais questões desta foto</Text>
            <View style={styles.quantidades}>
              {QUANTIDADES.map((quantidade) => (
                <Pressable
                  key={quantidade}
                  onPress={() => void gerarMais(quantidade)}
                  disabled={gerando !== null}
                  accessibilityRole="button"
                  accessibilityLabel={`Gerar ${quantidade} questões novas desta foto`}
                  accessibilityState={{ disabled: gerando !== null, busy: gerando === quantidade }}
                  style={({ pressed }) => [
                    styles.quantidade,
                    gerando === quantidade && styles.quantidadeAtiva,
                    pressed && styles.alternativaPressionada,
                  ]}
                >
                  {gerando === quantidade ? (
                    <ActivityIndicator size="small" color={colors.primaryHi} />
                  ) : (
                    <Text style={styles.textoQuantidade}>{quantidade}</Text>
                  )}
                </Pressable>
              ))}
            </View>
            <Text style={styles.notaGerador}>
              {gerando !== null
                ? 'Lendo a foto de novo…'
                : (aviso ??
                  (modoAoVivo
                    ? 'As questões saem do que está na sua foto, e entram no fim da lista.'
                    : 'Precisa da Análise por IA ligada em Ajustes.'))}
            </Text>
          </View>
        ) : null}

        {terminou ? (
          <View style={styles.placar}>
            <Text style={styles.placarValor}>
              {acertos}/{questoes.length}
            </Text>
            <Text style={styles.placarTexto}>
              Você acertou {acertos} de {questoes.length}
            </Text>
            <PrimaryButton
              label="Tentar novamente"
              onPress={() => setRespostas(questoes.map(() => null))}
              style={styles.botaoPlacar}
            />
          </View>
        ) : null}
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
  contador: {
    ...fontDado.valor,
    fontSize: 15,
    color: colors.textDim,
  },
  bloco: {
    marginBottom: spacing(8),
  },
  gerador: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: spacing(5),
    marginBottom: spacing(6),
    gap: spacing(3),
  },
  tituloGerador: {
    ...font.h3,
    color: colors.text,
  },
  quantidades: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  quantidade: {
    minWidth: TOQUE_MIN + spacing(3),
    minHeight: TOQUE_MIN,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(4),
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  quantidadeAtiva: {
    backgroundColor: colors.primarySoft,
  },
  textoQuantidade: {
    ...fontDado.valor,
    fontSize: 17,
    color: colors.text,
  },
  notaGerador: {
    ...font.small,
    color: colors.textDim,
    lineHeight: 17,
  },
  numero: {
    ...fontDado.rotulo,
    color: colors.textFaint,
    marginBottom: spacing(2),
  },
  enunciado: {
    ...font.h3,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing(4),
  },
  alternativa: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
    minHeight: TOQUE_MIN + spacing(1),
    paddingHorizontal: spacing(4),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing(2.5),
  },
  alternativaCerta: {
    borderColor: colors.primaryEdge,
    backgroundColor: colors.primarySoft,
  },
  alternativaErrada: {
    borderColor: colors.danger,
  },
  alternativaPressionada: {
    backgroundColor: colors.surfaceAlt,
  },
  textoAlternativa: {
    ...font.body,
    color: colors.text,
    flexShrink: 1,
  },
  textoCerta: {
    color: colors.primaryHi,
    fontWeight: '600',
  },
  textoErrada: {
    color: colors.danger,
  },

  placar: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: spacing(7),
  },
  placarValor: {
    ...fontDado.valorGrande,
    fontSize: 40,
    color: colors.primaryHi,
  },
  placarTexto: {
    ...font.body,
    color: colors.textDim,
    marginTop: spacing(2),
    marginBottom: spacing(6),
  },
  botaoPlacar: {
    alignSelf: 'stretch',
  },
});
