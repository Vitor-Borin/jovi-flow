import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { ordenarAulas } from '../data/acervo';
import type { Flashcard, NomeIcone } from '../data/mock';
import { flashcards as flashcardsExemplo } from '../data/mock';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import type { MainTabParamList } from '../navigation/types';
import { useAcervo } from '../store/AcervoContext';
import { TOQUE_MIN, colors, font, fontDado, radius, shadow, spacing } from '../theme';

type Avaliacao = 'nao' | 'dificil' | 'facil';

const BOTOES: { id: Avaliacao; label: string; icone: NomeIcone; cor: string }[] = [
  { id: 'nao', label: 'Não lembrei', icone: 'close', cor: colors.danger },
  { id: 'dificil', label: 'Difícil', icone: 'refresh', cor: colors.warn },
  { id: 'facil', label: 'Fácil', icone: 'check', cor: colors.primary },
];

type Props = BottomTabScreenProps<MainTabParamList, 'Revisao'>;

/** Os cartoes sao da aula pedida na rota ou, sem rota, da aula mais recente
 *  do acervo. O exemplo so entra se nao houver aula nenhuma. */
export function ReviewScreen({ route }: Props) {
  const { acervo, aulaPorId } = useAcervo();
  const pedida = route.params?.aulaId ? aulaPorId(route.params.aulaId) : null;
  const aula = pedida ?? ordenarAulas(acervo.aulas)[0] ?? null;
  const flashcards =
    aula !== null && aula.flashcards.length > 0 ? aula.flashcards : flashcardsExemplo;

  // A chave reinicia a revisao quando a aula muda.
  return <Revisao key={aula?.id ?? 'exemplo'} flashcards={flashcards} titulo={aula?.titulo ?? null} />;
}

function Revisao({ flashcards, titulo }: { flashcards: Flashcard[]; titulo: string | null }) {
  const insets = useSafeAreaInsets();
  const reduzir = useReduzirMovimento();

  const [indice, setIndice] = useState(0);
  const [virado, setVirado] = useState(false);
  const [placar, setPlacar] = useState<Record<Avaliacao, number>>({
    nao: 0,
    dificil: 0,
    facil: 0,
  });

  const giro = useRef(new Animated.Value(0)).current;
  const terminou = indice >= flashcards.length;
  const carta = flashcards[indice];

  useEffect(() => {
    const alvo = virado ? 1 : 0;
    if (reduzir) {
      giro.setValue(alvo);
      return;
    }
    const anim = Animated.spring(giro, {
      toValue: alvo,
      damping: 16,
      stiffness: 120,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [virado, reduzir, giro]);

  const avaliar = (id: Avaliacao) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlacar((p) => ({ ...p, [id]: p[id] + 1 }));
    setVirado(false);
    giro.setValue(0);
    setIndice((i) => i + 1);
  };

  const reiniciarRevisao = () => {
    setPlacar({ nao: 0, dificil: 0, facil: 0 });
    setVirado(false);
    giro.setValue(0);
    setIndice(0);
  };

  const frente = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const verso = giro.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const progresso = indice / flashcards.length;

  if (terminou) {
    return (
      <View style={styles.tela}>
        <ScreenHeader title="Revisão" />
        {titulo ? (
          <Text style={styles.subtituloAula} numberOfLines={1}>
            {titulo}
          </Text>
        ) : null}
        <View style={styles.conclusao}>
          <MaterialCommunityIcons name="trophy-outline" size={56} color={colors.primary} />
          <Text style={styles.tituloConclusao}>Revisão concluída</Text>
          <Text style={styles.subtituloConclusao}>
            Você revisou {flashcards.length} cartões.
          </Text>

          <View style={styles.faixaPlacar}>
            {BOTOES.map((b, i) => (
              <View key={b.id} style={styles.blocoPlacar}>
                {i > 0 ? <View style={styles.divisorPlacar} /> : null}
                <View style={styles.miolodPlacar}>
                  <Text style={[styles.valorPlacar, { color: b.cor }]}>{placar[b.id]}</Text>
                  <Text style={styles.rotuloPlacar}>{b.label}</Text>
                </View>
              </View>
            ))}
          </View>

          <PrimaryButton
            label="Revisar novamente"
            onPress={reiniciarRevisao}
            style={styles.botaoConclusao}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tela}>
      <ScreenHeader
        title="Revisão"
        right={
          <Text style={styles.contador}>
            {indice + 1}/{flashcards.length}
          </Text>
        }
      />
      {titulo ? (
        <Text style={styles.subtituloAula} numberOfLines={1}>
          {titulo}
        </Text>
      ) : null}

      <View style={styles.areaCarta}>
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            setVirado((v) => !v);
          }}
          accessibilityRole="button"
          accessibilityLabel={
            virado ? `Resposta: ${carta?.r ?? ''}` : `Pergunta: ${carta?.p ?? ''}. Toque para ver a resposta.`
          }
          style={styles.alvoCarta}
        >
          {/* As duas faces ficam sobrepostas com backfaceVisibility oculto: em
              nenhum quadro da virada as duas aparecem ao mesmo tempo. */}
          <Animated.View
            style={[
              styles.face,
              { transform: [{ perspective: 1200 }, { rotateY: frente }] },
            ]}
          >
            <Text style={styles.rotuloFace}>PERGUNTA</Text>
            <Text style={styles.textoPergunta}>{carta?.p}</Text>
            <Text style={styles.dica}>Toque para ver a resposta</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.face,
              styles.faceVerso,
              { transform: [{ perspective: 1200 }, { rotateY: verso }] },
            ]}
          >
            <Text style={styles.rotuloFaceVerso}>RESPOSTA</Text>
            <Text style={styles.textoResposta}>{carta?.r}</Text>
          </Animated.View>
        </Pressable>
      </View>

      <View style={[styles.rodape, { paddingBottom: insets.bottom + spacing(3) }]}>
        <View style={styles.botoes}>
          {BOTOES.map((b) => (
            <Pressable
              key={b.id}
              onPress={() => avaliar(b.id)}
              accessibilityRole="button"
              accessibilityLabel={b.label}
              style={({ pressed }) => [
                styles.botaoAvaliar,
                { borderColor: b.cor },
                pressed && styles.botaoPressionado,
              ]}
            >
              <MaterialCommunityIcons name={b.icone} size={20} color={b.cor} />
              <Text style={[styles.rotuloBotao, { color: b.cor }]} numberOfLines={1}>
                {b.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.trilhaProgresso}>
          <View style={[styles.preenchimento, { width: `${progresso * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contador: {
    ...fontDado.valor,
    fontSize: 15,
    color: colors.textDim,
  },
  subtituloAula: {
    ...font.small,
    color: colors.textFaint,
    textAlign: 'center',
    paddingHorizontal: spacing(5),
  },

  areaCarta: {
    flex: 1,
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(4),
  },
  alvoCarta: {
    flex: 1,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing(6),
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  faceVerso: {
    backgroundColor: colors.surfaceAlt,
  },
  rotuloFace: {
    ...fontDado.rotulo,
    color: colors.textFaint,
    marginBottom: spacing(5),
  },
  rotuloFaceVerso: {
    ...fontDado.rotulo,
    color: colors.primaryHi,
    marginBottom: spacing(5),
  },
  textoPergunta: {
    ...font.h2,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 28,
  },
  textoResposta: {
    ...font.body,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  dica: {
    ...font.small,
    color: colors.textFaint,
    marginTop: spacing(8),
  },

  rodape: {
    paddingHorizontal: spacing(5),
  },
  botoes: {
    flexDirection: 'row',
    gap: spacing(2.5),
    marginBottom: spacing(4),
  },
  botaoAvaliar: {
    flex: 1,
    minHeight: TOQUE_MIN + spacing(3),
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1),
    paddingHorizontal: spacing(1),
  },
  botaoPressionado: {
    opacity: 0.6,
  },
  rotuloBotao: {
    ...font.tiny,
  },
  trilhaProgresso: {
    height: spacing(1),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHi,
    overflow: 'hidden',
  },
  preenchimento: {
    height: '100%',
    backgroundColor: colors.primary,
  },

  conclusao: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(6),
  },
  tituloConclusao: {
    ...font.h1,
    color: colors.text,
    marginTop: spacing(5),
  },
  subtituloConclusao: {
    ...font.body,
    color: colors.textDim,
    marginTop: spacing(2),
  },
  faixaPlacar: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing(5),
    marginTop: spacing(8),
  },
  blocoPlacar: {
    flex: 1,
    flexDirection: 'row',
  },
  divisorPlacar: {
    width: 1,
    backgroundColor: colors.borderSoft,
  },
  miolodPlacar: {
    flex: 1,
    alignItems: 'center',
  },
  valorPlacar: {
    ...fontDado.valorGrande,
  },
  rotuloPlacar: {
    ...font.small,
    color: colors.textDim,
    marginTop: spacing(1),
    textAlign: 'center',
  },
  botaoConclusao: {
    marginTop: spacing(8),
  },
});
