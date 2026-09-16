import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GhostButton } from '../components/GhostButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { gradeHoraria } from '../data/mock';
import type { RootStackParamList } from '../navigation/types';
import type { Verificacao } from '../services/analiseAoVivo';
import { verificarChave } from '../services/analiseAoVivo';
import { useAcervo } from '../store/AcervoContext';
import { useFlow } from '../store/FlowContext';
import { TOQUE_MIN, colors, font, fontDado, fontMono, radius, spacing } from '../theme';

const TEXTO_VERIFICACAO: Record<Verificacao, string> = {
  valida: 'A Anthropic aceitou a chave. A análise está pronta.',
  recusada: 'A Anthropic recusou esta chave. Confira se ela foi revogada ou colada pela metade.',
  indisponivel: 'Não deu para falar com a Anthropic agora. Confira a internet e teste de novo.',
  'sem-chave': 'Nenhuma chave guardada.',
};

/**
 * Ajustes da camera, abertos pela engrenagem do visor. Era a aba Perfil do
 * antigo aplicativo de abas; virou o lugar que a camera de qualquer celular ja
 * tem. Tudo o que aparece aqui age: os itens de enfeite que existiam no Perfil
 * ("Grade horaria" e "Preferencias do Modo Aula" com seta, sem acao) sairam.
 */
export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { reiniciar, modoAoVivo, alternarModoAoVivo, temChave, salvarChave, apagarChave } =
    useFlow();
  const { restaurarExemplos, acervo } = useAcervo();

  const [chaveDigitada, setChaveDigitada] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [ondeFicou, setOndeFicou] = useState<'cofre' | 'memoria' | null>(null);
  const [verificacao, setVerificacao] = useState<Verificacao | 'verificando' | null>(null);
  const [reiniciado, setReiniciado] = useState(false);

  const testar = async () => {
    setVerificacao('verificando');
    const r = await verificarChave();
    setVerificacao(r);
    void Haptics.notificationAsync(
      r === 'valida'
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );
  };

  const aoGuardar = async () => {
    if (chaveDigitada.trim() === '' || guardando) return;
    setGuardando(true);
    const onde = await salvarChave(chaveDigitada);
    setChaveDigitada('');
    setOndeFicou(onde);
    setGuardando(false);
    // Confere na hora: melhor descobrir agora que a chave nao presta do que
    // no meio da apresentacao.
    await testar();
  };

  const aoRemover = () => {
    Alert.alert(
      'Remover a chave?',
      'A análise por IA desliga e o app volta a usar o conteúdo de exemplo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            void apagarChave();
            setOndeFicou(null);
            setVerificacao(null);
          },
        },
      ]
    );
  };

  const aoReiniciar = () => {
    reiniciar();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setReiniciado(true);
  };

  const capturadas = acervo.aulas.filter((a) => a.aoVivo || a.sessao !== null).length;
  const aoRestaurar = () => {
    Alert.alert(
      'Apagar as capturas?',
      `${capturadas} ${capturadas === 1 ? 'aula capturada vai' : 'aulas capturadas vão'} ser apagada${capturadas === 1 ? '' : 's'}. As cinco aulas de exemplo voltam.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => {
            restaurarExemplos();
            reiniciar();
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.tela}>
      <ScreenHeader title="Ajustes" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing(6) }]}
      >
        <Text style={styles.rotuloSecao}>Modo Aula</Text>
        <View style={styles.lista}>
          {/* Informacao, e nao controle: por isso nao tem seta. */}
          <View style={styles.item}>
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.textDim} />
            <View style={styles.textosItem}>
              <Text style={styles.tituloItem}>Grade horária</Text>
              <Text style={styles.detalheItem}>
                {gradeHoraria.length} aulas por semana. Confirma a matéria de cada foto.
              </Text>
            </View>
          </View>

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
            <MaterialCommunityIcons name="api" size={20} color={colors.primaryHi} />
            <Text style={[styles.tituloItem, styles.tituloItemAtivo]}>Viabilidade técnica</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primaryHi} />
          </Pressable>
        </View>

        {/* O unico ponto do app que toca a rede. Sem chave, tudo roda offline. */}
        <View style={styles.bloco}>
          <Text style={styles.rotuloSecao}>Análise por IA</Text>

          {temChave ? (
            <>
              <Pressable
                onPress={alternarModoAoVivo}
                accessibilityRole="switch"
                accessibilityLabel="Analisar a foto com IA de verdade"
                accessibilityState={{ checked: modoAoVivo }}
                style={({ pressed }) => [
                  styles.linhaAoVivo,
                  modoAoVivo && styles.linhaAoVivoLigada,
                  pressed && styles.itemPressionado,
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

              <Text style={styles.explicacao}>
                {modoAoVivo
                  ? 'A foto capturada é lida de verdade. Se a rede falhar ou demorar demais, aquela parte usa o conteúdo de exemplo, sem interromper a demonstração.'
                  : 'Desligada, o aplicativo funciona inteiramente offline, com o conteúdo de exemplo.'}
              </Text>

              <Text style={styles.notaChave}>
                {ondeFicou === 'memoria'
                  ? 'Este aparelho não tem cofre: a chave vale até o app fechar.'
                  : 'Chave guardada no cofre deste aparelho. A análise liga sozinha ao abrir o app.'}
              </Text>

              {verificacao !== null ? (
                <Text
                  style={[
                    styles.resultado,
                    verificacao === 'valida' && styles.resultadoOk,
                    (verificacao === 'recusada' || verificacao === 'indisponivel') &&
                      styles.resultadoAlerta,
                  ]}
                  accessibilityLiveRegion="polite"
                >
                  {verificacao === 'verificando'
                    ? 'Conferindo a chave com a Anthropic…'
                    : TEXTO_VERIFICACAO[verificacao]}
                </Text>
              ) : null}

              <View style={styles.acoesChave}>
                <GhostButton
                  label="Testar a chave"
                  variant="outline"
                  disabled={verificacao === 'verificando'}
                  onPress={() => void testar()}
                  style={styles.acaoChave}
                />
                <GhostButton
                  label="Remover"
                  variant="text"
                  onPress={aoRemover}
                  style={styles.acaoChave}
                />
              </View>
            </>
          ) : (
            <>
              {/* O campo e protegido porque a tela costuma estar num projetor. */}
              <TextInput
                value={chaveDigitada}
                onChangeText={setChaveDigitada}
                placeholder="Colar chave da API da Anthropic"
                placeholderTextColor={colors.textFaint}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.campoChave}
                accessibilityLabel="Chave da API para a análise por IA"
              />
              <PrimaryButton
                label="Guardar a chave"
                onPress={() => void aoGuardar()}
                disabled={chaveDigitada.trim() === ''}
                loading={guardando}
                style={styles.botaoGuardar}
              />
              <Text style={styles.explicacao}>
                Cole uma vez. A chave fica no cofre deste aparelho, e não no computador nem no Git, e
                a análise liga sozinha toda vez que o app abrir. Sem chave, o app roda offline com o
                conteúdo de exemplo.
              </Text>
            </>
          )}
        </View>

        {/* Existe para o fluxo poder ser refeito varias vezes durante o pitch
            sem precisar fechar e reabrir o app. */}
        <View style={styles.bloco}>
          <Text style={styles.rotuloSecao}>Demonstração</Text>
          <GhostButton
            label={reiniciado ? 'Demonstração reiniciada' : 'Reiniciar demonstração'}
            variant="outline"
            onPress={aoReiniciar}
          />
          <Text style={styles.explicacao}>
            Limpa a captura em andamento e as plataformas, sem mexer nas aulas salvas.
          </Text>
          <GhostButton
            label="Apagar capturas e voltar aos exemplos"
            variant="text"
            onPress={aoRestaurar}
          />
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
  rotuloSecao: {
    ...fontDado.rotulo,
    color: colors.textDim,
    marginTop: spacing(6),
    marginBottom: spacing(3),
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
    paddingVertical: spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  itemPressionado: {
    opacity: 0.6,
  },
  textosItem: {
    flex: 1,
  },
  tituloItem: {
    ...font.body,
    color: colors.text,
    flex: 1,
  },
  tituloItemAtivo: {
    color: colors.primaryHi,
  },
  detalheItem: {
    ...font.small,
    color: colors.textFaint,
    marginTop: spacing(0.5),
  },

  bloco: {
    marginTop: spacing(3),
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
  explicacao: {
    ...font.small,
    color: colors.textFaint,
    marginTop: spacing(3),
    lineHeight: 17,
  },
  notaChave: {
    ...font.small,
    color: colors.textDim,
    marginTop: spacing(3),
    lineHeight: 17,
  },
  resultado: {
    ...font.small,
    color: colors.textDim,
    marginTop: spacing(3),
    lineHeight: 17,
  },
  resultadoOk: {
    color: colors.success,
  },
  resultadoAlerta: {
    color: colors.warn,
  },
  acoesChave: {
    flexDirection: 'row',
    gap: spacing(3),
    marginTop: spacing(3),
  },
  acaoChave: {
    flex: 1,
  },
  campoChave: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(3),
    fontFamily: fontMono,
    fontSize: 12,
    color: colors.text,
  },
  botaoGuardar: {
    marginTop: spacing(3),
  },
  versao: {
    ...fontDado.rotulo,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing(10),
  },
});
