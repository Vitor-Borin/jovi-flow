import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '../components/Card';
import { GhostButton } from '../components/GhostButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { textoDaAula } from '../data/acervo';
import type { NomeIcone } from '../data/mock';
import { economiaFormatada, plataformas } from '../data/mock';
import { useLeitura } from '../hooks/useLeitura';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import type { RootStackParamList } from '../navigation/types';
import { useAcervo } from '../store/AcervoContext';
import { useFlow } from '../store/FlowContext';
import { colors, font, fontMono, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Actions'>;

/**
 * A aula acabou de ser gravada no acervo. Daqui o estudante estuda (resumo,
 * questoes, cartoes, ouvir) ou volta para a camera. Tudo aponta para a aula
 * salva, e nao para o estado da captura.
 */
export function ActionsScreen({ navigation, route }: Props) {
  const { aulaId, paginaNova, numeroPagina } = route.params;
  const insets = useSafeAreaInsets();
  const reduzir = useReduzirMovimento();
  const { aulaPorId, atualizarTextoDaAula } = useAcervo();
  const { plataformasConectadas, plataformasAutomaticas, enviadasManualmente, enviarAgora } =
    useFlow();
  const { falando, alternar } = useLeitura();
  const [editando, setEditando] = useState(false);

  const aula = aulaPorId(aulaId);

  // A aula pode ter sido excluida por outra tela. Sem ela, esta tela nao tem
  // o que mostrar.
  useEffect(() => {
    if (aula === null) navigation.navigate('Galeria', { screen: 'Aulas' });
  }, [aula, navigation]);

  if (aula === null) return <View style={styles.tela} />;

  const conectadas = plataformas.filter((p) => plataformasConectadas.includes(p.id));
  const jaForam = conectadas.filter(
    (p) => plataformasAutomaticas.includes(p.id) || enviadasManualmente.includes(p.id)
  );
  const pendentes = conectadas.filter(
    (p) => !plataformasAutomaticas.includes(p.id) && !enviadasManualmente.includes(p.id)
  );
  const eco = economiaFormatada();
  const texto = textoDaAula(aula);

  const compartilhar = async () => {
    try {
      await Share.share({ message: `${aula.titulo}\n${aula.tema}\n\n${texto}` });
    } catch {
      // O usuario fechou a folha de compartilhamento. Nao ha o que tratar.
    }
  };

  const acoes: {
    id: string;
    titulo: string;
    descricao: string;
    icone: NomeIcone;
    onPress: () => void;
    feito?: boolean;
    ativo?: boolean;
  }[] = [
    {
      id: 'resumo',
      titulo: 'Resumo',
      descricao: `${aula.resumo.length} pontos do conteúdo`,
      icone: 'text-box-outline',
      onPress: () => navigation.navigate('Summary', { aulaId }),
      feito: aula.resumoSalvo,
    },
    {
      id: 'ouvir',
      titulo: falando ? 'Parar' : 'Ouvir',
      descricao: 'O celular lê o resumo',
      icone: falando ? 'stop-circle-outline' : 'play-circle-outline',
      onPress: () => alternar(aula.resumo.join('. ')),
      ativo: falando,
    },
    {
      id: 'questoes',
      titulo: 'Questões',
      descricao: `${aula.questoes.length} para praticar`,
      icone: 'help-circle-outline',
      onPress: () => navigation.navigate('Questions', { aulaId }),
    },
    {
      id: 'revisar',
      titulo: 'Flashcards',
      descricao: `${aula.flashcards.length} cartões`,
      icone: 'cards-outline',
      onPress: () => navigation.navigate('Revisao', { aulaId }),
    },
    {
      id: 'editar',
      titulo: 'Editar texto',
      descricao: 'Corrigir o que foi lido',
      icone: 'pencil-outline',
      onPress: () => setEditando(true),
    },
    {
      id: 'compartilhar',
      titulo: 'Compartilhar',
      descricao: 'Mandar para alguém',
      icone: 'share-variant-outline',
      onPress: () => void compartilhar(),
    },
  ];

  return (
    <View style={styles.tela}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing(8) }]}
      >
        <CheckSucesso reduzir={reduzir} />

        <Text style={styles.titulo}>
          {paginaNova ? `Página ${numeroPagina} adicionada` : 'Aula salva'}
        </Text>
        <Text style={styles.nomeAula} numberOfLines={2}>
          {aula.titulo}
        </Text>
        <Text style={styles.caminho} numberOfLines={1} ellipsizeMode="middle">
          {aula.pasta.join(' › ')}
        </Text>

        {jaForam.length > 0 ? (
          <View style={styles.blocoEnvio}>
            <Text style={styles.rotuloEnvio}>Enviado sozinho para</Text>
            <View style={styles.linhaPlataformas}>
              {jaForam.map((p) => (
                <View key={p.id} style={styles.chipPlataforma}>
                  <MaterialCommunityIcons name="check" size={13} color={colors.primaryHi} />
                  <Text style={styles.textoPlataforma}>{p.nome}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {pendentes.length > 0 ? (
          <View style={styles.blocoEnvio}>
            <Text style={styles.rotuloEnvio}>Esperando você decidir</Text>
            <View style={styles.linhaPlataformas}>
              {pendentes.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    enviarAgora(p.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Enviar para ${p.nome}. ${p.papel}`}
                  style={({ pressed }) => [
                    styles.chipPendente,
                    pressed && styles.chipPendentePressionado,
                  ]}
                >
                  <MaterialCommunityIcons name={p.icone} size={14} color={colors.textDim} />
                  <Text style={styles.textoPendente}>Enviar para {p.nome}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <Text style={styles.linhaEconomia}>
          <Text style={styles.destaqueEconomia}>{eco.porAula}</Text> de texto no lugar de{' '}
          {eco.porAulaSemFlow} de foto · <Text style={styles.destaqueEconomia}>{eco.fator}× menos</Text>
        </Text>

        <View style={styles.grade}>
          {acoes.map((acao) => (
            <Card
              key={acao.id}
              onPress={acao.onPress}
              accessibilityLabel={`${acao.titulo}. ${acao.descricao}`}
              style={[styles.cardAcao, acao.ativo && styles.cardAcaoAtivo]}
            >
              <View style={styles.topoCard}>
                <MaterialCommunityIcons name={acao.icone} size={22} color={colors.primaryHi} />
                {acao.feito ? (
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.primaryHi} />
                ) : null}
              </View>
              <Text style={styles.tituloCard} numberOfLines={1}>
                {acao.titulo}
              </Text>
              <Text style={styles.descricaoCard} numberOfLines={2}>
                {acao.descricao}
              </Text>
            </Card>
          ))}
        </View>

        <PrimaryButton
          label="Abrir a aula"
          onPress={() => navigation.navigate('Aula', { aulaId })}
          style={styles.botaoAula}
        />
        <GhostButton
          label="Voltar para a câmera"
          variant="text"
          onPress={() => navigation.popToTop()}
          style={styles.botaoCamera}
        />
      </ScrollView>

      <ModalEdicao
        aberto={editando}
        texto={aula.paginas[aula.paginas.length - 1]?.textoExtraido ?? ''}
        onSalvar={(t) => {
          atualizarTextoDaAula(aulaId, t);
          setEditando(false);
        }}
        onCancelar={() => setEditando(false)}
      />
    </View>
  );
}

/* ------------------------------------------------------------ check animado */

function CheckSucesso({ reduzir }: { reduzir: boolean }) {
  const escala = useRef(new Animated.Value(reduzir ? 1 : 0)).current;

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (reduzir) {
      escala.setValue(1);
      return;
    }
    const anim = Animated.spring(escala, {
      toValue: 1,
      damping: 9,
      stiffness: 160,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduzir, escala]);

  return (
    <Animated.View style={[styles.circuloCheck, { transform: [{ scale: escala }] }]}>
      <MaterialCommunityIcons name="check" size={34} color={colors.onPrimary} />
    </Animated.View>
  );
}

/* ------------------------------------------------------- modal de edicao de texto */

function ModalEdicao({
  aberto,
  texto,
  onSalvar,
  onCancelar,
}: {
  aberto: boolean;
  texto: string;
  onSalvar: (t: string) => void;
  onCancelar: () => void;
}) {
  const [rascunho, setRascunho] = useState(texto);
  const insets = useSafeAreaInsets();

  // Recarrega o rascunho a cada abertura, para nao guardar edicao descartada.
  useEffect(() => {
    if (aberto) setRascunho(texto);
  }, [aberto, texto]);

  return (
    <Modal visible={aberto} animationType="slide" onRequestClose={onCancelar}>
      <View style={[styles.telaModal, { paddingTop: insets.top }]}>
        <ScreenHeader title="Editar texto" onBack={onCancelar} semAreaSegura />

        <View style={styles.corpoModal}>
          <TextInput
            value={rascunho}
            onChangeText={setRascunho}
            multiline
            textAlignVertical="top"
            style={styles.campoTexto}
            accessibilityLabel="Texto extraído da aula"
          />
        </View>

        <View style={[styles.rodapeModal, { paddingBottom: insets.bottom + spacing(4) }]}>
          <PrimaryButton label="Salvar alterações" onPress={() => onSalvar(rascunho)} />
          <GhostButton
            label="Cancelar"
            variant="text"
            onPress={onCancelar}
            style={styles.cancelarModal}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  conteudo: {
    paddingHorizontal: spacing(5),
    alignItems: 'center',
  },
  circuloCheck: {
    width: spacing(16),
    height: spacing(16),
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing(4),
  },
  titulo: {
    ...font.h2,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing(5),
  },
  nomeAula: {
    ...font.body,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing(1.5),
  },
  caminho: {
    ...font.small,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing(1),
  },

  blocoEnvio: {
    alignSelf: 'stretch',
    marginTop: spacing(6),
  },
  rotuloEnvio: {
    ...font.small,
    color: colors.textFaint,
    marginBottom: spacing(2.5),
  },
  linhaPlataformas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
  },
  chipPlataforma: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(3),
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  textoPlataforma: {
    ...font.small,
    fontWeight: '600',
    color: colors.primaryHi,
  },
  chipPendente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    minHeight: spacing(9),
    paddingHorizontal: spacing(3),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipPendentePressionado: {
    backgroundColor: colors.surfaceAlt,
  },
  textoPendente: {
    ...font.small,
    fontWeight: '600',
    color: colors.textDim,
  },

  linhaEconomia: {
    ...font.small,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing(6),
  },
  destaqueEconomia: {
    fontFamily: fontMono,
    fontWeight: '700',
    color: colors.textDim,
  },

  grade: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(3),
    marginTop: spacing(6),
  },
  cardAcao: {
    width: '47%',
    flexGrow: 1,
    borderWidth: 0,
  },
  cardAcaoAtivo: {
    backgroundColor: colors.primarySoft,
  },
  topoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(3),
  },
  tituloCard: {
    ...font.bodyMed,
    color: colors.text,
  },
  descricaoCard: {
    ...font.small,
    color: colors.textDim,
    marginTop: spacing(1),
  },

  botaoAula: {
    marginTop: spacing(7),
  },
  botaoCamera: {
    marginTop: spacing(2),
  },

  telaModal: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  corpoModal: {
    flex: 1,
    paddingHorizontal: spacing(5),
  },
  campoTexto: {
    flex: 1,
    fontFamily: fontMono,
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing(4),
  },
  rodapeModal: {
    paddingHorizontal: spacing(5),
    paddingTop: spacing(3),
  },
  cancelarModal: {
    marginTop: spacing(2),
  },
});
