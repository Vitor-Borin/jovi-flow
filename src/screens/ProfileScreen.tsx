import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GhostButton } from '../components/GhostButton';
import { ScreenHeader } from '../components/ScreenHeader';
import type { NomeIcone } from '../data/mock';
import type { RootStackParamList } from '../navigation/types';
import { useFlow } from '../store/FlowContext';
import { TOQUE_MIN, colors, font, fontDado, radius, spacing } from '../theme';

const NOME = 'Vitor Mazer';
const CURSO = 'Engenharia de Software — FIAP';

const ITENS: { id: string; titulo: string; icone: NomeIcone }[] = [
  { id: 'grade', titulo: 'Grade horária', icone: 'calendar-month-outline' },
  { id: 'plataformas', titulo: 'Plataformas conectadas', icone: 'link-variant' },
  { id: 'preferencias', titulo: 'Preferências do Modo Aula', icone: 'camera-outline' },
];

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.charAt(0) ?? '';
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.charAt(0) ?? '') : '';
  return (primeira + ultima).toUpperCase();
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { reiniciar } = useFlow();
  const [reiniciado, setReiniciado] = useState(false);

  const aoReiniciar = () => {
    reiniciar();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setReiniciado(true);
  };

  return (
    <View style={styles.tela}>
      <ScreenHeader title="Perfil" />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing(6) }]}
      >
        <View style={styles.cabecalho}>
          <View style={styles.avatar}>
            <Text style={styles.iniciais}>{iniciais(NOME)}</Text>
          </View>
          <Text style={styles.nome}>{NOME}</Text>
          <Text style={styles.curso}>{CURSO}</Text>
        </View>

        <View style={styles.lista}>
          {ITENS.map((item) => (
            <View key={item.id} style={styles.item}>
              <MaterialCommunityIcons name={item.icone} size={20} color={colors.textDim} />
              <Text style={styles.tituloItem}>{item.titulo}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </View>
          ))}

          {/* Unico item navegavel da lista: sustenta o entregavel de viabilidade
              tecnica pedido no brief da JOVI. */}
          <Pressable
            onPress={() => navigation.navigate('Feasibility')}
            accessibilityRole="button"
            accessibilityLabel="Viabilidade técnica: as APIs que sustentam o Flow"
            style={({ pressed }) => [styles.item, pressed && styles.itemPressionado]}
          >
            <MaterialCommunityIcons
              name="api"
              size={20}
              color={colors.primaryHi}
            />
            <Text style={[styles.tituloItem, styles.tituloItemAtivo]}>Viabilidade técnica</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primaryHi} />
          </Pressable>
        </View>

        {/* Existe para o fluxo poder ser refeito varias vezes durante o pitch
            sem precisar fechar e reabrir o app. */}
        <View style={styles.blocoDemo}>
          <Text style={styles.rotuloDemo}>Demonstração</Text>
          <GhostButton
            label={reiniciado ? 'Demonstração reiniciada' : 'Reiniciar demonstração'}
            variant="outline"
            onPress={aoReiniciar}
          />
          <Text style={styles.explicacaoDemo}>
            Limpa a foto capturada, o destino escolhido e o resumo salvo, deixando o app pronto
            para outra apresentação.
          </Text>
        </View>

        <Text style={styles.versao}>JOVI Flow · protótipo</Text>
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
  cabecalho: {
    alignItems: 'center',
    paddingVertical: spacing(8),
  },
  avatar: {
    width: spacing(20),
    height: spacing(20),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primaryEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciais: {
    ...font.h1,
    color: colors.primaryHi,
  },
  nome: {
    ...font.h2,
    color: colors.text,
    marginTop: spacing(4),
  },
  curso: {
    ...font.small,
    color: colors.textDim,
    marginTop: spacing(1.5),
  },

  lista: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    minHeight: TOQUE_MIN + spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  itemPressionado: {
    opacity: 0.6,
  },
  tituloItem: {
    ...font.body,
    color: colors.text,
    flex: 1,
  },
  tituloItemAtivo: {
    color: colors.primaryHi,
  },

  blocoDemo: {
    marginTop: spacing(9),
  },
  rotuloDemo: {
    ...fontDado.rotulo,
    color: colors.textDim,
    marginBottom: spacing(3),
  },
  explicacaoDemo: {
    ...font.small,
    color: colors.textFaint,
    marginTop: spacing(3),
    lineHeight: 17,
  },
  versao: {
    ...fontDado.rotulo,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing(10),
  },
});
