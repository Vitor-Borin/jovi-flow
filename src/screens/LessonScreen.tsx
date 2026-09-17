import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoOuvir } from '../components/BotaoOuvir';
import { ModalTexto } from '../components/ModalTexto';
import { ScreenHeader } from '../components/ScreenHeader';
import { SeletorPasta } from '../components/SeletorPasta';
import type { Aula } from '../data/acervo';
import { ligacoesDaAula, textoDaAula } from '../data/acervo';
import { useLeitura } from '../hooks/useLeitura';
import type { RootStackParamList } from '../navigation/types';
import { compartilharPdfDaAula } from '../services/pdfDaAula';
import { useAcervo } from '../store/AcervoContext';
import { TOQUE_MIN, colors, font, fontDado, fontMono, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Aula'>;

const LINHAS_TEXTO_FECHADO = 6;

/**
 * Uma aula do acervo. E o que abre ao tocar num item de Estudos ou do Inicio,
 * e o que faltava na Sprint 3: la, "Abrir" nao abria nada.
 *
 * Paginas em cima (as fotos da sessao), resumo no meio, texto embaixo. As
 * acoes de estudo ficam numa linha so, e o menu do cabecalho renomeia, move e
 * exclui de verdade.
 */
export function LessonScreen({ navigation, route }: Props) {
  const { aulaId } = route.params;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { acervo, aulaPorId, renomearAula, moverAula, excluirAula } = useAcervo();
  const { falando, alternar } = useLeitura();
  // Uma leitura para o resumo e outra para o texto inteiro da lousa: cada botao
  // mostra Parar so quando e ele que esta falando.
  const leituraDoTexto = useLeitura();
  const [renomeando, setRenomeando] = useState(false);
  const [movendo, setMovendo] = useState(false);
  const [textoAberto, setTextoAberto] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const aula = aulaPorId(aulaId);

  useEffect(() => {
    if (aula === null) navigation.goBack();
  }, [aula, navigation]);

  if (aula === null) return <View style={styles.tela} />;

  const larguraPagina = width - spacing(10);

  const confirmarExclusao = () => {
    Alert.alert('Excluir esta aula?', 'As fotos, o resumo, os cartões e as questões vão junto.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          excluirAula(aulaId);
          navigation.goBack();
        },
      },
    ]);
  };

  // A aula inteira num PDF, para entregar como trabalho ou mandar para a turma.
  const exportarPdf = async () => {
    if (gerandoPdf) return;
    setGerandoPdf(true);
    try {
      const r = await compartilharPdfDaAula(aula);
      if (r === 'falhou') {
        Alert.alert('Não deu para gerar o PDF', 'Tente de novo daqui a pouco.');
      } else if (r === 'sem-compartilhamento') {
        Alert.alert(
          'Este aparelho não compartilha arquivos',
          'O PDF foi montado, mas não há para onde mandar.'
        );
      }
    } finally {
      setGerandoPdf(false);
    }
  };

  const abrirMenu = () => {
    Alert.alert(aula.titulo, aula.pasta.join(' › '), [
      { text: gerandoPdf ? 'Montando o PDF…' : 'PDF da aula', onPress: () => void exportarPdf() },
      { text: 'Renomear', onPress: () => setRenomeando(true) },
      { text: 'Mover para outra pasta', onPress: () => setMovendo(true) },
      { text: 'Excluir', style: 'destructive', onPress: confirmarExclusao },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const aoRolarPaginas = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const indice = Math.round(e.nativeEvent.contentOffset.x / larguraPagina);
    if (indice !== paginaAtual) setPaginaAtual(indice);
  };

  const texto = textoDaAula(aula);
  const ligacoes = ligacoesDaAula(acervo, aula);

  return (
    <View style={styles.tela}>
      <ScreenHeader
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            onPress={abrirMenu}
            accessibilityRole="button"
            accessibilityLabel="Mais opções da aula"
            style={styles.botaoMenu}
          >
            <MaterialCommunityIcons name="dots-horizontal" size={24} color={colors.text} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing(8) }]}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={aoRolarPaginas}
          style={styles.paginas}
        >
          {aula.paginas.map((pagina, i) => (
            <View key={pagina.id} style={[styles.pagina, { width: larguraPagina }]}>
              {pagina.fotoUri ? (
                <Image
                  source={{ uri: pagina.fotoUri }}
                  style={styles.foto}
                  resizeMode="contain"
                  accessibilityLabel={`Foto da página ${i + 1}`}
                />
              ) : (
                <View style={styles.semFoto}>
                  <MaterialCommunityIcons name="image-off-outline" size={28} color={colors.textFaint} />
                  <Text style={styles.textoSemFoto}>Sem foto nesta página</Text>
                </View>
              )}
              <View style={styles.seloPagina}>
                <Text style={styles.textoSeloPagina}>
                  {aula.paginas.length > 1 ? `${i + 1}/${aula.paginas.length} · ` : ''}
                  {pagina.hora}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {aula.paginas.length > 1 ? (
          <View style={styles.pontos}>
            {aula.paginas.map((p, i) => (
              <View key={p.id} style={[styles.ponto, i === paginaAtual && styles.pontoAtivo]} />
            ))}
          </View>
        ) : null}

        <Text style={styles.titulo}>{aula.titulo}</Text>
        <Text style={styles.topico}>{aula.topico}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaTexto}>{aula.pasta.join(' › ')}</Text>
          <Text style={styles.metaSeparador}>·</Text>
          <Text style={styles.metaTexto}>
            {aula.data} · {aula.hora}
          </Text>
          {aula.aoVivo ? (
            <>
              <Text style={styles.metaSeparador}>·</Text>
              <Text style={styles.metaAoVivo}>LIDO DA FOTO</Text>
            </>
          ) : null}
        </View>

        <LinhaSessao aula={aula} />

        {/* A linha do aprendizado: a camera lembra o que ja viu. */}
        {ligacoes.continua.map((ligada) => (
          <LinhaLigacao
            key={`continua-${ligada.id}`}
            rotulo="Continua"
            icone="history"
            aula={ligada}
            onAbrir={() => navigation.push('Aula', { aulaId: ligada.id })}
          />
        ))}
        {ligacoes.continuadaEm.map((ligada) => (
          <LinhaLigacao
            key={`continuada-${ligada.id}`}
            rotulo="Continuada em"
            icone="arrow-right-bottom"
            aula={ligada}
            onAbrir={() => navigation.push('Aula', { aulaId: ligada.id })}
          />
        ))}

        <View style={styles.acoes}>
          <BotaoOuvir falando={falando} onPress={() => alternar(aula.resumo.join('. '))} />
          <Pressable
            onPress={() => navigation.navigate('Revisao', { aulaId })}
            accessibilityRole="button"
            accessibilityLabel={`Revisar com ${aula.flashcards.length} flashcards`}
            style={({ pressed }) => [styles.pilulaAcao, pressed && styles.pressionado]}
          >
            <MaterialCommunityIcons name="cards-outline" size={16} color={colors.text} />
            <Text style={styles.textoPilula}>Flashcards · {aula.flashcards.length}</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Questions', { aulaId })}
            accessibilityRole="button"
            accessibilityLabel={`Responder ${aula.questoes.length} questões`}
            style={({ pressed }) => [styles.pilulaAcao, pressed && styles.pressionado]}
          >
            <MaterialCommunityIcons name="help-circle-outline" size={16} color={colors.text} />
            <Text style={styles.textoPilula}>Questões · {aula.questoes.length}</Text>
          </Pressable>
        </View>

        <Text style={styles.secao}>Resumo</Text>
        {aula.resumo.map((linha) => (
          <View key={linha} style={styles.linhaResumo}>
            <View style={styles.marcador} />
            <Text style={styles.textoResumo}>{linha}</Text>
          </View>
        ))}

        <View style={styles.cabecalhoTexto}>
          <Text style={styles.secao}>Texto extraído</Text>
          <Pressable
            onPress={() => setTextoAberto((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={textoAberto ? 'Recolher o texto' : 'Ver o texto completo'}
            accessibilityState={{ expanded: textoAberto }}
            hitSlop={spacing(2)}
            style={styles.botaoExpandir}
          >
            <Text style={styles.textoExpandir}>{textoAberto ? 'Recolher' : 'Ver tudo'}</Text>
            <Ionicons
              name={textoAberto ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.primaryHi}
            />
          </Pressable>
        </View>
        <Text style={styles.textoExtraido} numberOfLines={textoAberto ? undefined : LINHAS_TEXTO_FECHADO}>
          {texto}
        </Text>
        <BotaoOuvir
          falando={leituraDoTexto.falando}
          rotulo="Ouvir o texto"
          onPress={() => leituraDoTexto.alternar(texto)}
          style={styles.ouvirTexto}
        />
      </ScrollView>

      <ModalTexto
        aberto={renomeando}
        titulo="Renomear aula"
        placeholder="Nome da aula"
        valorInicial={aula.titulo}
        rotuloConfirmar="Renomear"
        onConfirmar={(v) => {
          renomearAula(aulaId, v);
          return true;
        }}
        onFechar={() => setRenomeando(false)}
      />

      <SeletorPasta
        aberto={movendo}
        titulo="Mover para"
        atual={aula.pasta}
        onEscolher={(pasta) => moverAula(aulaId, pasta)}
        onFechar={() => setMovendo(false)}
      />
    </View>
  );
}

/* --------------------------------------------------------------- sessao */

function LinhaLigacao({
  rotulo,
  icone,
  aula,
  onAbrir,
}: {
  rotulo: string;
  icone: 'history' | 'arrow-right-bottom';
  aula: Aula;
  onAbrir: () => void;
}) {
  return (
    <Pressable
      onPress={onAbrir}
      accessibilityRole="button"
      accessibilityLabel={`${rotulo} a aula ${aula.titulo}. Abrir.`}
      style={({ pressed }) => [styles.sessao, pressed && styles.pressionado]}
    >
      <MaterialCommunityIcons name={icone} size={16} color={colors.primaryHi} />
      <Text style={styles.textoSessao} numberOfLines={2}>
        <Text style={styles.rotuloLigacao}>{rotulo} · </Text>
        {aula.titulo}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.primaryHi} />
    </Pressable>
  );
}

function LinhaSessao({ aula }: { aula: Aula }) {
  if (aula.sessao === null) return null;
  const paginas = `${aula.paginas.length} ${aula.paginas.length === 1 ? 'foto' : 'fotos'}`;

  if (aula.sessao.tipo === 'grade') {
    return (
      <View style={styles.sessao}>
        <MaterialCommunityIcons name="calendar-check-outline" size={16} color={colors.primaryHi} />
        <Text style={styles.textoSessao} numberOfLines={2}>
          {aula.sessao.disciplina} · {aula.sessao.inicio} às {aula.sessao.fim} · {paginas}
        </Text>
      </View>
    );
  }
  if (aula.paginas.length <= 1) return null;
  return (
    <View style={styles.sessao}>
      <MaterialCommunityIcons name="book-open-page-variant-outline" size={16} color={colors.primaryHi} />
      <Text style={styles.textoSessao}>Sessão de estudo · {paginas}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  botaoMenu: {
    width: TOQUE_MIN,
    height: TOQUE_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conteudo: {
    paddingHorizontal: spacing(5),
  },

  paginas: {
    marginTop: spacing(2),
  },
  pagina: {
    height: spacing(52),
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  foto: {
    width: '100%',
    height: '100%',
  },
  semFoto: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
  },
  textoSemFoto: {
    ...font.small,
    color: colors.textFaint,
  },
  seloPagina: {
    position: 'absolute',
    left: spacing(3),
    bottom: spacing(3),
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2.5),
    borderRadius: radius.pill,
    backgroundColor: colors.visor.pilula,
  },
  textoSeloPagina: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fontMono,
    color: colors.visor.icone,
  },
  pontos: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing(1.5),
    marginTop: spacing(3),
  },
  ponto: {
    width: spacing(1.5),
    height: spacing(1.5),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHi,
  },
  pontoAtivo: {
    backgroundColor: colors.primaryHi,
  },

  titulo: {
    ...font.h1,
    color: colors.text,
    marginTop: spacing(5),
  },
  topico: {
    ...font.body,
    color: colors.textDim,
    lineHeight: 20,
    marginTop: spacing(1.5),
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing(1.5),
    marginTop: spacing(3),
  },
  metaTexto: {
    ...font.small,
    color: colors.textFaint,
  },
  metaSeparador: {
    ...font.small,
    color: colors.textFaint,
  },
  metaAoVivo: {
    ...fontDado.rotulo,
    color: colors.primaryHi,
  },
  sessao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginTop: spacing(3),
    paddingVertical: spacing(2.5),
    paddingHorizontal: spacing(3.5),
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  textoSessao: {
    ...font.small,
    color: colors.text,
    flex: 1,
  },
  rotuloLigacao: {
    color: colors.primaryHi,
  },
  ouvirTexto: {
    alignSelf: 'flex-start',
    marginTop: spacing(3),
  },

  acoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
    marginTop: spacing(5),
  },
  pilulaAcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    minHeight: TOQUE_MIN,
    paddingHorizontal: spacing(3.5),
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  pressionado: {
    opacity: 0.7,
  },
  textoPilula: {
    ...font.bodyMed,
    color: colors.text,
  },

  secao: {
    ...font.h3,
    color: colors.text,
    marginTop: spacing(7),
    marginBottom: spacing(3),
  },
  linhaResumo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(3),
    marginBottom: spacing(3),
  },
  marcador: {
    width: spacing(1.5),
    height: spacing(1.5),
    borderRadius: radius.pill,
    backgroundColor: colors.primaryHi,
    marginTop: spacing(2),
  },
  textoResumo: {
    ...font.body,
    color: colors.text,
    lineHeight: 21,
    flex: 1,
  },

  cabecalhoTexto: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  botaoExpandir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    minHeight: TOQUE_MIN,
    marginBottom: spacing(1),
  },
  textoExpandir: {
    ...font.small,
    fontWeight: '600',
    color: colors.primaryHi,
  },
  textoExtraido: {
    fontFamily: fontMono,
    fontSize: 12,
    lineHeight: 19,
    color: colors.textDim,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing(4),
  },
});
