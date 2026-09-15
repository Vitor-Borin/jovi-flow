import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoOuvir } from '../components/BotaoOuvir';
import { GhostButton } from '../components/GhostButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { useLeitura } from '../hooks/useLeitura';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import type { RootStackParamList } from '../navigation/types';
import { useAcervo } from '../store/AcervoContext';
import { colors, font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

const MS_ENTRE_BULLETS = 150;

export function SummaryScreen({ navigation, route }: Props) {
  const { aulaId } = route.params;
  const insets = useSafeAreaInsets();
  const reduzir = useReduzirMovimento();
  const { aulaPorId, marcarResumoSalvo } = useAcervo();
  const { falando, alternar } = useLeitura();
  const [aviso, setAviso] = useState<string | null>(null);

  const aula = aulaPorId(aulaId);
  const bullets = aula?.resumo ?? [];

  // Um valor por bullet: a revelacao em cascata da o ritmo de leitura.
  const valores = useRef(bullets.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (reduzir) {
      valores.forEach((v) => v.setValue(1));
      return;
    }
    const cascata = Animated.stagger(
      MS_ENTRE_BULLETS,
      valores.map((v) => Animated.timing(v, { toValue: 1, duration: 260, useNativeDriver: true }))
    );
    cascata.start();
    return () => cascata.stop();
  }, [reduzir, valores]);

  useEffect(() => {
    if (aviso === null) return;
    const timer = setTimeout(() => setAviso(null), 2200);
    return () => clearTimeout(timer);
  }, [aviso]);

  useEffect(() => {
    if (aula === null) navigation.goBack();
  }, [aula, navigation]);

  if (aula === null) return <View style={styles.tela} />;

  const compartilhar = async () => {
    try {
      await Share.share({
        message: `Resumo: ${aula.titulo}\n\n${bullets.map((b) => `• ${b}`).join('\n\n')}`,
      });
    } catch {
      // O usuario fechou a folha de compartilhamento.
    }
  };

  const aoSalvar = () => {
    marcarResumoSalvo(aulaId);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  return (
    <View style={styles.tela}>
      <ScreenHeader title="Resumo" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={styles.titulo}>{aula.tema}</Text>
        <Text style={styles.subtitulo}>{aula.topico}</Text>

        <View style={styles.linhaOuvir}>
          <BotaoOuvir
            falando={falando}
            onPress={() => alternar(bullets.join('. '))}
            rotulo="Ouvir o resumo"
          />
          {aula.aoVivo ? <Text style={styles.origem}>Lido da sua foto</Text> : null}
        </View>

        <View style={styles.cartao}>
          {bullets.map((bullet, indice) => {
            const valor = valores[indice];
            if (!valor) return null;
            const subida = valor.interpolate({ inputRange: [0, 1], outputRange: [spacing(2), 0] });
            return (
              <Animated.View
                key={bullet}
                style={[styles.linha, { opacity: valor, transform: [{ translateY: subida }] }]}
              >
                <View style={styles.marcador} />
                <Text style={styles.textoBullet}>{bullet}</Text>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {aviso !== null ? (
        <View style={styles.aviso}>
          <MaterialCommunityIcons name="check-circle" size={16} color={colors.primaryHi} />
          <Text style={styles.avisoTexto}>{aviso}</Text>
        </View>
      ) : null}

      <View style={[styles.rodape, { paddingBottom: insets.bottom + spacing(4) }]}>
        <GhostButton
          label="Compartilhar"
          variant="outline"
          onPress={() => {
            setAviso('Abrindo opções de envio');
            void compartilhar();
          }}
          style={styles.botaoLado}
        />
        <PrimaryButton
          label={aula.resumoSalvo ? 'Resumo salvo' : 'Salvar resumo'}
          onPress={aoSalvar}
          style={styles.botaoLado}
        />
      </View>
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
    paddingBottom: spacing(6),
  },
  titulo: {
    ...font.h1,
    color: colors.text,
    marginTop: spacing(2),
  },
  subtitulo: {
    ...font.body,
    color: colors.textDim,
    marginTop: spacing(1.5),
  },
  linhaOuvir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    marginTop: spacing(4),
  },
  origem: {
    ...font.small,
    color: colors.textFaint,
  },
  cartao: {
    marginTop: spacing(5),
    padding: spacing(4),
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(3),
    marginBottom: spacing(3.5),
  },
  marcador: {
    width: spacing(1.5),
    height: spacing(1.5),
    borderRadius: radius.pill,
    backgroundColor: colors.primaryHi,
    marginTop: spacing(2),
  },
  textoBullet: {
    ...font.body,
    color: colors.text,
    lineHeight: 21,
    flex: 1,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    alignSelf: 'center',
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing(3),
  },
  avisoTexto: {
    ...font.small,
    color: colors.text,
  },
  rodape: {
    flexDirection: 'row',
    gap: spacing(3),
    paddingHorizontal: spacing(5),
    paddingTop: spacing(3),
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  botaoLado: {
    flex: 1,
  },
});
