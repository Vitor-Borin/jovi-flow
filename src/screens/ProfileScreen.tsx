import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '../components/ScreenHeader';
import type { NomeIcone } from '../data/mock';
import { TOQUE_MIN, colors, font, fontDado, radius, spacing } from '../theme';

const NOME = 'Vitor Mazer';
const CURSO = 'Engenharia de Software — FIAP';

const ITENS: { id: string; titulo: string; icone: NomeIcone }[] = [
  { id: 'grade', titulo: 'Grade horária', icone: 'calendar-month-outline' },
  { id: 'plataformas', titulo: 'Plataformas conectadas', icone: 'link-variant' },
  { id: 'preferencias', titulo: 'Preferências do Modo Aula', icone: 'camera-outline' },
  { id: 'sobre', titulo: 'Sobre', icone: 'information-outline' },
];

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.charAt(0) ?? '';
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.charAt(0) ?? '') : '';
  return (primeira + ultima).toUpperCase();
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();

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
  tituloItem: {
    ...font.body,
    color: colors.text,
    flex: 1,
  },

  versao: {
    ...fontDado.rotulo,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing(10),
  },
});
