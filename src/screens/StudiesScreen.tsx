import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '../components/Badge';
import { ModalTexto } from '../components/ModalTexto';
import { ScreenHeader } from '../components/ScreenHeader';
import { SeletorPasta } from '../components/SeletorPasta';
import type { Aula } from '../data/acervo';
import { arvore, ordenarAulas } from '../data/acervo';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { useAcervo } from '../store/AcervoContext';
import { TOQUE_MIN, colors, font, fontDado, radius, spacing } from '../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Estudos'>;
type AbaAtiva = 'pastas' | 'recentes';
type AulaComCaminho = Aula & { caminho: string };

/** Aula das ultimas 24 horas: ganha o selo de nova na lista. */
const MS_NOVA = 24 * 60 * 60 * 1000;

/**
 * O acervo do estudante. Tudo aqui e de verdade: tocar abre a aula, o menu
 * renomeia, move e exclui, e o "+" cria pasta. A arvore vem do store, entao
 * o que a tela Organizar prometeu e o que aparece aqui.
 */
export function StudiesScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const reduzir = useReduzirMovimento();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { acervo, ultimaAulaId, renomearPasta, excluirPasta, renomearAula, moverAula, excluirAula } =
    useAcervo();

  const abrir = route.params?.abrir;
  const [aba, setAba] = useState<AbaAtiva>(abrir ? 'pastas' : 'recentes');
  const [buscando, setBuscando] = useState(false);
  const [busca, setBusca] = useState('');
  const [criandoPasta, setCriandoPasta] = useState(false);
  const [renomeandoPasta, setRenomeandoPasta] = useState<[string, string] | null>(null);
  const [renomeandoAula, setRenomeandoAula] = useState<Aula | null>(null);
  const [movendoAula, setMovendoAula] = useState<Aula | null>(null);

  const pastas = useMemo(() => arvore(acervo), [acervo]);
  const ultima = useMemo(
    () => acervo.aulas.find((a) => a.id === ultimaAulaId) ?? null,
    [acervo.aulas, ultimaAulaId]
  );

  // A pasta pedida na rota (ou a da ultima captura) ja abre expandida, para o
  // item novo nao ficar escondido dentro de pasta fechada. Sem pedido, as
  // materias abrem e as subpastas ficam fechadas: da para ver o acervo inteiro
  // num relance sem a tela virar listagem de arquivos.
  const inicial = abrir ?? ultima?.pasta ?? null;
  const [expandidas, setExpandidas] = useState<string[]>(() =>
    inicial ? [inicial[0]] : pastas.map((p) => p.nome)
  );
  const [subsExpandidas, setSubsExpandidas] = useState<string[]>(() =>
    inicial ? [`${inicial[0]}/${inicial[1]}`] : []
  );

  useEffect(() => {
    if (!abrir) return;
    setAba('pastas');
    setExpandidas((atual) => (atual.includes(abrir[0]) ? atual : [...atual, abrir[0]]));
    const chave = `${abrir[0]}/${abrir[1]}`;
    setSubsExpandidas((atual) => (atual.includes(chave) ? atual : [...atual, chave]));
  }, [abrir]);

  const agora = Date.now();
  const todasAulas = useMemo<AulaComCaminho[]>(
    () => ordenarAulas(acervo.aulas).map((a) => ({ ...a, caminho: `${a.pasta[0]} › ${a.pasta[1]}` })),
    [acervo.aulas]
  );

  const termo = busca.trim().toLowerCase();
  const filtrar = (aulas: AulaComCaminho[]) =>
    termo === ''
      ? aulas
      : aulas.filter(
          (a) => a.titulo.toLowerCase().includes(termo) || a.topico.toLowerCase().includes(termo)
        );

  const abrirAula = (aula: Aula) => navigation.navigate('Aula', { aulaId: aula.id });

  const menuAula = (aula: Aula) => {
    Alert.alert(aula.titulo, `${aula.pasta.join(' › ')} · ${aula.data} · ${aula.hora}`, [
      { text: 'Abrir', onPress: () => abrirAula(aula) },
      { text: 'Renomear', onPress: () => setRenomeandoAula(aula) },
      { text: 'Mover para outra pasta', onPress: () => setMovendoAula(aula) },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Excluir esta aula?', 'As fotos, o resumo e as questões vão junto.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: () => excluirAula(aula.id) },
          ]),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const menuPasta = (materia: string, nome: string, total: number) => {
    Alert.alert(nome, `${materia} · ${total} ${total === 1 ? 'aula' : 'aulas'}`, [
      { text: 'Renomear', onPress: () => setRenomeandoPasta([materia, nome]) },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            'Excluir esta pasta?',
            total > 0
              ? `As ${total} ${total === 1 ? 'aula vai' : 'aulas vão'} junto.`
              : 'A pasta está vazia.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Excluir', style: 'destructive', onPress: () => excluirPasta(materia, nome) },
            ]
          ),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const alternarPasta = (nome: string) =>
    setExpandidas((atual) =>
      atual.includes(nome) ? atual.filter((n) => n !== nome) : [...atual, nome]
    );

  const alternarSubpasta = (chave: string) =>
    setSubsExpandidas((atual) =>
      atual.includes(chave) ? atual.filter((n) => n !== chave) : [...atual, chave]
    );

  const listaRecentes = filtrar(todasAulas);

  return (
    <View style={styles.tela}>
      <ScreenHeader
        title="Meus Estudos"
        right={
          <View style={styles.acoesCabecalho}>
            <Pressable
              onPress={() => {
                setBuscando((v) => !v);
                if (buscando) setBusca('');
              }}
              accessibilityRole="button"
              accessibilityLabel={buscando ? 'Fechar a busca' : 'Buscar aulas'}
              accessibilityState={{ selected: buscando }}
              style={styles.botaoCabecalho}
            >
              <Ionicons
                name={buscando ? 'close' : 'search'}
                size={22}
                color={buscando ? colors.primaryHi : colors.text}
              />
            </Pressable>
            <Pressable
              onPress={() => setCriandoPasta(true)}
              accessibilityRole="button"
              accessibilityLabel="Criar uma pasta nova"
              style={styles.botaoCabecalho}
            >
              <MaterialCommunityIcons name="folder-plus-outline" size={22} color={colors.text} />
            </Pressable>
          </View>
        }
      />

      {buscando ? (
        <View style={styles.areaBusca}>
          <Ionicons name="search" size={16} color={colors.textFaint} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por título ou assunto"
            placeholderTextColor={colors.textFaint}
            style={styles.campoBusca}
            autoFocus
            accessibilityLabel="Campo de busca de aulas"
          />
        </View>
      ) : null}

      <Abas ativa={aba} onTrocar={setAba} reduzir={reduzir} />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing(6) }]}
      >
        {aba === 'pastas'
          ? pastas.map((pasta) => {
              const aberta = termo !== '' || expandidas.includes(pasta.nome);
              const totalPasta = pasta.subpastas.reduce(
                (t, sub) =>
                  t + filtrar(sub.aulas.map((a) => ({ ...a, caminho: sub.nome }))).length,
                0
              );
              if (termo !== '' && totalPasta === 0) return null;
              return (
                <View key={pasta.nome} style={styles.grupo}>
                  <Pressable
                    onPress={() => alternarPasta(pasta.nome)}
                    accessibilityRole="button"
                    accessibilityLabel={`${pasta.nome}, ${totalPasta} ${totalPasta === 1 ? 'aula' : 'aulas'}`}
                    accessibilityState={{ expanded: aberta }}
                    style={styles.cabecalhoPasta}
                  >
                    <Chevron aberto={aberta} reduzir={reduzir} />
                    <MaterialCommunityIcons name={pasta.icone} size={20} color={colors.textDim} />
                    <Text style={styles.nomePasta}>{pasta.nome}</Text>
                    <Text style={styles.contagem}>{totalPasta}</Text>
                  </Pressable>

                  {aberta
                    ? pasta.subpastas.map((sub) => {
                        const aulas = filtrar(
                          sub.aulas.map((a) => ({ ...a, caminho: sub.nome }))
                        );
                        if (termo !== '' && aulas.length === 0) return null;
                        const chave = `${pasta.nome}/${sub.nome}`;
                        const subAberta = termo !== '' || subsExpandidas.includes(chave);
                        return (
                          <View key={sub.nome} style={styles.subpasta}>
                            <View style={styles.linhaSubpasta}>
                              <Pressable
                                onPress={() => alternarSubpasta(chave)}
                                accessibilityRole="button"
                                accessibilityLabel={`${sub.nome}, ${aulas.length} ${aulas.length === 1 ? 'aula' : 'aulas'}`}
                                accessibilityState={{ expanded: subAberta }}
                                style={({ pressed }) => [
                                  styles.cabecalhoSubpasta,
                                  pressed && styles.pressionado,
                                ]}
                              >
                                <Chevron aberto={subAberta} reduzir={reduzir} />
                                <MaterialCommunityIcons
                                  name={subAberta ? 'folder-open-outline' : 'folder-outline'}
                                  size={16}
                                  color={colors.textFaint}
                                />
                                <Text style={styles.nomeSubpasta} numberOfLines={1}>
                                  {sub.nome}
                                </Text>
                                <Text style={styles.contagem}>{aulas.length}</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => menuPasta(pasta.nome, sub.nome, sub.aulas.length)}
                                accessibilityRole="button"
                                accessibilityLabel={`Opções da pasta ${sub.nome}`}
                                hitSlop={spacing(2)}
                                style={styles.botaoMenu}
                              >
                                <MaterialCommunityIcons name="dots-vertical" size={18} color={colors.textFaint} />
                              </Pressable>
                            </View>

                            {subAberta
                              ? aulas.length === 0
                                ? (
                                    <Text style={styles.pastaVazia}>Pasta vazia</Text>
                                  )
                                : aulas.map((aula) => (
                                    <ItemAula
                                      key={aula.id}
                                      aula={aula}
                                      nova={agora - aula.atualizadaEm < MS_NOVA}
                                      onAbrir={() => abrirAula(aula)}
                                      onMenu={() => menuAula(aula)}
                                    />
                                  ))
                              : null}
                          </View>
                        );
                      })
                    : null}
                </View>
              );
            })
          : listaRecentes.map((aula) => (
              <ItemAula
                key={aula.id}
                aula={aula}
                nova={agora - aula.atualizadaEm < MS_NOVA}
                mostrarCaminho
                onAbrir={() => abrirAula(aula)}
                onMenu={() => menuAula(aula)}
              />
            ))}

        {termo !== '' && listaRecentes.length === 0 ? (
          <View style={styles.vazio}>
            <MaterialCommunityIcons name="file-search-outline" size={32} color={colors.textFaint} />
            <Text style={styles.textoVazio}>Nenhuma aula encontrada para "{busca}"</Text>
          </View>
        ) : null}

        {termo === '' && acervo.aulas.length === 0 ? (
          <View style={styles.vazio}>
            <MaterialCommunityIcons name="camera-outline" size={32} color={colors.textFaint} />
            <Text style={styles.textoVazio}>
              Nenhuma aula ainda. Abra a câmera no modo Aula e fotografe a lousa.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <SeletorPasta
        aberto={criandoPasta}
        titulo="Nova pasta"
        atual={null}
        apenasCriar
        onEscolher={(pasta) => {
          setAba('pastas');
          setExpandidas((atual) => (atual.includes(pasta[0]) ? atual : [...atual, pasta[0]]));
          setSubsExpandidas((atual) => [...atual, `${pasta[0]}/${pasta[1]}`]);
        }}
        onFechar={() => setCriandoPasta(false)}
      />

      <ModalTexto
        aberto={renomeandoPasta !== null}
        titulo="Renomear pasta"
        descricao={renomeandoPasta ? `Dentro de ${renomeandoPasta[0]}` : undefined}
        placeholder="Nome da pasta"
        valorInicial={renomeandoPasta?.[1] ?? ''}
        rotuloConfirmar="Renomear"
        erro="Já existe uma pasta com esse nome."
        onConfirmar={(v) => {
          if (!renomeandoPasta) return false;
          const ok = renomearPasta(renomeandoPasta[0], renomeandoPasta[1], v);
          if (ok) {
            setSubsExpandidas((atual) => [...atual, `${renomeandoPasta[0]}/${v.trim()}`]);
          }
          return ok;
        }}
        onFechar={() => setRenomeandoPasta(null)}
      />

      <ModalTexto
        aberto={renomeandoAula !== null}
        titulo="Renomear aula"
        placeholder="Nome da aula"
        valorInicial={renomeandoAula?.titulo ?? ''}
        rotuloConfirmar="Renomear"
        onConfirmar={(v) => {
          if (renomeandoAula) renomearAula(renomeandoAula.id, v);
          return true;
        }}
        onFechar={() => setRenomeandoAula(null)}
      />

      <SeletorPasta
        aberto={movendoAula !== null}
        titulo="Mover para"
        atual={movendoAula?.pasta ?? null}
        onEscolher={(pasta) => {
          if (movendoAula) moverAula(movendoAula.id, pasta);
          setExpandidas((atual) => (atual.includes(pasta[0]) ? atual : [...atual, pasta[0]]));
          setSubsExpandidas((atual) => [...atual, `${pasta[0]}/${pasta[1]}`]);
        }}
        onFechar={() => setMovendoAula(null)}
      />
    </View>
  );
}

/* --------------------------------------------------------------------- abas */

function Abas({
  ativa,
  onTrocar,
  reduzir,
}: {
  ativa: AbaAtiva;
  onTrocar: (a: AbaAtiva) => void;
  reduzir: boolean;
}) {
  const posicao = useRef(new Animated.Value(ativa === 'pastas' ? 0 : 1)).current;

  useEffect(() => {
    const alvo = ativa === 'pastas' ? 0 : 1;
    if (reduzir) {
      posicao.setValue(alvo);
      return;
    }
    const anim = Animated.timing(posicao, { toValue: alvo, duration: 220, useNativeDriver: false });
    anim.start();
    return () => anim.stop();
  }, [ativa, reduzir, posicao]);

  const deslocamento = posicao.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.abas}>
      {(['pastas', 'recentes'] as const).map((id) => (
        <Pressable
          key={id}
          onPress={() => onTrocar(id)}
          accessibilityRole="tab"
          accessibilityLabel={id === 'pastas' ? 'Pastas' : 'Recentes'}
          accessibilityState={{ selected: ativa === id }}
          style={styles.aba}
        >
          <Text style={[styles.textoAba, ativa === id && styles.textoAbaAtiva]}>
            {id === 'pastas' ? 'Pastas' : 'Recentes'}
          </Text>
        </Pressable>
      ))}

      <Animated.View style={[styles.indicador, { left: deslocamento }]} />
    </View>
  );
}

/* ------------------------------------------------------------------ chevron */

function Chevron({ aberto, reduzir }: { aberto: boolean; reduzir: boolean }) {
  const giro = useRef(new Animated.Value(aberto ? 1 : 0)).current;

  useEffect(() => {
    const alvo = aberto ? 1 : 0;
    if (reduzir) {
      giro.setValue(alvo);
      return;
    }
    const anim = Animated.timing(giro, { toValue: alvo, duration: 180, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [aberto, reduzir, giro]);

  const rotacao = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <Animated.View style={{ transform: [{ rotate: rotacao }] }}>
      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </Animated.View>
  );
}

/* ---------------------------------------------------------------- item de aula */

function ItemAula({
  aula,
  nova,
  onAbrir,
  onMenu,
  mostrarCaminho = false,
}: {
  aula: AulaComCaminho;
  nova: boolean;
  onAbrir: () => void;
  onMenu: () => void;
  mostrarCaminho?: boolean;
}) {
  return (
    <Pressable
      onPress={onAbrir}
      onLongPress={onMenu}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${aula.titulo}`}
      accessibilityHint="Toque e segure para mais opções"
      style={({ pressed }) => [styles.itemAula, pressed && styles.itemAulaPressionado]}
    >
      <MaterialCommunityIcons
        name={aula.paginas.length > 1 ? 'file-document-multiple-outline' : 'file-document-outline'}
        size={18}
        color={colors.textDim}
      />

      <View style={styles.textosAula}>
        <View style={styles.linhaTitulo}>
          <Text style={styles.tituloAula} numberOfLines={1}>
            {aula.titulo}
          </Text>
          {nova ? <Badge label="NOVO" variant="solid" style={styles.selo} /> : null}
        </View>
        <Text style={styles.metaAula} numberOfLines={1}>
          {mostrarCaminho ? `${aula.caminho} · ` : ''}
          {aula.data} · {aula.hora}
          {aula.paginas.length > 1 ? ` · ${aula.paginas.length} fotos` : ''}
        </Text>
      </View>

      <Pressable
        onPress={onMenu}
        accessibilityRole="button"
        accessibilityLabel={`Ações da aula ${aula.titulo}`}
        hitSlop={spacing(2)}
        style={styles.botaoMenu}
      >
        <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.textDim} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  acoesCabecalho: {
    flexDirection: 'row',
  },
  botaoCabecalho: {
    width: TOQUE_MIN,
    height: TOQUE_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },

  areaBusca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginHorizontal: spacing(5),
    marginBottom: spacing(2),
    paddingHorizontal: spacing(3),
    height: TOQUE_MIN,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  campoBusca: {
    flex: 1,
    ...font.body,
    color: colors.text,
    padding: 0,
  },

  abas: {
    flexDirection: 'row',
    marginHorizontal: spacing(5),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  aba: {
    flex: 1,
    minHeight: TOQUE_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoAba: {
    ...font.bodyMed,
    color: colors.textDim,
  },
  textoAbaAtiva: {
    color: colors.primaryHi,
  },
  indicador: {
    position: 'absolute',
    bottom: -1,
    width: '50%',
    height: 2,
    backgroundColor: colors.primary,
  },

  conteudo: {
    paddingHorizontal: spacing(5),
    paddingTop: spacing(4),
  },
  grupo: {
    marginBottom: spacing(3),
  },
  cabecalhoPasta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2.5),
    minHeight: TOQUE_MIN,
  },
  nomePasta: {
    ...font.h3,
    color: colors.text,
    flex: 1,
  },
  subpasta: {
    marginLeft: spacing(6),
    marginTop: spacing(1),
  },
  linhaSubpasta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cabecalhoSubpasta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    minHeight: TOQUE_MIN,
  },
  pressionado: {
    opacity: 0.6,
  },
  nomeSubpasta: {
    ...font.small,
    fontWeight: '600',
    color: colors.textDim,
    flex: 1,
  },
  contagem: {
    ...fontDado.rotulo,
    fontVariant: ['tabular-nums'],
    color: colors.textFaint,
  },
  pastaVazia: {
    ...font.small,
    color: colors.textFaint,
    paddingVertical: spacing(2),
    paddingLeft: spacing(6),
  },

  itemAula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2.5),
    minHeight: spacing(15),
    paddingLeft: spacing(3),
    marginBottom: spacing(2),
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  itemAulaPressionado: {
    backgroundColor: colors.surfaceAlt,
  },
  textosAula: {
    flex: 1,
  },
  linhaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  tituloAula: {
    ...font.bodyMed,
    color: colors.text,
    flexShrink: 1,
  },
  selo: {
    paddingVertical: spacing(0.5),
    paddingHorizontal: spacing(1.5),
  },
  metaAula: {
    ...font.small,
    color: colors.textFaint,
    marginTop: spacing(0.5),
  },
  botaoMenu: {
    width: TOQUE_MIN,
    height: TOQUE_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vazio: {
    alignItems: 'center',
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(6),
    gap: spacing(3),
  },
  textoVazio: {
    ...font.small,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 18,
  },
});
