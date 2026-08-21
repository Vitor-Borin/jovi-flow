import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '../components/Card';
import { GhostButton } from '../components/GhostButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { conteudoIdentificado, resumoIA } from '../data/mock';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import type { RootStackParamList } from '../navigation/types';
import { useFlow } from '../store/FlowContext';
import { colors, font, fontDado, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

const MS_ENTRE_BULLETS = 150;

export function SummaryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const reduzir = useReduzirMovimento();
  const { salvarResumo, classificacao, transcricao } = useFlow();
  const conteudo = classificacao ?? conteudoIdentificado;
  // Se a transcricao real trouxe resumo proprio, ele vence o simulado.
  const bullets =
    transcricao !== null && transcricao.resumo.length > 0 ? transcricao.resumo : resumoIA;
  const [aviso, setAviso] = useState<string | null>(null);

  // Um valor por bullet: a revelacao em cascata simula a geracao sem chamar API.
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

  const compartilhar = async () => {
    try {
      await Share.share({
        message: `Resumo — ${conteudo.tema}\n\n${bullets.map((b) => `• ${b}`).join('\n\n')}`,
      });
    } catch {
      // O usuario fechou a folha de compartilhamento.
    }
  };

  const aoSalvar = () => {
    salvarResumo();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  return (
    <View style={styles.tela}>
      <ScreenHeader title="Resumo" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={styles.titulo}>Resumo gerado com IA</Text>
        <Text style={styles.subtitulo}>{conteudo.tema}</Text>

        <Card style={styles.cartao}>
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
        </Card>
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
        <PrimaryButton label="Salvar resumo" onPress={aoSalvar} style={styles.botaoLado} />
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
    ...fontDado.rotulo,
    color: colors.primaryHi,
    marginTop: spacing(2),
    marginBottom: spacing(6),
  },
  cartao: {
    paddingVertical: spacing(5),
  },
  linha: {
    flexDirection: 'row',
    marginBottom: spacing(4),
  },
  marcador: {
    width: spacing(1.5),
    height: spacing(1.5),
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    marginTop: spacing(2),
    marginRight: spacing(3),
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
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4),
    marginBottom: spacing(2),
  },
  avisoTexto: {
    ...font.small,
    color: colors.text,
  },

  rodape: {
    flexDirection: 'row',
    gap: spacing(3),
    paddingHorizontal: spacing(5),
    paddingTop: spacing(4),
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  botaoLado: {
    flex: 1,
    width: undefined,
  },
});
