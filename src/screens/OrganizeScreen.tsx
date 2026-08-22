import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '../components/Badge';
import { GhostButton } from '../components/GhostButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { aulaCapturada, biblioteca } from '../data/mock';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import type { RootStackParamList } from '../navigation/types';
import { useFlow } from '../store/FlowContext';
import { TOQUE_MIN, colors, font, fontDado, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Organize'>;

const MS_ENTRE_NIVEIS = 120;
const RECUO_POR_NIVEL = spacing(6);

export function OrganizeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { destino, definirDestino, classificacao } = useFlow();
  const pastaNova = classificacao?.pastaNova === true;
  const reduzir = useReduzirMovimento();
  const [modalAberto, setModalAberto] = useState(false);

  const aula = useMemo(() => aulaCapturada(), []);
  // A ultima linha da arvore e o arquivo, e nao uma pasta.
  const linhas = useMemo(
    () => [...destino.map((nome) => ({ nome, pasta: true })), { nome: aula.titulo, pasta: false }],
    [destino, aula.titulo]
  );

  return (
    <View style={styles.tela}>
      <ScreenHeader
        onBack={() => navigation.goBack()}
        right={<Badge label="FLOW ATIVO" variant="solid" dot />}
      />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing(6) }]}
      >
        <Text style={styles.titulo}>Será salvo em:</Text>

        {/* Quando nenhuma pasta existente servia, o Flow abre uma — e diz que
            abriu, em vez de deixar o estudante descobrir depois. */}
        {pastaNova ? (
          <View style={styles.avisoNova}>
            <MaterialCommunityIcons name="folder-plus-outline" size={16} color={colors.primaryHi} />
            <Text style={styles.textoAvisoNova}>
              Assunto novo: nenhuma pasta sua servia, então o Flow criou esta.
            </Text>
          </View>
        ) : null}

        <View style={styles.arvore}>
          {linhas.map((linha, indice) => (
            <LinhaArvore
              key={`${linha.nome}-${indice}`}
              nome={linha.nome}
              pasta={linha.pasta}
              nivel={indice}
              ordem={indice}
              reduzir={reduzir}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.rodape, { paddingBottom: insets.bottom + spacing(4) }]}>
        <PrimaryButton label="Salvar aqui" onPress={() => navigation.navigate('Actions')} />
        <GhostButton
          label="Alterar pasta de destino"
          variant="text"
          onPress={() => setModalAberto(true)}
          style={styles.botaoAlterar}
        />
      </View>

      <ModalDestino
        aberto={modalAberto}
        destinoAtual={destino}
        onFechar={() => setModalAberto(false)}
        onEscolher={(novo) => {
          definirDestino(novo);
          setModalAberto(false);
        }}
      />
    </View>
  );
}

/* -------------------------------------------------------------- linha da arvore */

function LinhaArvore({
  nome,
  pasta,
  nivel,
  ordem,
  reduzir,
}: {
  nome: string;
  pasta: boolean;
  nivel: number;
  ordem: number;
  reduzir: boolean;
}) {
  const entrada = useRef(new Animated.Value(reduzir ? 1 : 0)).current;

  useEffect(() => {
    if (reduzir) {
      entrada.setValue(1);
      return;
    }
    const anim = Animated.timing(entrada, {
      toValue: 1,
      duration: 240,
      delay: ordem * MS_ENTRE_NIVEIS,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduzir, ordem, entrada]);

  const deslocamento = entrada.interpolate({ inputRange: [0, 1], outputRange: [spacing(3), 0] });

  return (
    <Animated.View
      style={[
        styles.linha,
        { marginLeft: nivel * RECUO_POR_NIVEL, opacity: entrada, transform: [{ translateX: deslocamento }] },
      ]}
    >
      {nivel > 0 ? <View style={styles.conector} /> : null}

      <View style={[styles.itemLinha, !pasta && styles.itemDestaque]}>
        <MaterialCommunityIcons
          name={pasta ? 'folder-outline' : 'file-document-outline'}
          size={18}
          color={pasta ? colors.textDim : colors.primaryHi}
        />
        <Text
          style={[styles.nomeLinha, !pasta && styles.nomeDestaque]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {nome}
        </Text>
      </View>
    </Animated.View>
  );
}

/* --------------------------------------------------------- modal de destino */

function ModalDestino({
  aberto,
  destinoAtual,
  onFechar,
  onEscolher,
}: {
  aberto: boolean;
  destinoAtual: string[];
  onFechar: () => void;
  onEscolher: (destino: string[]) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={aberto} animationType="slide" transparent onRequestClose={onFechar}>
      <View style={styles.camadaModal}>
        <Pressable
          style={styles.scrimModal}
          onPress={onFechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar a escolha de pasta"
        />

        <View style={[styles.folhaModal, { paddingBottom: insets.bottom + spacing(6) }]}>
          <View style={styles.alca} />
          <Text style={styles.tituloModal}>Escolher pasta de destino</Text>

          <ScrollView>
            {biblioteca.map((pasta) =>
              pasta.subpastas.map((sub) => {
                const caminho = [pasta.nome, sub.nome, destinoAtual[2] ?? 'Geral'];
                const selecionado = destinoAtual[0] === pasta.nome && destinoAtual[1] === sub.nome;
                return (
                  <Pressable
                    key={`${pasta.nome}-${sub.nome}`}
                    onPress={() => onEscolher([pasta.nome, sub.nome, 'Aulas'])}
                    accessibilityRole="button"
                    accessibilityLabel={`Salvar em ${pasta.nome}, ${sub.nome}`}
                    accessibilityState={{ selected: selecionado }}
                    style={({ pressed }) => [
                      styles.opcao,
                      selecionado && styles.opcaoSelecionada,
                      pressed && styles.opcaoPressionada,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={pasta.icone}
                      size={20}
                      color={selecionado ? colors.primaryHi : colors.textDim}
                    />
                    <View style={styles.textosOpcao}>
                      <Text style={styles.opcaoTitulo} numberOfLines={1}>
                        {pasta.nome}
                      </Text>
                      <Text style={styles.opcaoCaminho} numberOfLines={1}>
                        {caminho[1]}
                      </Text>
                    </View>
                    {selecionado ? (
                      <MaterialCommunityIcons name="check" size={20} color={colors.primaryHi} />
                    ) : null}
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          <GhostButton
            label="Cancelar"
            variant="outline"
            onPress={onFechar}
            style={styles.botaoCancelarModal}
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
  },
  titulo: {
    ...font.h1,
    color: colors.text,
    marginTop: spacing(2),
    marginBottom: spacing(7),
  },
  avisoNova: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2.5),
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryEdge,
    borderRadius: radius.md,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(3.5),
    marginBottom: spacing(6),
  },
  textoAvisoNova: {
    ...font.small,
    color: colors.text,
    flex: 1,
    lineHeight: 17,
  },
  arvore: {
    alignSelf: 'stretch',
  },
  linha: {
    marginBottom: spacing(2),
  },
  conector: {
    position: 'absolute',
    left: -spacing(3),
    top: -spacing(2),
    bottom: '50%',
    width: 1,
    backgroundColor: colors.borderSoft,
  },
  itemLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2.5),
    minHeight: TOQUE_MIN,
    paddingHorizontal: spacing(3),
    borderRadius: radius.sm,
  },
  itemDestaque: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryEdge,
  },
  nomeLinha: {
    ...font.bodyMed,
    color: colors.textDim,
    flexShrink: 1,
  },
  nomeDestaque: {
    color: colors.text,
  },

  rodape: {
    paddingHorizontal: spacing(5),
    paddingTop: spacing(3),
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  botaoAlterar: {
    marginTop: spacing(2),
  },

  camadaModal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrimModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scrim,
  },
  folhaModal: {
    maxHeight: '75%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(5),
    paddingTop: spacing(3),
  },
  alca: {
    width: spacing(10),
    height: spacing(1),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHi,
    alignSelf: 'center',
    marginBottom: spacing(5),
  },
  tituloModal: {
    ...font.h3,
    color: colors.text,
    marginBottom: spacing(4),
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    minHeight: spacing(14),
    paddingHorizontal: spacing(3),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: spacing(2),
  },
  opcaoSelecionada: {
    borderColor: colors.primaryEdge,
    backgroundColor: colors.primarySoft,
  },
  opcaoPressionada: {
    backgroundColor: colors.surfaceAlt,
  },
  textosOpcao: {
    flex: 1,
  },
  opcaoTitulo: {
    ...font.bodyMed,
    color: colors.text,
  },
  opcaoCaminho: {
    ...fontDado.rotulo,
    color: colors.textFaint,
    marginTop: spacing(0.5),
  },
  botaoCancelarModal: {
    marginTop: spacing(3),
  },
});
