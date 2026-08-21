import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '../components/Badge';
import { ScreenHeader } from '../components/ScreenHeader';
import type { NomeIcone } from '../data/mock';
import type { RootStackParamList } from '../navigation/types';
import { colors, font, fontDado, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Feasibility'>;

type Onde = 'aparelho' | 'nuvem';

type Capacidade = {
  id: string;
  o_que: string;
  api: string;
  onde: Onde;
};

type Grupo = {
  id: string;
  titulo: string;
  icone: NomeIcone;
  itens: Capacidade[];
};

/**
 * Entregavel pedido no brief da JOVI: viabilidade tecnica usando APIs abertas do
 * Google. Serve tambem para responder a pergunta mais provavel da banca — se o
 * Flow depende de tecnologia que ainda nao existe. Nao depende.
 */
const GRUPOS: Grupo[] = [
  {
    id: 'camera',
    titulo: 'A câmera captura diferente',
    icone: 'camera-iris',
    itens: [
      {
        id: 'scanner',
        o_que: 'Recorte, correção de perspectiva e realce do traço',
        api: 'ML Kit Document Scanner',
        onde: 'aparelho',
      },
      {
        id: 'frames',
        o_que: 'Combinação de múltiplos frames e supressão de reflexo',
        api: 'CameraX / Camera2 + fotografia computacional',
        onde: 'aparelho',
      },
      {
        id: 'cena',
        o_que: 'Reconhecer que o alvo é uma lousa, e não uma paisagem',
        api: 'ML Kit Image Labeling',
        onde: 'aparelho',
      },
    ],
  },
  {
    id: 'entendimento',
    titulo: 'O conteúdo vira texto',
    icone: 'text-recognition',
    itens: [
      {
        id: 'ocr',
        o_que: 'Leitura do texto manuscrito e impresso',
        api: 'ML Kit Text Recognition v2',
        onde: 'aparelho',
      },
      {
        id: 'resumo',
        o_que: 'Resumo em tópicos, flashcards e questões',
        api: 'Gemini API, ou Gemini Nano no aparelho',
        onde: 'nuvem',
      },
      {
        id: 'prototipo',
        o_que: 'No protótipo, a leitura real é feita por um modelo multimodal',
        api: 'Claude (Anthropic) — demonstra o conceito ponta a ponta',
        onde: 'nuvem',
      },
    ],
  },
  {
    id: 'contexto',
    titulo: 'O Flow sabe em que aula você está',
    icone: 'calendar-check-outline',
    itens: [
      {
        id: 'agenda',
        o_que: 'Cruzar horário e local com a grade do estudante',
        api: 'Google Calendar API',
        onde: 'nuvem',
      },
    ],
  },
  {
    id: 'saida',
    titulo: 'O conteúdo chega onde o aluno estuda',
    icone: 'share-variant-outline',
    itens: [
      {
        id: 'classroom',
        o_que: 'Enviar para a turma e para a pasta da disciplina',
        api: 'Google Classroom API e Drive API',
        onde: 'nuvem',
      },
    ],
  },
];

export function FeasibilityScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const total = GRUPOS.reduce((s, g) => s + g.itens.length, 0);
  const noAparelho = GRUPOS.reduce(
    (s, g) => s + g.itens.filter((i) => i.onde === 'aparelho').length,
    0
  );

  return (
    <View style={styles.tela}>
      <ScreenHeader title="Viabilidade técnica" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing(8) }]}
      >
        <Text style={styles.chamada}>
          O JOVI Flow não depende de tecnologia que ainda não existe.
        </Text>
        <Text style={styles.subchamada}>
          Cada peça já tem uma API aberta que a sustenta. O que ninguém fez ainda foi montar tudo
          isso dentro da câmera, funcionando na primeira vez que o estudante abre o aplicativo.
        </Text>

        <View style={styles.faixaResumo}>
          <View style={styles.blocoResumo}>
            <View style={styles.miolodResumo}>
              <Text style={styles.valorResumo}>{total}</Text>
              <Text style={styles.rotuloResumo}>Capacidades</Text>
            </View>
          </View>
          <View style={styles.blocoResumo}>
            <View style={styles.divisorResumo} />
            <View style={styles.miolodResumo}>
              <Text style={styles.valorResumo}>{noAparelho}</Text>
              <Text style={styles.rotuloResumo}>Rodam no aparelho</Text>
            </View>
          </View>
          <View style={styles.blocoResumo}>
            <View style={styles.divisorResumo} />
            <View style={styles.miolodResumo}>
              <Text style={styles.valorResumo}>0</Text>
              <Text style={styles.rotuloResumo}>Tecnologias a inventar</Text>
            </View>
          </View>
        </View>

        {GRUPOS.map((grupo) => (
          <View key={grupo.id} style={styles.grupo}>
            <View style={styles.cabecalhoGrupo}>
              <MaterialCommunityIcons name={grupo.icone} size={18} color={colors.primaryHi} />
              <Text style={styles.tituloGrupo}>{grupo.titulo}</Text>
            </View>

            {grupo.itens.map((item) => (
              <View key={item.id} style={styles.item}>
                <Text style={styles.oQue}>{item.o_que}</Text>
                <View style={styles.linhaApi}>
                  <Text style={styles.api} numberOfLines={2}>
                    {item.api}
                  </Text>
                  <Badge
                    label={item.onde === 'aparelho' ? 'NO APARELHO' : 'NUVEM'}
                    variant={item.onde === 'aparelho' ? 'soft' : 'neutral'}
                  />
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.nota}>
          <MaterialCommunityIcons name="airplane" size={16} color={colors.textDim} />
          <Text style={styles.textoNota}>
            As capacidades marcadas como "no aparelho" funcionam sem internet. É por isso que a
            captura e a leitura do quadro continuam operando numa sala com sinal ruim — que é
            exatamente onde o estudante mais precisa delas.
          </Text>
        </View>

        <Text style={styles.rodape}>
          Por padrão o protótipo simula todas as etapas localmente, para que a demonstração não
          dependa da rede. O modo de análise ao vivo, no Perfil, liga a leitura real da foto por um
          modelo multimodal — e volta sozinho para o conteúdo de exemplo se a rede falhar. Numa
          JOVI de verdade, esse papel seria do Gemini Nano, rodando no próprio aparelho.
        </Text>
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
  chamada: {
    ...font.h2,
    color: colors.text,
    marginTop: spacing(2),
    lineHeight: 27,
  },
  subchamada: {
    ...font.body,
    color: colors.textDim,
    lineHeight: 21,
    marginTop: spacing(3),
  },

  faixaResumo: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing(4),
    marginTop: spacing(6),
  },
  blocoResumo: {
    flex: 1,
    flexDirection: 'row',
  },
  divisorResumo: {
    width: 1,
    backgroundColor: colors.borderSoft,
  },
  miolodResumo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing(1),
  },
  valorResumo: {
    ...fontDado.valorGrande,
    color: colors.primaryHi,
  },
  rotuloResumo: {
    ...font.small,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing(1),
  },

  grupo: {
    marginTop: spacing(8),
  },
  cabecalhoGrupo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginBottom: spacing(4),
  },
  tituloGrupo: {
    ...font.h3,
    color: colors.text,
    flexShrink: 1,
  },
  item: {
    borderLeftWidth: 2,
    borderLeftColor: colors.borderSoft,
    paddingLeft: spacing(4),
    paddingBottom: spacing(4),
  },
  oQue: {
    ...font.body,
    color: colors.text,
    lineHeight: 20,
  },
  linhaApi: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(3),
    marginTop: spacing(2),
  },
  api: {
    ...fontDado.rotulo,
    color: colors.textDim,
    flexShrink: 1,
  },

  nota: {
    flexDirection: 'row',
    gap: spacing(3),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing(4),
    marginTop: spacing(8),
  },
  textoNota: {
    ...font.small,
    color: colors.textDim,
    lineHeight: 18,
    flex: 1,
  },
  rodape: {
    ...font.small,
    color: colors.textFaint,
    lineHeight: 17,
    marginTop: spacing(5),
    textAlign: 'center',
  },
});
