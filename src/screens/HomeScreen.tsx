import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { biblioteca, slotAtual } from '../data/mock';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import type { RootStackParamList } from '../navigation/types';
import { TOQUE_MIN, colors, font, fontDado, radius, shadow, spacing } from '../theme';

const ESTATISTICAS = [
  { valor: '12', label: 'Aulas capturadas' },
  { valor: '4', label: 'Matérias' },
  { valor: '38', label: 'Flashcards' },
];

function saudacao(hora: number): string {
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const reduzir = useReduzirMovimento();

  const { slot, aoVivo, ola } = useMemo(() => {
    const agora = new Date();
    const r = slotAtual(agora);
    return { slot: r.slot, aoVivo: r.aoVivo, ola: saudacao(agora.getHours()) };
  }, []);

  const recentes = useMemo(
    () =>
      biblioteca
        .flatMap((pasta) =>
          pasta.subpastas.flatMap((sub) =>
            sub.aulas.map((aula) => ({ ...aula, materia: pasta.nome, icone: pasta.icone }))
          )
        )
        .slice(0, 3),
    []
  );

  return (
    <View style={styles.tela}>
      <ScreenHeader
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notificações"
            style={styles.botaoTopo}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textDim} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing(8) }]}
      >
        <Text style={styles.saudacao}>{ola}, Vitor</Text>
        <Text style={styles.subtitulo}>Pronto para capturar sua próxima aula?</Text>

        {/* [D2] A grade horaria da contexto ao app inteiro, nao so a captura. */}
        <Card style={[styles.cardAula, aoVivo && styles.cardAulaAoVivo]}>
          <View style={styles.linhaTopoAula}>
            <Text style={styles.rotuloAula}>
              {aoVivo ? 'VOCÊ ESTÁ EM AULA' : 'SUA PRÓXIMA AULA'}
            </Text>
            {aoVivo ? <PontoAoVivo reduzir={reduzir} /> : null}
          </View>

          <Text style={styles.disciplina}>{slot.disciplina}</Text>

          <View style={styles.metaAula}>
            <View style={styles.itemMeta}>
              <MaterialCommunityIcons name="clock-outline" size={15} color={colors.textDim} />
              <Text style={styles.textoMeta}>
                {slot.inicio} — {slot.fim}
              </Text>
            </View>
            <View style={styles.itemMeta}>
              <MaterialCommunityIcons name="map-marker-outline" size={15} color={colors.textDim} />
              <Text style={styles.textoMeta}>Sala {slot.sala}</Text>
            </View>
          </View>
        </Card>

        {/* Acao principal do app: precisa dominar a tela. */}
        <PrimaryButton
          label="Abrir Modo Aula"
          icon="camera"
          onPress={() => navigation.navigate('Camera')}
          style={styles.botaoPrincipal}
        />
        <Text style={styles.legendaBotao}>
          A câmera reconhece a lousa e organiza sozinha
        </Text>

        <Text style={styles.tituloSecao}>Continue de onde parou</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carrossel}
        >
          {recentes.map((aula) => (
            <Card
              key={aula.id}
              onPress={() => navigation.navigate('Tabs', { screen: 'Estudos' })}
              accessibilityLabel={`Abrir ${aula.titulo}`}
              style={styles.cardRecente}
            >
              <MaterialCommunityIcons name={aula.icone} size={20} color={colors.primaryHi} />
              <Text style={styles.tituloRecente} numberOfLines={2}>
                {aula.titulo}
              </Text>
              <Text style={styles.metaRecente} numberOfLines={1}>
                {aula.data}
              </Text>
            </Card>
          ))}
        </ScrollView>

        <View style={styles.faixaStats}>
          {ESTATISTICAS.map((stat, indice) => (
            <View key={stat.label} style={styles.blocoStat}>
              {indice > 0 ? <View style={styles.divisorStat} /> : null}
              <View style={styles.miolodStat}>
                <Text style={styles.valorStat}>{stat.valor}</Text>
                <Text style={styles.rotuloStat} numberOfLines={2}>
                  {stat.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function PontoAoVivo({ reduzir }: { reduzir: boolean }) {
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduzir) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduzir, pulso]);

  const opacidade = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] });

  return (
    <Animated.View style={{ opacity: opacidade }}>
      <Badge label="AGORA" variant="solid" dot />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  botaoTopo: {
    width: TOQUE_MIN,
    height: TOQUE_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conteudo: {
    paddingHorizontal: spacing(5),
  },
  saudacao: {
    ...font.h1,
    color: colors.text,
  },
  subtitulo: {
    ...font.body,
    color: colors.textDim,
    marginTop: spacing(2),
    marginBottom: spacing(6),
  },

  cardAula: {
    paddingVertical: spacing(5),
  },
  cardAulaAoVivo: {
    borderColor: colors.primaryEdge,
    backgroundColor: colors.primarySoft,
  },
  linhaTopoAula: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rotuloAula: {
    ...fontDado.rotulo,
    color: colors.primaryHi,
    flexShrink: 1,
  },
  disciplina: {
    ...font.h2,
    color: colors.text,
    marginTop: spacing(3),
  },
  metaAula: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(4),
    marginTop: spacing(3),
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
  },
  textoMeta: {
    ...font.small,
    color: colors.textDim,
  },

  botaoPrincipal: {
    marginTop: spacing(6),
    ...shadow.glow,
  },
  legendaBotao: {
    ...font.small,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing(3),
  },

  tituloSecao: {
    ...fontDado.rotulo,
    color: colors.textDim,
    marginTop: spacing(9),
    marginBottom: spacing(3),
  },
  carrossel: {
    gap: spacing(3),
    paddingRight: spacing(5),
  },
  cardRecente: {
    width: spacing(38),
    gap: spacing(2),
  },
  tituloRecente: {
    ...font.bodyMed,
    color: colors.text,
  },
  metaRecente: {
    ...font.small,
    color: colors.textFaint,
  },

  faixaStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing(5),
    marginTop: spacing(9),
  },
  blocoStat: {
    flex: 1,
    flexDirection: 'row',
  },
  divisorStat: {
    width: 1,
    backgroundColor: colors.borderSoft,
  },
  miolodStat: {
    flex: 1,
    alignItems: 'center',
  },
  valorStat: {
    ...fontDado.valorGrande,
    color: colors.text,
  },
  rotuloStat: {
    ...font.small,
    color: colors.textDim,
    marginTop: spacing(1),
    textAlign: 'center',
  },
});
