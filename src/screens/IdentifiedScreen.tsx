import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import type { ContextoCaptura, NomeIcone } from '../data/mock';
import { conteudoIdentificado, contextoDaCaptura, ganhosCaptura } from '../data/mock';
import type { RootStackParamList } from '../navigation/types';
import { useFlow } from '../store/FlowContext';
import { colors, font, fontDado, fontMono, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Identified'>;

const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const ALTURA_TEXTO_EXTRAIDO = 180;

export function IdentifiedScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  // Vem do contexto, e nao do mock: a tela de Acoes permite editar este texto.
  const { textoExtraido, classificacao, quadrosSequencia, janelaSequencia } = useFlow();
  // O conteudo reconhecido de verdade tem precedencia sobre o simulado.
  const conteudo = classificacao ?? conteudoIdentificado;

  // Calculado uma vez: a data exibida nao pode mudar no meio da apresentacao.
  // O contexto depende da materia detectada, entao recalcula quando a leitura
  // real chega e substitui o exemplo.
  const dataFormatada = useMemo(() => {
    const agora = new Date();
    const dois = (n: number) => String(n).padStart(2, '0');
    return `${dois(agora.getDate())}/${dois(agora.getMonth() + 1)}/${agora.getFullYear()} — ${dois(agora.getHours())}:${dois(agora.getMinutes())}`;
  }, []);

  const contexto = contextoDaCaptura(conteudo.materia);

  const campos: { rotulo: string; valor: string; icone: NomeIcone }[] = [
    { rotulo: 'Matéria', valor: conteudo.materia, icone: 'function-variant' },
    { rotulo: 'Tema', valor: conteudo.tema, icone: 'sigma' },
    { rotulo: 'Tópico', valor: conteudo.topico, icone: 'bookmark-outline' },
    { rotulo: 'Data', valor: dataFormatada, icone: 'calendar-blank-outline' },
  ];

  return (
    <View style={styles.tela}>
      <ScreenHeader
        onBack={() => navigation.goBack()}
        right={<Badge label="FLOW ATIVO" variant="solid" dot />}
      />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing(6) }]}
      >
        <Text style={styles.titulo}>Conteúdo identificado</Text>

        {/* Deixa visivel na tela quando o conteudo veio da foto real, e nao do
            exemplo. E o que separa a demonstracao de um mockup. */}
        {classificacao !== null ? (
          <View style={styles.seloAoVivo}>
            <MaterialCommunityIcons name="access-point" size={14} color={colors.primaryHi} />
            <Text style={styles.textoSeloAoVivo}>LIDO DA SUA FOTO, AGORA</Text>
          </View>
        ) : null}

        {/* A captura continua nao pode terminar em silencio: se ela guardou
            quadros, eles fazem parte do que foi capturado. */}
        {quadrosSequencia > 1 ? (
          <View style={styles.faixaSequencia}>
            <MaterialCommunityIcons name="camera-burst" size={18} color={colors.primaryHi} />
            <Text style={styles.textoSequencia}>
              <Text style={styles.destaqueSequencia}>{quadrosSequencia} quadros</Text> guardados pela
              captura contínua
              {janelaSequencia ? `, das ${janelaSequencia.inicio} às ${janelaSequencia.fim}` : ''}
            </Text>
          </View>
        ) : null}

        {/* [D2] O Flow nao adivinha a materia. Quando a grade confirma, ele diz
            que confirmou; quando nao confirma, ele diz isso tambem, em vez de
            afirmar um horario que nao esta acontecendo. */}
        <CardContexto contexto={contexto} materia={conteudo.materia} />

        {/* [D1] Leitura tecnica do que a camera ganhou, no estilo de um visor. */}
        <Text style={styles.tituloSecao}>Ganhos da captura · estimativa</Text>
        <View style={styles.faixaGanhos}>
          {ganhosCaptura.map((ganho, indice) => (
            <View key={ganho.label} style={styles.blocoGanho}>
              {indice > 0 ? <View style={styles.divisorVertical} /> : null}
              <View style={styles.miolodGanho}>
                <Text style={styles.valorGanho} numberOfLines={1} adjustsFontSizeToFit>
                  {ganho.valor}
                </Text>
                <Text style={styles.rotuloGanho} numberOfLines={2}>
                  {ganho.label}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.campos}>
          {campos.map((campo) => (
            <View key={campo.rotulo} style={styles.campo}>
              <Text style={styles.rotuloCampo}>{campo.rotulo}</Text>
              <Card style={styles.cardCampo}>
                <MaterialCommunityIcons name={campo.icone} size={18} color={colors.textDim} />
                <Text style={styles.valorCampo} numberOfLines={2}>
                  {campo.valor}
                </Text>
              </Card>
            </View>
          ))}
        </View>

        <Text style={styles.rotuloCampo}>Texto extraído</Text>
        <Card style={styles.cardTexto}>
          <ScrollView
            style={styles.rolagemTexto}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            <Text style={styles.textoExtraido}>{textoExtraido}</Text>
          </ScrollView>
        </Card>

        <PrimaryButton
          label="Organizar e salvar"
          onPress={() => navigation.navigate('Organize')}
          style={styles.botao}
        />
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------- card de contexto [D2] */

function CardContexto({
  contexto,
  materia,
}: {
  contexto: ContextoCaptura;
  materia: string;
}) {
  if (contexto.tipo === 'assunto-novo') {
    return (
      <View style={styles.cardNovo}>
        <View style={styles.linhaGrade}>
          <MaterialCommunityIcons name="folder-plus-outline" size={20} color={colors.textDim} />
          <Text style={styles.tituloNovo}>Assunto fora da sua grade</Text>
        </View>
        <Text style={styles.detalheGrade}>{materia}</Text>
        <Text style={styles.rodapeGrade}>
          Não é nenhuma das suas disciplinas, então o Flow vai abrir uma pasta nova para este
          assunto.
        </Text>
      </View>
    );
  }

  const { slot } = contexto;
  const emAula = contexto.tipo === 'em-aula';

  return (
    <View style={styles.cardGrade}>
      <View style={styles.linhaGrade}>
        <MaterialCommunityIcons
          name={emAula ? 'calendar-check-outline' : 'school-outline'}
          size={20}
          color={colors.primaryHi}
        />
        <Text style={styles.tituloGrade}>
          {emAula ? 'Confirmado pela sua grade' : 'Uma das suas disciplinas'}
        </Text>
        {emAula ? <Badge label="AGORA" variant="solid" style={styles.badgeAgora} /> : null}
      </View>

      <Text style={styles.detalheGrade}>
        {emAula
          ? `${DIAS_SEMANA[slot.dia]}, ${slot.inicio} — ${slot.disciplina} · ${slot.remoto ? 'aula remota' : slot.sala}`
          : slot.disciplina}
      </Text>

      <Text style={styles.rodapeGrade}>
        {emAula
          ? 'O Flow não adivinhou a matéria: ele cruzou com o seu horário.'
          : 'Você não está em aula agora, mas este assunto é de uma disciplina que você cursa.'}
      </Text>
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
  titulo: {
    ...font.h1,
    color: colors.text,
    marginTop: spacing(2),
    marginBottom: spacing(5),
  },

  seloAoVivo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.primaryEdge,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(3),
    marginTop: -spacing(2),
    marginBottom: spacing(4),
  },
  textoSeloAoVivo: {
    ...fontDado.rotulo,
    color: colors.primaryHi,
  },

  faixaSequencia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2.5),
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(3.5),
    marginBottom: spacing(4),
  },
  textoSequencia: {
    ...font.small,
    color: colors.textDim,
    flex: 1,
    lineHeight: 17,
  },
  destaqueSequencia: {
    ...font.bodyMed,
    fontSize: 12,
    color: colors.text,
  },
  cardNovo: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing(4),
  },
  tituloNovo: {
    ...font.h3,
    color: colors.text,
    flexShrink: 1,
  },
  cardGrade: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryEdge,
    borderRadius: radius.md,
    padding: spacing(4),
  },
  linhaGrade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  tituloGrade: {
    ...font.h3,
    color: colors.primaryHi,
    flexShrink: 1,
  },
  badgeAgora: {
    marginLeft: 'auto',
  },
  detalheGrade: {
    ...font.bodyMed,
    color: colors.text,
    marginTop: spacing(2.5),
  },
  rodapeGrade: {
    ...font.small,
    color: colors.textDim,
    marginTop: spacing(2),
    lineHeight: 17,
  },

  tituloSecao: {
    ...fontDado.rotulo,
    color: colors.textDim,
    marginTop: spacing(7),
    marginBottom: spacing(3),
  },
  faixaGanhos: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing(4),
  },
  blocoGanho: {
    flex: 1,
    flexDirection: 'row',
  },
  divisorVertical: {
    width: 1,
    backgroundColor: colors.borderSoft,
    marginRight: spacing(3),
  },
  miolodGanho: {
    flex: 1,
    alignItems: 'center',
  },
  valorGanho: {
    ...fontDado.valorGrande,
    fontSize: 22,
    color: colors.primaryHi,
  },
  rotuloGanho: {
    ...font.small,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing(1.5),
  },

  campos: {
    marginTop: spacing(7),
  },
  campo: {
    marginBottom: spacing(4),
  },
  rotuloCampo: {
    ...fontDado.rotulo,
    color: colors.textDim,
    marginBottom: spacing(2),
  },
  cardCampo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2.5),
    paddingVertical: spacing(3.5),
  },
  valorCampo: {
    ...font.bodyMed,
    color: colors.text,
    flexShrink: 1,
  },

  cardTexto: {
    padding: spacing(3),
  },
  rolagemTexto: {
    maxHeight: ALTURA_TEXTO_EXTRAIDO,
  },
  textoExtraido: {
    fontFamily: fontMono,
    fontSize: 11,
    lineHeight: 18,
    color: colors.textDim,
  },

  botao: {
    marginTop: spacing(7),
  },
});
