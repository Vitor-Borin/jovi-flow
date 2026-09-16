import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { proximaAula } from '../data/mock';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import { colors, font, fontDado, radius, spacing } from '../theme';
import { Badge } from './Badge';

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Hoje, amanha ou o dia da semana. Sem isso, num sabado o cartao mostrava so
 *  o horario da aula de segunda e parecia que ela era hoje. */
function quando(dia: number, agora: Date): string {
  const hoje = agora.getDay();
  if (dia === hoje) return 'hoje';
  if (dia === (hoje + 1) % 7) return 'amanhã';
  return DIAS[dia] ?? '';
}

/**
 * O agora da grade horaria, no topo de Aulas [D2]. Era o cartao principal da
 * antiga tela Inicio: o dashboard saiu porque o Flow nao e um aplicativo, mas a
 * grade continua dando contexto a quem abre as aulas.
 */
export function CartaoAgora() {
  const reduzir = useReduzirMovimento();
  const { slot, emAula, dia } = useMemo(() => {
    const agora = new Date();
    const r = proximaAula(agora);
    return { slot: r.slot, emAula: r.emAula, dia: quando(r.slot.dia, agora) };
  }, []);

  return (
    <View style={[styles.cartao, emAula && styles.cartaoEmAula]}>
      <View style={styles.linhaTopo}>
        <Text style={styles.rotulo}>{emAula ? 'VOCÊ ESTÁ EM AULA' : 'SUA PRÓXIMA AULA'}</Text>
        {emAula ? <PontoAoVivo reduzir={reduzir} /> : null}
      </View>

      <Text style={styles.disciplina} numberOfLines={2}>
        {slot.disciplina}
      </Text>

      <View style={styles.meta}>
        <View style={styles.itemMeta}>
          <MaterialCommunityIcons name="clock-outline" size={15} color={colors.textDim} />
          <Text style={styles.textoMeta}>
            {emAula ? `até ${slot.fim}` : `${dia}, ${slot.inicio} às ${slot.fim}`}
          </Text>
        </View>
        <View style={styles.itemMeta}>
          <MaterialCommunityIcons
            name={slot.remoto ? 'laptop' : 'map-marker-outline'}
            size={15}
            color={colors.textDim}
          />
          <Text style={styles.textoMeta}>{slot.remoto ? 'Aula remota' : slot.sala}</Text>
        </View>
      </View>
    </View>
  );
}

function PontoAoVivo({ reduzir }: { reduzir: boolean }) {
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduzir) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduzir, pulso]);

  const opacidade = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] });

  return (
    <Animated.View style={{ opacity: opacidade }}>
      <Badge label="AGORA" variant="solid" dot />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(4),
    marginTop: spacing(3),
    marginBottom: spacing(2),
  },
  cartaoEmAula: {
    backgroundColor: colors.primarySoft,
  },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rotulo: {
    ...fontDado.rotulo,
    color: colors.primaryHi,
    flexShrink: 1,
  },
  disciplina: {
    ...font.h3,
    color: colors.text,
    marginTop: spacing(2),
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(4),
    marginTop: spacing(2),
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
  },
  textoMeta: {
    ...font.small,
    color: colors.textDim,
  },
});
