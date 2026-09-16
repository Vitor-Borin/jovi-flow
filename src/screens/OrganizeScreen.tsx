import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GhostButton } from '../components/GhostButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { SeletorPasta } from '../components/SeletorPasta';
import { dataBR, tituloDaCaptura } from '../data/acervo';
import {
  conteudoIdentificado,
  flashcards as flashcardsExemplo,
  questoes as questoesExemplo,
  resumoIA,
} from '../data/mock';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import type { RootStackParamList } from '../navigation/types';
import { useAcervo } from '../store/AcervoContext';
import { lousaDoTratamento, useFlow } from '../store/FlowContext';
import { TOQUE_MIN, colors, font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Organize'>;

const MS_ENTRE_NIVEIS = 120;
const RECUO_POR_NIVEL = spacing(6);

/**
 * Onde a captura vai ser salva. Aqui acontece a sessao pela grade: se ja existe
 * uma aula desta mesma aula do horario (ou desta mesma pasta, ha pouco), a
 * foto entra nela como pagina nova, e a tela diz isso antes de salvar.
 */
export function OrganizeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const reduzir = useReduzirMovimento();
  const {
    destino,
    definirDestino,
    classificacao,
    transcricao,
    estudo,
    fotoUri,
    tratamento,
    subModo,
    textoExtraido,
  } = useFlow();
  const { previaSessao, salvarCaptura } = useAcervo();
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const conteudo = classificacao ?? conteudoIdentificado;
  const pastaNova = classificacao?.pastaNova === true;
  const previa = useMemo(() => previaSessao(destino), [previaSessao, destino]);

  const tituloNovo = `${tituloDaCaptura(conteudo.topico)} · Aula ${dataBR(new Date()).slice(0, 5)}`;
  const linhas = useMemo(
    () => [
      { nome: destino[0], pasta: true },
      { nome: destino[1], pasta: true },
      {
        nome: previa ? `${previa.aula.titulo} · página ${previa.numeroPagina}` : tituloNovo,
        pasta: false,
      },
    ],
    [destino, previa, tituloNovo]
  );

  const salvar = async () => {
    if (salvando) return;
    setSalvando(true);
    try {
      const lousa = lousaDoTratamento(tratamento);
      const r = await salvarCaptura({
        // A aula guarda a lousa tratada; a original vai para a aba Fotos.
        fotoUri: lousa?.uri ?? fotoUri,
        fotoOriginalUri: lousa ? fotoUri : null,
        subModo,
        materia: conteudo.materia,
        tema: conteudo.tema,
        topico: conteudo.topico,
        pasta: destino,
        textoExtraido,
        resumo: transcricao !== null && transcricao.resumo.length > 0 ? transcricao.resumo : resumoIA,
        flashcards:
          estudo !== null && estudo.flashcards.length > 0 ? estudo.flashcards : flashcardsExemplo,
        questoes: estudo !== null && estudo.questoes.length > 0 ? estudo.questoes : questoesExemplo,
        aoVivo: classificacao !== null || transcricao !== null,
      });
      navigation.navigate('Actions', {
        aulaId: r.aula.id,
        paginaNova: r.paginaNova,
        numeroPagina: r.numeroPagina,
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={styles.tela}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing(6) }]}
      >
        <Text style={styles.titulo}>Será salvo em:</Text>

        {previa ? (
          <View style={styles.avisoSessao}>
            <MaterialCommunityIcons name="book-open-page-variant-outline" size={18} color={colors.primaryHi} />
            <View style={styles.textosAviso}>
              <Text style={styles.tituloAviso}>
                Entra na aula de hoje como página {previa.numeroPagina}
              </Text>
              <Text style={styles.textoAviso}>
                {previa.sessao.tipo === 'grade'
                  ? `Sua grade diz que você está em ${previa.sessao.disciplina} agora, e esta aula já tem ${previa.aula.paginas.length} ${previa.aula.paginas.length === 1 ? 'foto' : 'fotos'}. O Flow junta em vez de espalhar.`
                  : `Mesma pasta, há menos de meia hora. O Flow junta as fotos numa aula só em vez de espalhar.`}
              </Text>
            </View>
          </View>
        ) : pastaNova ? (
          <View style={styles.avisoSessao}>
            <MaterialCommunityIcons name="folder-plus-outline" size={18} color={colors.primaryHi} />
            <Text style={[styles.textoAviso, styles.textosAviso]}>
              Assunto novo: nenhuma pasta sua servia, então o Flow vai criar esta.
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
              reduzir={reduzir}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.rodape, { paddingBottom: insets.bottom + spacing(4) }]}>
        <PrimaryButton
          label={previa ? 'Adicionar à aula' : 'Salvar aqui'}
          onPress={() => void salvar()}
          loading={salvando}
        />
        <GhostButton
          label="Alterar pasta de destino"
          variant="text"
          onPress={() => setModalAberto(true)}
          style={styles.botaoAlterar}
        />
      </View>

      <SeletorPasta
        aberto={modalAberto}
        titulo="Escolher pasta de destino"
        atual={destino}
        onEscolher={definirDestino}
        onFechar={() => setModalAberto(false)}
      />
    </View>
  );
}

/* -------------------------------------------------------------- linha da arvore */

function LinhaArvore({
  nome,
  pasta,
  nivel,
  reduzir,
}: {
  nome: string;
  pasta: boolean;
  nivel: number;
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
      delay: nivel * MS_ENTRE_NIVEIS,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduzir, nivel, entrada]);

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
    marginBottom: spacing(6),
  },
  avisoSessao: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(3),
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingVertical: spacing(3.5),
    paddingHorizontal: spacing(4),
    marginBottom: spacing(6),
  },
  textosAviso: {
    flex: 1,
  },
  tituloAviso: {
    ...font.bodyMed,
    color: colors.text,
  },
  textoAviso: {
    ...font.small,
    color: colors.textDim,
    lineHeight: 17,
    marginTop: spacing(1),
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
});
