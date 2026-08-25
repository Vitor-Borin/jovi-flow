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
import type { NomeIcone } from '../data/mock';
import { conteudoIdentificado, economiaFormatada, plataformas } from '../data/mock';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import type { RootStackParamList } from '../navigation/types';
import { useFlow } from '../store/FlowContext';
import { colors, font, fontDado, fontMono, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Actions'>;

export function ActionsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const reduzir = useReduzirMovimento();
  const { destino, textoExtraido, definirTexto, resumoSalvo, plataformasConectadas, classificacao } =
    useFlow();
  const conteudo = classificacao ?? conteudoIdentificado;
  const [editando, setEditando] = useState(false);

  const conectadas = plataformas.filter((p) => plataformasConectadas.includes(p.id));
  const eco = economiaFormatada();

  const compartilhar = async () => {
    try {
      await Share.share({
        message: `${conteudo.tema} — ${conteudo.topico}\n\n${textoExtraido}`,
      });
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
  }[] = [
    {
      id: 'resumo',
      titulo: 'Gerar resumo',
      descricao: 'Resuma o conteúdo em tópicos',
      icone: 'text-box-outline',
      onPress: () => navigation.navigate('Summary'),
      feito: resumoSalvo,
    },
    {
      id: 'questoes',
      titulo: 'Criar questões',
      descricao: 'Gere perguntas para praticar',
      icone: 'help-circle-outline',
      onPress: () => navigation.navigate('Questions'),
    },
    {
      id: 'revisar',
      titulo: 'Revisar',
      descricao: 'Estude com flashcards',
      icone: 'cards-outline',
      onPress: () => navigation.navigate('Tabs', { screen: 'Revisao' }),
    },
    {
      id: 'editar',
      titulo: 'Editar texto',
      descricao: 'Revise o texto extraído',
      icone: 'pencil-outline',
      onPress: () => setEditando(true),
    },
    {
      id: 'compartilhar',
      titulo: 'Compartilhar',
      descricao: 'Envie para uma plataforma',
      icone: 'share-variant-outline',
      onPress: () => void compartilhar(),
    },
    {
      id: 'pasta',
      titulo: 'Ver pasta',
      descricao: 'Acessar onde foi salvo',
      icone: 'folder-open-outline',
      onPress: () => navigation.navigate('Tabs', { screen: 'Estudos' }),
    },
  ];

  return (
    <View style={styles.tela}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing(8) }]}
      >
        <CheckSucesso reduzir={reduzir} />

        <Text style={styles.titulo}>Conteúdo salvo com sucesso</Text>
        <Text style={styles.caminho} numberOfLines={1} ellipsizeMode="middle">
          {destino.join(' › ')}
        </Text>

        {/* O conteudo ja saiu para as ferramentas que o estudante usa: e o
            diferencial que a entrega da Sprint 1 do grupo prometia. */}
        {conectadas.length > 0 ? (
          <View style={styles.blocoEnvio}>
            <Text style={styles.rotuloEnvio}>ENVIADO TAMBÉM PARA</Text>
            <View style={styles.linhaPlataformas}>
              {conectadas.map((p) => (
                <View key={p.id} style={styles.chipPlataforma}>
                  <MaterialCommunityIcons name={p.icone} size={14} color={colors.primaryHi} />
                  <Text style={styles.textoPlataforma}>{p.nome}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Uma das dores da pesquisa do grupo era falta de espaco no celular.
            Linha simples em vez de card: a tela ja tem caixas demais. */}
        <Text style={styles.linhaEconomia}>
          <Text style={styles.destaqueEconomia}>{eco.porAula}</Text> de texto no lugar de{' '}
          {eco.porAulaSemFlow} de foto · <Text style={styles.destaqueEconomia}>{eco.fator}× menos</Text>
        </Text>

        <Text style={styles.subtitulo}>O que deseja fazer agora?</Text>

        <View style={styles.grade}>
          {acoes.map((acao) => (
            <Card
              key={acao.id}
              onPress={acao.onPress}
              accessibilityLabel={`${acao.titulo}. ${acao.descricao}`}
              style={styles.cardAcao}
            >
              <View style={styles.topoCard}>
                <MaterialCommunityIcons name={acao.icone} size={22} color={colors.primaryHi} />
                {acao.feito ? (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={16}
                    color={colors.primary}
                  />
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
      </ScrollView>

      <ModalEdicao
        aberto={editando}
        texto={textoExtraido}
        onSalvar={(t) => {
          definirTexto(t);
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
  caminho: {
    ...font.small,
    color: colors.primaryHi,
    textAlign: 'center',
    marginTop: spacing(2),
    maxWidth: '100%',
  },
  blocoEnvio: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: spacing(6),
  },
  rotuloEnvio: {
    ...fontDado.rotulo,
    color: colors.textFaint,
    marginBottom: spacing(2.5),
  },
  linhaPlataformas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing(2),
  },
  chipPlataforma: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.primaryEdge,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2.5),
  },
  textoPlataforma: {
    ...font.tiny,
    color: colors.primaryHi,
  },

  linhaEconomia: {
    ...font.small,
    color: colors.textFaint,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing(4),
  },
  destaqueEconomia: {
    ...font.bodyMed,
    fontSize: 12,
    color: colors.text,
  },

  subtitulo: {
    ...font.body,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing(7),
    marginBottom: spacing(5),
  },

  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(3),
    alignSelf: 'stretch',
  },
  cardAcao: {
    // Largura fixa em porcentagem mantem duas colunas; a altura minima igual
    // impede que descricoes de tamanhos diferentes deixem os cards desalinhados.
    width: '47.5%',
    flexGrow: 1,
    minHeight: spacing(31),
    justifyContent: 'flex-start',
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
    lineHeight: 17,
  },

  telaModal: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  corpoModal: {
    flex: 1,
    paddingHorizontal: spacing(5),
    paddingTop: spacing(2),
  },
  campoTexto: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing(4),
    fontFamily: fontMono,
    fontSize: 12,
    lineHeight: 19,
    color: colors.text,
  },
  rodapeModal: {
    paddingHorizontal: spacing(5),
    paddingTop: spacing(4),
  },
  cancelarModal: {
    marginTop: spacing(2),
  },
});
