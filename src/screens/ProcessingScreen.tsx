import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GhostButton } from '../components/GhostButton';
import { ProgressRing } from '../components/ProgressRing';
import { StepList } from '../components/StepList';
import { WhiteboardFallback } from '../components/WhiteboardFallback';
import { etapasCamera, etapasIA } from '../data/mock';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import type { RootStackParamList } from '../navigation/types';
import { analisarCaptura } from '../services/analiseAoVivo';
import { useFlow } from '../store/FlowContext';
import { colors, font, fontDado, radius, shadow, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Processing'>;

/** A tela tem tres momentos. A transicao entre eles e a cena mais importante do
 *  pitch: e onde fica provado que a CAMERA trabalhou antes da IA. */
type Momento = 'camera' | 'transicao' | 'ia';

const MS_POR_ETAPA = 600;
const MS_TRANSICAO = 1600;
const MS_RESPIRO = 320;

export function ProcessingScreen({ navigation }: Props) {
  const [momento, setMomento] = useState<Momento>('camera');
  const [indice, setIndice] = useState(0);
  const montado = useRef(true);
  const { modoAoVivo, fotoBase64, definirAnalise, definirTexto } = useFlow();
  const [statusAoVivo, setStatusAoVivo] = useState<'off' | 'analisando' | 'ok' | 'simulado'>(
    modoAoVivo ? 'analisando' : 'off'
  );

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  // A analise real roda EM PARALELO com a animacao, que dura cerca de 6,4s.
  // Como a chamada se esconde atras dela, o modo ao vivo nao adiciona nenhuma
  // espera percebida: ou a resposta chega dentro da janela, ou o app segue com o
  // conteudo simulado sem que ninguem note.
  useEffect(() => {
    if (!modoAoVivo) return;
    let vivo = true;

    void analisarCaptura(fotoBase64).then((r) => {
      if (!vivo) return;

      if (r.estado === 'ok') {
        // Escrever no contexto e seguro mesmo se esta tela ja saiu: quem exibe e
        // a tela seguinte. Uma resposta que chega tarde ainda substitui o
        // conteudo de exemplo, em vez de ser jogada fora.
        definirAnalise(r.conteudo);
        definirTexto(r.conteudo.textoExtraido);
        console.log(`[JOVI Flow] analise ao vivo OK em ${r.ms}ms: ${r.conteudo.topico}`);
      } else {
        console.log('[JOVI Flow] analise ao vivo indisponivel, usando conteudo simulado:', r.estado);
      }

      // O indicador e estado local: so atualiza se a tela ainda estiver viva.
      if (montado.current) setStatusAoVivo(r.estado === 'ok' ? 'ok' : 'simulado');
    });

    return () => {
      vivo = false;
    };
  }, [modoAoVivo, fotoBase64, definirAnalise, definirTexto]);

  // Toda a coreografia e agendada de uma vez e limpa junto. Timer sobrevivendo ao
  // unmount e a causa numero 1 de crash aleatorio em demonstracao.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const agendar = (ms: number, acao: () => void) => {
      timers.push(
        setTimeout(() => {
          if (montado.current) acao();
        }, ms)
      );
    };

    let t = 0;

    for (let i = 1; i <= etapasCamera.length; i += 1) {
      t += MS_POR_ETAPA;
      agendar(t, () => setIndice(i));
    }

    t += MS_RESPIRO;
    agendar(t, () => {
      setMomento('transicao');
      setIndice(0);
    });

    t += MS_TRANSICAO;
    agendar(t, () => setMomento('ia'));

    for (let i = 1; i <= etapasIA.length; i += 1) {
      t += MS_POR_ETAPA;
      agendar(t, () => setIndice(i));
    }

    t += MS_RESPIRO;
    // replace, e nao navigate: o botao voltar nao pode retornar ao processamento.
    agendar(t, () => navigation.replace('Identified'));

    return () => timers.forEach(clearTimeout);
  }, [navigation]);

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tela, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.corpo}>
        {momento === 'transicao' ? (
          <CenaAntesDepois />
        ) : (
          <FaseProcessamento
            titulo={momento === 'camera' ? 'Otimizando captura...' : 'Analisando conteúdo...'}
            subtitulo={
              momento === 'camera'
                ? 'A câmera está ajustando a imagem da lousa.'
                : 'Isso pode levar alguns segundos.'
            }
            icone={momento === 'camera' ? 'camera-iris' : 'brain'}
            etapas={momento === 'camera' ? etapasCamera : etapasIA}
            indice={indice}
          />
        )}
      </View>

      <View style={styles.rodape}>
        {statusAoVivo !== 'off' ? (
          <Text style={styles.selo}>
            {statusAoVivo === 'analisando'
              ? 'ANÁLISE AO VIVO EM ANDAMENTO'
              : statusAoVivo === 'ok'
                ? 'CONTEÚDO LIDO DA SUA FOTO'
                : 'SEM RESPOSTA A TEMPO — USANDO EXEMPLO'}
          </Text>
        ) : null}
        <GhostButton label="Cancelar" variant="outline" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}

/* ---------------------------------------------------------- fase com anel e etapas */

function FaseProcessamento({
  titulo,
  subtitulo,
  icone,
  etapas,
  indice,
}: {
  titulo: string;
  subtitulo: string;
  icone: 'camera-iris' | 'brain';
  etapas: typeof etapasCamera;
  indice: number;
}) {
  return (
    <View style={styles.fase}>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.subtitulo}>{subtitulo}</Text>

      <View style={styles.areaAnel}>
        <ProgressRing progress={indice / etapas.length} size={148} stroke={8}>
          <MaterialCommunityIcons name={icone} size={46} color={colors.primary} />
        </ProgressRing>
      </View>

      <StepList steps={etapas} activeIndex={indice} style={styles.etapas} />
    </View>
  );
}

/* ------------------------------------------------- cena de antes e depois [D1] */

/**
 * A foto real que o usuario acabou de tirar entra torta, com reflexo e lavada, e
 * e corrigida na frente da banca. Sem foto, o mesmo efeito roda sobre a lousa
 * desenhada, para a cena nunca falhar.
 */
function CenaAntesDepois() {
  const { fotoUri } = useFlow();
  const { width } = useWindowDimensions();
  const reduzir = useReduzirMovimento();
  const correcao = useRef(new Animated.Value(reduzir ? 1 : 0)).current;

  useEffect(() => {
    if (reduzir) {
      correcao.setValue(1);
      return;
    }
    const anim = Animated.timing(correcao, {
      toValue: 1,
      duration: MS_TRANSICAO - 300,
      delay: 150,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduzir, correcao]);

  const larguraCartao = width - spacing(12);

  const rotacao = correcao.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '0deg'] });
  const inclinacao = correcao.interpolate({ inputRange: [0, 1], outputRange: ['3deg', '0deg'] });
  const opacidadeReflexo = correcao.interpolate({ inputRange: [0, 1], outputRange: [0.38, 0] });
  // Veu claro saindo = sensacao de contraste subindo.
  const opacidadeLavado = correcao.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] });
  const opacidadeAntes = correcao.interpolate({ inputRange: [0, 0.45], outputRange: [1, 0] });
  const opacidadeDepois = correcao.interpolate({ inputRange: [0.55, 1], outputRange: [0, 1] });

  return (
    <View style={styles.cena}>
      <View style={styles.rotulos}>
        <Animated.Text style={[styles.rotuloAntes, { opacity: opacidadeAntes }]}>
          ANTES
        </Animated.Text>
        <Animated.Text style={[styles.rotuloDepois, { opacity: opacidadeDepois }]}>
          DEPOIS
        </Animated.Text>
      </View>

      <Animated.View
        style={[
          styles.cartaoFoto,
          {
            width: larguraCartao,
            height: larguraCartao * (4 / 3),
            transform: [{ rotate: rotacao }, { skewX: inclinacao }],
          },
        ]}
      >
        {fotoUri ? (
          <Image source={{ uri: fotoUri }} style={styles.foto} resizeMode="cover" />
        ) : (
          <WhiteboardFallback style={styles.foto} />
        )}

        <Animated.View style={[styles.veuLavado, { opacity: opacidadeLavado }]} />
        <Animated.View style={[styles.reflexo, { opacity: opacidadeReflexo }]} />
      </Animated.View>

      <Text style={styles.legendaCena}>Perspectiva corrigida e reflexo removido</Text>
    </View>
  );
}

/* ------------------------------------------------------------------- estilos */

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  corpo: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing(6),
  },
  rodape: {
    paddingHorizontal: spacing(6),
    paddingBottom: spacing(4),
  },
  selo: {
    ...fontDado.rotulo,
    color: colors.textFaint,
    textAlign: 'center',
    marginBottom: spacing(3),
  },

  fase: {
    alignItems: 'center',
  },
  titulo: {
    ...font.h2,
    color: colors.text,
    textAlign: 'center',
  },
  subtitulo: {
    ...font.small,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing(2),
  },
  areaAnel: {
    marginVertical: spacing(8),
  },
  etapas: {
    alignSelf: 'stretch',
  },

  cena: {
    alignItems: 'center',
  },
  rotulos: {
    height: spacing(6),
    justifyContent: 'center',
    marginBottom: spacing(4),
  },
  rotuloAntes: {
    ...fontDado.rotulo,
    fontSize: 12,
    color: colors.textDim,
    position: 'absolute',
    alignSelf: 'center',
  },
  rotuloDepois: {
    ...fontDado.rotulo,
    fontSize: 12,
    color: colors.primaryHi,
    position: 'absolute',
    alignSelf: 'center',
  },
  cartaoFoto: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  foto: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
  },
  veuLavado: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.board,
  },
  reflexo: {
    position: 'absolute',
    top: '-10%',
    left: '-20%',
    width: '80%',
    height: '120%',
    backgroundColor: colors.board,
    transform: [{ rotate: '18deg' }],
  },
  legendaCena: {
    ...font.small,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing(5),
  },
});
