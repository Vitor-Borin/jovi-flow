import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import type { ContextoCaptura } from '../data/mock';
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

const ALTURA_TEXTO_EXTRAIDO = 168;

/**
 * A tela chegou a empilhar nove blocos, sendo quatro cards de campo identicos.
 * Reorganizada por agrupamento, e nao por aperto de espacamento:
 *
 *   antes                             agora
 *   titulo                            (foi para o cabecalho)
 *   selo ao vivo                  \
 *   faixa de sequencia             |  uma linha de metadados
 *   card Materia                   |
 *   card Data                     /
 *   card Tema                     \   viraram o cabecalho de conteudo
 *   card Topico                   /
 *   card de contexto                  card de contexto
 *   rotulo + faixa de ganhos          faixa de ganhos com rotulo embutido
 *   rotulo + texto extraido           texto extraido com rotulo embutido
 *   botao                             botao
 *
 * Nove blocos viraram cinco, e nada de informacao foi perdido.
 */
export function IdentifiedScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  // Vem do contexto, e nao do mock: a tela de Acoes permite editar este texto.
  const { textoExtraido, classificacao, quadrosSequencia, janelaSequencia } = useFlow();
  // O conteudo reconhecido de verdade tem precedencia sobre o simulado.
  const conteudo = classificacao ?? conteudoIdentificado;

  // Calculado uma vez: a data exibida nao pode mudar no meio da apresentacao.
  const dataFormatada = useMemo(() => {
    const agora = new Date();
    const dois = (n: number) => String(n).padStart(2, '0');
    return `${dois(agora.getDate())}/${dois(agora.getMonth() + 1)} · ${dois(agora.getHours())}:${dois(agora.getMinutes())}`;
  }, []);

  const contexto = contextoDaCaptura(conteudo.materia);

  return (
    <View style={styles.tela}>
      <ScreenHeader
        title="Conteúdo identificado"
        onBack={() => navigation.goBack()}
        right={<Badge label="FLOW ATIVO" variant="solid" dot />}
      />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing(6) }]}
      >
        {/* O que foi reconhecido, em vez de quatro caixas com um campo cada. */}
        <Text style={styles.tema}>{conteudo.tema}</Text>
        <Text style={styles.topico}>{conteudo.topico}</Text>

        {/* Metadados numa linha so. O selo de leitura ao vivo entra aqui, em cor
            de destaque: continua visivel sem ocupar um bloco proprio. */}
        <View style={styles.meta}>
          {classificacao !== null ? (
            <View style={styles.itemMeta}>
              <MaterialCommunityIcons name="access-point" size={13} color={colors.primaryHi} />
              <Text style={styles.metaAoVivo}>LIDO DA SUA FOTO</Text>
            </View>
          ) : null}

          <Text style={styles.metaTexto}>{conteudo.materia}</Text>
          <Text style={styles.metaSeparador}>·</Text>
          <Text style={styles.metaTexto}>{dataFormatada}</Text>

          {quadrosSequencia > 1 ? (
            <>
              <Text style={styles.metaSeparador}>·</Text>
              <Text style={styles.metaTexto}>
                {quadrosSequencia} quadros
                {janelaSequencia ? ` (${janelaSequencia.inicio} às ${janelaSequencia.fim})` : ''}
              </Text>
            </>
          ) : null}
        </View>

        {/* [D2] O Flow nao adivinha a materia. Quando a grade confirma, ele diz
            que confirmou; quando nao confirma, ele diz isso tambem. */}
        <CardContexto contexto={contexto} materia={conteudo.materia} />

        {/* [D1] Leitura tecnica do que a camera ganhou, no estilo de um visor.
            O rotulo entra na propria faixa, para nao gastar uma linha inteira. */}
        <View style={styles.faixaGanhos}>
          <Text style={styles.rotuloFaixa}>GANHOS DA CAPTURA · ESTIMATIVA</Text>
          <View style={styles.linhaGanhos}>
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
        </View>

        <Card style={styles.cardTexto}>
          <Text style={styles.rotuloTexto}>TEXTO EXTRAÍDO</Text>
          <ScrollView style={styles.rolagemTexto} nestedScrollEnabled showsVerticalScrollIndicator>
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

function CardContexto({ contexto, materia }: { contexto: ContextoCaptura; materia: string }) {
  if (contexto.tipo === 'assunto-novo') {
    return (
      <View style={styles.cardNovo}>
        <View style={styles.linhaGrade}>
          <MaterialCommunityIcons name="folder-plus-outline" size={20} color={colors.textDim} />
          <Text style={styles.tituloNovo}>Assunto fora da sua grade</Text>
        </View>
        <Text style={styles.rodapeGrade}>
          {materia} não é nenhuma das suas disciplinas, então o Flow vai abrir uma pasta nova.
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
          ? `${DIAS_SEMANA[slot.dia]}, ${slot.inicio} · ${slot.disciplina} · ${slot.remoto ? 'aula remota' : slot.sala}`
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

  tema: {
    ...font.h1,
    color: colors.text,
    marginTop: spacing(3),
  },
  topico: {
    ...font.body,
    color: colors.textDim,
    lineHeight: 20,
    marginTop: spacing(2),
  },

  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing(2),
    marginTop: spacing(4),
    marginBottom: spacing(6),
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
  },
  metaAoVivo: {
    ...fontDado.rotulo,
    color: colors.primaryHi,
  },
  metaTexto: {
    ...font.small,
    color: colors.textFaint,
  },
  metaSeparador: {
    ...font.small,
    color: colors.textFaint,
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

  faixaGanhos: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing(4),
    marginTop: spacing(7),
  },
  rotuloFaixa: {
    ...fontDado.rotulo,
    color: colors.textFaint,
    marginBottom: spacing(3.5),
  },
  linhaGanhos: {
    flexDirection: 'row',
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

  cardTexto: {
    padding: spacing(4),
    marginTop: spacing(7),
  },
  rotuloTexto: {
    ...fontDado.rotulo,
    color: colors.textFaint,
    marginBottom: spacing(3),
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
