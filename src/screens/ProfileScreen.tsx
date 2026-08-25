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
import { temChaveConfigurada } from '../services/analiseAoVivo';
import { useFlow } from '../store/FlowContext';
import { TOQUE_MIN, colors, font, fontDado, radius, spacing } from '../theme';

const NOME = 'Vitor Mazer';
const CURSO = 'Engenharia de Software · FIAP';

const ITENS: { id: string; titulo: string; icone: NomeIcone }[] = [
  { id: 'grade', titulo: 'Grade horária', icone: 'calendar-month-outline' },
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
  const { reiniciar, modoAoVivo, alternarModoAoVivo } = useFlow();
  const chaveOk = temChaveConfigurada();
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

          <Pressable
            onPress={() => navigation.navigate('Platforms')}
            accessibilityRole="button"
            accessibilityLabel="Plataformas conectadas"
            style={({ pressed }) => [styles.item, pressed && styles.itemPressionado]}
          >
            <MaterialCommunityIcons name="link-variant" size={20} color={colors.primaryHi} />
            <Text style={[styles.tituloItem, styles.tituloItemAtivo]}>Plataformas conectadas</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primaryHi} />
          </Pressable>

          {/* Sustenta o entregavel de viabilidade tecnica pedido no brief. */}
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

        {/* O unico ponto do app que toca a rede. Desligado, tudo roda offline. */}
        <View style={styles.blocoDemo}>
          <Text style={styles.rotuloDemo}>Análise ao vivo</Text>

          <Pressable
            onPress={chaveOk ? alternarModoAoVivo : undefined}
            disabled={!chaveOk}
            accessibilityRole="switch"
            accessibilityLabel="Analisar a foto com IA de verdade"
            accessibilityState={{ checked: modoAoVivo, disabled: !chaveOk }}
            style={({ pressed }) => [
              styles.linhaAoVivo,
              modoAoVivo && styles.linhaAoVivoLigada,
              !chaveOk && styles.linhaAoVivoBloqueada,
              pressed && chaveOk && styles.itemPressionado,
            ]}
          >
            <MaterialCommunityIcons
              name={modoAoVivo ? 'access-point' : 'access-point-off'}
              size={20}
              color={modoAoVivo ? colors.primaryHi : colors.textFaint}
            />
            <Text style={[styles.tituloItem, modoAoVivo && styles.tituloItemAtivo]}>
              {modoAoVivo ? 'Ligada' : 'Desligada'}
            </Text>
            <View style={[styles.trilho, modoAoVivo && styles.trilhoLigado]}>
              <View style={[styles.botaoTrilho, modoAoVivo && styles.botaoTrilhoLigado]} />
            </View>
          </Pressable>

          <Text style={styles.explicacaoDemo}>
            {chaveOk
              ? modoAoVivo
                ? 'A foto capturada é lida de verdade por IA. Se a rede falhar ou demorar mais que 8 segundos, o app usa o conteúdo de exemplo sem interromper a demonstração.'
                : 'Desligada, o aplicativo funciona inteiramente offline, com o conteúdo de exemplo.'
              : 'Nenhuma chave configurada. Defina EXPO_PUBLIC_ANTHROPIC_API_KEY no arquivo .env e reinicie o servidor para habilitar.'}
          </Text>
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
  linhaAoVivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    minHeight: TOQUE_MIN + spacing(2),
    paddingHorizontal: spacing(4),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  linhaAoVivoLigada: {
    borderColor: colors.primaryEdge,
    backgroundColor: colors.primarySoft,
  },
  linhaAoVivoBloqueada: {
    opacity: 0.5,
  },
  trilho: {
    width: spacing(11),
    height: spacing(6),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHi,
    padding: spacing(0.75),
    justifyContent: 'center',
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
