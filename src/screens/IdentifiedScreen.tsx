import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { WhiteboardFallback } from '../components/WhiteboardFallback';
import type { ContextoCaptura } from '../data/mock';
import { conteudoIdentificado, contextoDaCaptura } from '../data/mock';
import type { RootStackParamList } from '../navigation/types';
import { lousaDoTratamento, useFlow } from '../store/FlowContext';
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

/** Faixa de proporcao da lousa tratada no topo. Fora dela a imagem cabe inteira
 *  no quadro, sem corte: lousa muito comprida nao vira uma tira fina, e pagina
 *  de caderno em pe nao empurra o conteudo para fora da tela. */
const PROPORCAO_MIN = 1;
const PROPORCAO_MAX = 2.4;

/**
 * O que a camera e a IA entenderam da foto. A foto aparece no topo porque e a
 * prova de que o fluxo trabalhou em cima do que o estudante acabou de
 * fotografar, e nao de um exemplo. Quando o tratamento deu certo, o topo mostra
 * a lousa tratada, que e a mesma imagem que a IA leu e que vai para a aula. Sem
 * numero inventado: a faixa de "ganhos da captura" saiu porque nao era medicao.
 */
export function IdentifiedScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { fotoUri, tratamento, textoExtraido, classificacao, quadrosSequencia, janelaSequencia } =
    useFlow();
  const conteudo = classificacao ?? conteudoIdentificado;
  const lousa = lousaDoTratamento(tratamento);

  // Calculado uma vez: a data exibida nao pode mudar no meio da apresentacao.
  const dataFormatada = useMemo(() => {
    const agora = new Date();
    const dois = (n: number) => String(n).padStart(2, '0');
    return `${dois(agora.getDate())}/${dois(agora.getMonth() + 1)} · ${dois(agora.getHours())}:${dois(agora.getMinutes())}`;
  }, []);

  const contexto = contextoDaCaptura(conteudo.materia);

  return (
    <View style={styles.tela}>
      <ScreenHeader title="Conteúdo identificado" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing(6) }]}
      >
        {lousa ? (
          <View
            style={[
              styles.foto,
              {
                aspectRatio: Math.min(
                  PROPORCAO_MAX,
                  Math.max(PROPORCAO_MIN, lousa.largura / lousa.altura)
                ),
              },
            ]}
          >
            <Image
              source={{ uri: lousa.uri }}
              style={styles.imagem}
              resizeMode="contain"
              accessibilityLabel="Lousa tratada: reta e com a luz por igual"
            />
          </View>
        ) : (
          <View style={[styles.foto, styles.fotoOriginal]}>
            {fotoUri ? (
              <Image source={{ uri: fotoUri }} style={styles.imagem} resizeMode="cover" />
            ) : (
              <WhiteboardFallback style={styles.imagem} compacto />
            )}
          </View>
        )}

        <Text style={styles.tema}>{conteudo.tema}</Text>
        <Text style={styles.topico}>{conteudo.topico}</Text>

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

        {/* O Flow nao adivinha a materia. Quando a grade confirma, ele diz que
            confirmou; quando nao confirma, ele diz isso tambem. */}
        <CardContexto contexto={contexto} materia={conteudo.materia} />

        <View style={styles.blocoTexto}>
          <Text style={styles.rotuloTexto}>TEXTO EXTRAÍDO</Text>
          <ScrollView style={styles.rolagemTexto} nestedScrollEnabled showsVerticalScrollIndicator>
            <Text style={styles.textoExtraido}>{textoExtraido}</Text>
          </ScrollView>
        </View>

        <PrimaryButton
          label="Organizar e salvar"
          onPress={() => navigation.navigate('Organize')}
          style={styles.botao}
        />
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------ card de contexto */

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

  foto: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginTop: spacing(2),
  },
  fotoOriginal: {
    height: spacing(44),
  },
  imagem: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },

  tema: {
    ...font.h1,
    color: colors.text,
    marginTop: spacing(5),
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
    marginTop: spacing(3),
    marginBottom: spacing(5),
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

  blocoTexto: {
    marginTop: spacing(6),
    paddingTop: spacing(4),
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
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
