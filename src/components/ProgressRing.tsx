import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** 0 a 1. Valores fora do intervalo sao limitados. */
  progress: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
};

export function ProgressRing({ progress, size = 140, stroke = 8, children }: Props) {
  const raio = (size - stroke) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const centro = size / 2;

  const anim = useRef(new Animated.Value(0)).current;
  const [semAnimacao, setSemAnimacao] = useState(false);

  // Se o usuario pediu menos animacao no sistema, o anel vai direto ao valor final.
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((ligado) => {
        if (vivo) setSemAnimacao(ligado);
      })
      .catch(() => {
        // Sem suporte na plataforma: mantem a animacao padrao.
      });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    const alvo = Math.min(Math.max(progress, 0), 1);
    const animacao = Animated.timing(anim, {
      toValue: alvo,
      duration: semAnimacao ? 0 : 400,
      // strokeDashoffset nao e suportado pelo driver nativo.
      useNativeDriver: false,
    });
    animacao.start();
    return () => animacao.stop();
  }, [progress, semAnimacao, anim]);

  const offset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circunferencia, 0],
  });

  const percentual = Math.round(Math.min(Math.max(progress, 0), 1) * 100);

  return (
    <View
      style={[styles.base, { width: size, height: size }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Progresso"
      accessibilityValue={{ min: 0, max: 100, now: percentual }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={centro}
          cy={centro}
          r={raio}
          stroke={colors.border}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={centro}
          cy={centro}
          r={raio}
          stroke={colors.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          rotation={-90}
          originX={centro}
          originY={centro}
        />
      </Svg>
      <View style={styles.miolo}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  miolo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
});
