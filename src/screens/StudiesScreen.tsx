import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { ScreenHeader } from '../components/ScreenHeader';
import type { Aula, Pasta } from '../data/mock';
import { aulaCapturada, biblioteca, conteudoIdentificado } from '../data/mock';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import { useFlow } from '../store/FlowContext';
import { TOQUE_MIN, colors, font, fontDado, radius, spacing } from '../theme';

type AbaAtiva = 'pastas' | 'recentes';
type AulaComCaminho = Aula & { caminho: string };

/** Coloca a aula recem-capturada no caminho para onde o Flow disse que ela foi.
 *  Antes ela caia sempre na primeira pasta da lista, entao a tela de organizacao
 *  podia anunciar "Culinaria > Risoto" e a aba Estudos mostrar o item em Design.
 *  Se a materia ou a subpasta ainda nao existirem, elas sao criadas aqui, que e
 *  o que a tela de organizacao promete quando o assunto e novo. */
function inserirNoDestino(acervo: Pasta[], destino: string[], nova: Aula): Pasta[] {
  const [materia, subpasta] = destino;
  if (!materia || !subpasta) return acervo;

  const jaExiste = acervo.some((pasta) => pasta.nome === materia);
  const atualizado = acervo.map((pasta) => {
    if (pasta.nome !== materia) return pasta;
    const temSub = pasta.subpastas.some((sub) => sub.nome === subpasta);
    return {
      ...pasta,
      subpastas: temSub
        ? pasta.subpastas.map((sub) =>
            sub.nome === subpasta ? { ...sub, aulas: [nova, ...sub.aulas] } : sub
          )
        : [{ nome: subpasta, aulas: [nova] }, ...pasta.subpastas],
    };
  });

  return jaExiste
    ? atualizado
    : [
        { nome: materia, icone: 'folder-outline', subpastas: [{ nome: subpasta, aulas: [nova] }] },
        ...atualizado,
      ];
}

/** Converte a data dd/mm/aaaa e a hora hh:mm num numero comparavel. */
function paraOrdem(aula: Aula): number {
  const [dia = '0', mes = '0', ano = '0'] = aula.data.split('/');
  const [hora = '0', minuto = '0'] = aula.hora.split(':');
  return Number(`${ano}${mes.padStart(2, '0')}${dia.padStart(2, '0')}${hora.padStart(2, '0')}${minuto.padStart(2, '0')}`);
}

export function StudiesScreen() {
  const insets = useSafeAreaInsets();
  const reduzir = useReduzirMovimento();

  // Abre em Recentes, e nao na arvore. Cada item da lista ja mostra o caminho
  // da pasta ao lado do titulo, entao a organizacao automatica continua visivel
  // sem a tela ter cara de gerenciador de arquivos. A arvore fica a um toque.
  const [aba, setAba] = useState<AbaAtiva>('recentes');
  const [buscando, setBuscando] = useState(false);
  const [busca, setBusca] = useState('');
  const { destino, classificacao } = useFlow();

  // A materia de destino ja abre expandida: sem isso o usuario chegava aqui
  // depois de capturar e o item novo ficava escondido dentro de uma pasta fechada.
  const [expandidas, setExpandidas] = useState<string[]>(() =>
    destino[0] ? [destino[0]] : ['Design']
  );

  // A subpasta de destino ja nasce aberta, para a captura recente aparecer sem
  // o usuario ter de cavar. As outras ficam fechadas: abrir a materia inteira de
  // uma vez era o que deixava a tela com cara de listagem de arquivos.
  const [subsExpandidas, setSubsExpandidas] = useState<string[]>(() =>
    destino[0] && destino[1] ? [`${destino[0]}/${destino[1]}`] : []
  );

  const nova = useMemo(
    () => aulaCapturada(classificacao?.topico ?? conteudoIdentificado.topico),
    [classificacao]
  );
  const acervo = useMemo<Pasta[]>(
    () => inserirNoDestino(biblioteca, destino, nova),
    [destino, nova]
  );

  const todasAulas = useMemo<AulaComCaminho[]>(
    () =>
      acervo
        .flatMap((pasta) =>
          pasta.subpastas.flatMap((sub) =>
            sub.aulas.map((aula) => ({ ...aula, caminho: `${pasta.nome} › ${sub.nome}` }))
          )
        )
        .sort((a, b) => paraOrdem(b) - paraOrdem(a)),
    [acervo]
  );

  const termo = busca.trim().toLowerCase();
  const filtrar = (aulas: AulaComCaminho[]) =>
    termo === '' ? aulas : aulas.filter((a) => a.titulo.toLowerCase().includes(termo));

  const abrirMenu = (aula: Aula) => {
    Alert.alert(aula.titulo, `${aula.data} · ${aula.hora}`, [
      { text: 'Abrir' },
      { text: 'Renomear' },
      { text: 'Excluir', style: 'destructive' },
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

  return (
    <View style={styles.tela}>
      <ScreenHeader
        title="Meus Estudos"
        right={
          <Pressable
            onPress={() => {
              setBuscando((v) => !v);
              if (buscando) setBusca('');
            }}
            accessibilityRole="button"
            accessibilityLabel={buscando ? 'Fechar a busca' : 'Buscar aulas'}
            accessibilityState={{ selected: buscando }}
            style={styles.botaoBusca}
          >
            <Ionicons
              name={buscando ? 'close' : 'search'}
              size={22}
              color={buscando ? colors.primaryHi : colors.text}
            />
          </Pressable>
        }
      />

      {buscando ? (
        <View style={styles.areaBusca}>
          <Ionicons name="search" size={16} color={colors.textFaint} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por título da aula"
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
          ? acervo.map((pasta) => {
              // Durante a busca tudo abre, senao o resultado ficaria escondido
              // dentro de pasta fechada.
              const aberta = termo !== '' || expandidas.includes(pasta.nome);
              const totalPasta = pasta.subpastas.reduce(
                (t, sub) => t + filtrar(sub.aulas.map((a) => ({ ...a, caminho: sub.nome }))).length,
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
                    <MaterialCommunityIcons
                      name={pasta.icone}
                      size={20}
                      color={colors.textDim}
                    />
                    <Text style={styles.nomePasta}>{pasta.nome}</Text>
                    <Text style={styles.contagem}>{totalPasta}</Text>
                  </Pressable>

                  {aberta
                    ? pasta.subpastas.map((sub) => {
                        const aulas = filtrar(
                          sub.aulas.map((a) => ({ ...a, caminho: sub.nome }))
                        );
                        if (aulas.length === 0) return null;
                        const chave = `${pasta.nome}/${sub.nome}`;
                        const subAberta = termo !== '' || subsExpandidas.includes(chave);
                        return (
                          <View key={sub.nome} style={styles.subpasta}>
                            <Pressable
                              onPress={() => alternarSubpasta(chave)}
                              accessibilityRole="button"
                              accessibilityLabel={`${sub.nome}, ${aulas.length} ${aulas.length === 1 ? 'aula' : 'aulas'}`}
                              accessibilityState={{ expanded: subAberta }}
                              style={({ pressed }) => [
                                styles.cabecalhoSubpasta,
                                pressed && styles.subpastaPressionada,
                              ]}
                            >
                              <Chevron aberto={subAberta} reduzir={reduzir} />
                              <MaterialCommunityIcons
                                name={subAberta ? 'folder-open-outline' : 'folder-outline'}
                                size={16}
                                color={colors.textFaint}
                              />
                              <Text style={styles.nomeSubpasta}>{sub.nome}</Text>
                              <Text style={styles.contagem}>{aulas.length}</Text>
                            </Pressable>

                            {subAberta
                              ? aulas.map((aula) => (
                                  <ItemAula
                                    key={aula.id}
                                    aula={aula}
                                    onMenu={() => abrirMenu(aula)}
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
          : filtrar(todasAulas).map((aula) => (
              <ItemAula
                key={aula.id}
                aula={aula}
                mostrarCaminho
                onMenu={() => abrirMenu(aula)}
              />
            ))}

        {termo !== '' && filtrar(todasAulas).length === 0 ? (
          <View style={styles.vazio}>
            <MaterialCommunityIcons name="file-search-outline" size={32} color={colors.textFaint} />
            <Text style={styles.textoVazio}>Nenhuma aula encontrada para "{busca}"</Text>
          </View>
        ) : null}
      </ScrollView>
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
    const anim = Animated.timing(posicao, {
      toValue: alvo,
      duration: 220,
      useNativeDriver: false,
    });
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
  onMenu,
  mostrarCaminho = false,
}: {
  aula: AulaComCaminho;
  onMenu: () => void;
  mostrarCaminho?: boolean;
}) {
  return (
    <View style={styles.itemAula}>
      <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.textDim} />

      <View style={styles.textosAula}>
        <View style={styles.linhaTitulo}>
          <Text style={styles.tituloAula} numberOfLines={1}>
            {aula.titulo}
          </Text>
          {aula.novo ? <Badge label="NOVO" variant="solid" style={styles.selo} /> : null}
        </View>
        <Text style={styles.metaAula} numberOfLines={1}>
          {mostrarCaminho ? `${aula.caminho} · ` : ''}
          {aula.data} · {aula.hora}
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
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  botaoBusca: {
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
    borderWidth: 1,
    borderColor: colors.border,
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
  cabecalhoSubpasta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    minHeight: TOQUE_MIN,
  },
  subpastaPressionada: {
    opacity: 0.6,
  },
  nomeSubpasta: {
    ...fontDado.rotulo,
    color: colors.textFaint,
    flex: 1,
  },
  /* Contagem em monoespacado: o mesmo tratamento que o resto do app da a dado
     numerico, e evita o numero dancar quando a busca filtra a lista. */
  contagem: {
    ...fontDado.rotulo,
    fontVariant: ['tabular-nums'],
    color: colors.textFaint,
  },

  itemAula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2.5),
    minHeight: spacing(15),
    paddingHorizontal: spacing(3),
    marginBottom: spacing(2),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
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
    gap: spacing(3),
  },
  textoVazio: {
    ...font.small,
    color: colors.textDim,
    textAlign: 'center',
  },
});
