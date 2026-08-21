import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import type { NomeIcone } from '../data/mock';
import { conteudoIdentificado, ganhosCaptura, slotAtual } from '../data/mock';
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
  const { textoExtraido } = useFlow();

  // Calculado uma vez: a data exibida nao pode mudar no meio da apresentacao.
  const { slot, aoVivo, dataFormatada } = useMemo(() => {
    const agora = new Date();
    const r = slotAtual(agora);
    const dois = (n: number) => String(n).padStart(2, '0');
    return {
      slot: r.slot,
      aoVivo: r.aoVivo,
      dataFormatada: `${dois(agora.getDate())}/${dois(agora.getMonth() + 1)}/${agora.getFullYear()} — ${dois(agora.getHours())}:${dois(agora.getMinutes())}`,
    };
  }, []);

  const campos: { rotulo: string; valor: string; icone: NomeIcone }[] = [
    { rotulo: 'Matéria', valor: conteudoIdentificado.materia, icone: 'function-variant' },
    { rotulo: 'Tema', valor: conteudoIdentificado.tema, icone: 'sigma' },
    { rotulo: 'Tópico', valor: conteudoIdentificado.topico, icone: 'bookmark-outline' },
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

        {/* [D2] O diferencial mais forte da tela: o Flow nao adivinha a materia,
            ele confirma com a grade horaria do estudante. */}
        <View style={styles.cardGrade}>
          <View style={styles.linhaGrade}>
            <MaterialCommunityIcons
              name="calendar-check-outline"
              size={20}
              color={colors.primaryHi}
            />
            <Text style={styles.tituloGrade}>Confirmado pela sua grade</Text>
            {aoVivo ? <Badge label="AGORA" variant="solid" style={styles.badgeAgora} /> : null}
          </View>

          <Text style={styles.detalheGrade}>
            {DIAS_SEMANA[slot.dia]}, {slot.inicio} — {slot.disciplina} ·{' '}
            {slot.remoto ? 'aula remota' : slot.sala}
          </Text>

          <Text style={styles.rodapeGrade}>
            O Flow não adivinhou a matéria: ele cruzou com o seu horário.
          </Text>
        </View>

        {/* [D1] Leitura tecnica do que a camera ganhou, no estilo de um visor. */}
        <Text style={styles.tituloSecao}>Ganhos da captura</Text>
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
