import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';

import { GhostButton } from '../components/GhostButton';
import { ProgressRing } from '../components/ProgressRing';
import { StepList } from '../components/StepList';
import type { Etapa } from '../data/mock';
import { etapasCamera, etapasIA } from '../data/mock';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import type { RootStackParamList } from '../navigation/types';
import type { LousaTratada } from '../services/tratarLousa';
import type { EstadoTratamento } from '../store/FlowContext';
import { lousaDoTratamento, useFlow } from '../store/FlowContext';
import { colors, font, fontDado, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Processing'>;

/** A tela tem tres momentos. O antes e depois e a cena mais importante do pitch:
 *  e onde fica provado que a CAMERA trabalhou antes da IA. */
type Momento = 'camera' | 'antesDepois' | 'ia';

const MS_POR_ETAPA = 600;
const MS_POR_ETAPA_CAMERA = 400;
const MS_RESPIRO = 320;
/** Quando a foto nao foi tratada, o aviso da primeira etapa diz por que. Ele
 *  fica na tela o tempo de ler antes de a IA comecar. */
const MS_AVISO_SEM_TRATAMENTO = 1500;
/** Passou disto sem o tratamento terminar, a tela segue para a IA sem o antes e
 *  depois. Se ele terminar mais tarde, a lousa tratada ainda vai para a aula. */
const MS_LIMITE_TRATAMENTO = 8000;
const MS_ANTES_DEPOIS = 2900;
const MS_ATRASO_CENA = 200;
const MS_ANIMACAO_CENA = 1700;
/** Com menos movimento o depois aparece parado, e fica o tempo de ler. */
const MS_ANTES_DEPOIS_PARADO = 1800;
/** Fatia da altura da tela que o cartao do antes e depois pode ocupar. */
const FRACAO_ALTURA_CARTAO = 0.56;
const ESPESSURA_CONTORNO = 3;
const ESPESSURA_HALO = 6;

type Passo = { ms: number; acao: () => void };

/** Agenda os passos e devolve a limpeza. Timer sobrevivendo ao unmount e a
 *  causa numero 1 de crash aleatorio em demonstracao. */
function agendar(passos: Passo[]): () => void {
  const timers = passos.map(({ ms, acao }) => setTimeout(acao, ms));
  return () => timers.forEach(clearTimeout);
}

/**
 * As etapas da camera sao as que o tratamento fez nesta foto. Enquanto ele
 * roda, a primeira fica em andamento e as outras pendentes. Quando termina, a
 * lista fica so com o que foi aplicado, e o detalhe da primeira diz o que ele
 * achou. Sem foto para tratar, nao ha etapa de camera nenhuma.
 */
function etapasDoTratamento(tratamento: EstadoTratamento): Etapa[] {
  switch (tratamento.estado) {
    case 'tratando':
      return etapasCamera;
    case 'tratada': {
      const { perspectiva, claro } = tratamento.lousa;
      return etapasCamera
        .filter((etapa) => perspectiva || etapa.id !== 'perspectiva')
        .map((etapa) => {
          if (etapa.id === 'lousa') {
            return {
              ...etapa,
              detalhe: perspectiva
                ? 'Os quatro cantos foram achados'
                : 'Cantos não achados: vale a foto inteira',
            };
          }
          if (etapa.id === 'traco') {
            return {
              ...etapa,
              detalhe: claro ? 'Caneta escura sobre fundo branco' : 'Giz claro sobre o quadro escuro',
            };
          }
          return etapa;
        });
    }
    case 'sem-lousa':
    case 'falhou': {
      const detalhe =
        tratamento.estado === 'sem-lousa'
          ? 'Lousa não encontrada: segue a foto original'
          : 'Não deu para tratar: segue a foto original';
      return etapasCamera.filter((etapa) => etapa.id === 'lousa').map((etapa) => ({ ...etapa, detalhe }));
    }
    case 'sem-foto':
    case 'indisponivel':
      return [];
  }
}

function segundos(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
}

export function ProcessingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const reduzir = useReduzirMovimento();
  // A analise e o tratamento ja foram disparados na captura, para aproveitar
  // tambem o tempo da navegacao. Aqui a gente so observa o resultado.
  const { modoAoVivo, classificacao, analisando, fotoUri, tratamento } = useFlow();
  const etapasDaCamera = useMemo(() => etapasDoTratamento(tratamento), [tratamento]);
  const lousa = lousaDoTratamento(tratamento);
  const tratando = tratamento.estado === 'tratando';
  const temAntesDepois = tratamento.estado === 'tratada';

  const [momento, setMomento] = useState<Momento>(() =>
    etapasDoTratamento(tratamento).length > 0 ? 'camera' : 'ia'
  );
  const [indice, setIndice] = useState(0);
  const inicio = useRef(Date.now());

  const statusAoVivo = !modoAoVivo
    ? 'off'
    : classificacao !== null
      ? 'ok'
      : analisando
        ? 'analisando'
        : 'simulado';

  // 1. Camera. A primeira etapa espera o tratamento de verdade, com limite. As
  // outras sao o que ele aplicou, uma de cada vez, para dar tempo de ler.
  useEffect(() => {
    if (momento !== 'camera') return;
    const decorrido = Date.now() - inicio.current;
    const seguir = (proximo: Momento) => () => {
      setIndice(0);
      setMomento(proximo);
    };

    if (tratando) {
      return agendar([{ ms: Math.max(0, MS_LIMITE_TRATAMENTO - decorrido), acao: seguir('ia') }]);
    }
    if (etapasDaCamera.length === 0) {
      return agendar([{ ms: 0, acao: seguir('ia') }]);
    }

    // A primeira etapa fica em andamento pelo menos um passo, mesmo quando o
    // tratamento terminou antes de a tela abrir.
    const primeiro = Math.max(0, MS_POR_ETAPA_CAMERA - decorrido);
    const passos: Passo[] = etapasDaCamera.map((_, i) => ({
      ms: primeiro + i * MS_POR_ETAPA_CAMERA,
      acao: () => setIndice(i + 1),
    }));
    passos.push({
      ms:
        primeiro +
        (etapasDaCamera.length - 1) * MS_POR_ETAPA_CAMERA +
        (temAntesDepois ? MS_RESPIRO : MS_AVISO_SEM_TRATAMENTO),
      acao: seguir(temAntesDepois ? 'antesDepois' : 'ia'),
    });
    return agendar(passos);
  }, [momento, tratando, etapasDaCamera, temAntesDepois]);

  // 2. Antes e depois.
  useEffect(() => {
    if (momento !== 'antesDepois') return;
    return agendar([
      { ms: reduzir ? MS_ANTES_DEPOIS_PARADO : MS_ANTES_DEPOIS, acao: () => setMomento('ia') },
    ]);
  }, [momento, reduzir]);

  // 3. IA.
  useEffect(() => {
    if (momento !== 'ia') return;
    const passos: Passo[] = etapasIA.map((_, i) => ({
      ms: (i + 1) * MS_POR_ETAPA,
      acao: () => setIndice(i + 1),
    }));
    // replace, e nao navigate: o botao voltar nao pode retornar ao processamento.
    passos.push({
      ms: etapasIA.length * MS_POR_ETAPA + MS_RESPIRO,
      acao: () => navigation.replace('Identified'),
    });
    return agendar(passos);
  }, [momento, navigation]);

  return (
    <View style={[styles.tela, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.corpo}>
        {momento === 'antesDepois' && lousa && fotoUri ? (
          <CenaAntesDepois fotoUri={fotoUri} lousa={lousa} reduzir={reduzir} />
        ) : momento === 'camera' ? (
          <FaseProcessamento
            key="camera"
            titulo="Tratando a foto..."
            subtitulo="No aparelho, sem internet."
            icone="camera-iris"
            etapas={etapasDaCamera}
            indice={indice}
          />
        ) : (
          <FaseProcessamento
            key="ia"
            titulo="Analisando conteúdo..."
            subtitulo="Isso pode levar alguns segundos."
            icone="brain"
            etapas={etapasIA}
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
                : 'SEM RESPOSTA A TEMPO · USANDO EXEMPLO'}
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
  etapas: Etapa[];
  indice: number;
}) {
  return (
    <View style={styles.fase}>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.subtitulo}>{subtitulo}</Text>

      <View style={styles.areaAnel}>
        <ProgressRing progress={etapas.length > 0 ? indice / etapas.length : 0} size={148} stroke={8}>
          <MaterialCommunityIcons name={icone} size={46} color={colors.primary} />
        </ProgressRing>
      </View>

      <StepList steps={etapas} activeIndex={indice} style={styles.etapas} />
    </View>
  );
}

/* ------------------------------------------------- cena de antes e depois [D1] */

/**
 * A foto que o estudante acabou de tirar e a lousa que o tratamento devolveu,
 * as duas de verdade. O contorno mostra onde os cantos foram achados, e a lousa
 * sai de dentro dele ja reta e com a luz por igual.
 *
 * Ate a Sprint 4 esta cena entortava a foto de proposito, punha um reflexo falso
 * por cima e animava tudo voltando; o depois era a propria foto original.
 */
function CenaAntesDepois({
  fotoUri,
  lousa,
  reduzir,
}: {
  fotoUri: string;
  lousa: LousaTratada;
  reduzir: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const progresso = useRef(new Animated.Value(reduzir ? 1 : 0)).current;

  useEffect(() => {
    if (reduzir) {
      progresso.setValue(1);
      return;
    }
    const anim = Animated.timing(progresso, {
      toValue: 1,
      duration: MS_ANIMACAO_CENA,
      delay: MS_ATRASO_CENA,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduzir, progresso]);

  const geometria = useMemo(() => {
    // O cartao tem a proporcao da foto, para o contorno cair em cima da lousa.
    const largura = Math.min(width - spacing(12), height * FRACAO_ALTURA_CARTAO * lousa.proporcaoFoto);
    const altura = largura / lousa.proporcaoFoto;

    // Onde a lousa tratada termina: inteira e no centro do cartao.
    const escala = Math.min(largura / lousa.largura, altura / lousa.altura);
    const final = { largura: lousa.largura * escala, altura: lousa.altura * escala };

    // De onde ela sai: a caixa em volta dos cantos achados, ou a foto inteira.
    const xs = lousa.cantos ? lousa.cantos.map((p) => p.x * largura) : [0, largura];
    const ys = lousa.cantos ? lousa.cantos.map((p) => p.y * altura) : [0, altura];
    const esquerda = Math.min(...xs);
    const topo = Math.min(...ys);
    const larguraOrigem = Math.max(...xs) - esquerda;
    const alturaOrigem = Math.max(...ys) - topo;

    return {
      largura,
      altura,
      final: {
        ...final,
        x: (largura - final.largura) / 2,
        y: (altura - final.altura) / 2,
      },
      deslocX: esquerda + larguraOrigem / 2 - largura / 2,
      deslocY: topo + alturaOrigem / 2 - altura / 2,
      escalaX: larguraOrigem / final.largura,
      escalaY: alturaOrigem / final.altura,
      contorno: lousa.cantos
        ? lousa.cantos.map((p) => `${p.x * largura},${p.y * altura}`).join(' ')
        : null,
    };
  }, [width, height, lousa]);

  const faixa = (entrada: number[], saida: number[]) =>
    progresso.interpolate({ inputRange: entrada, outputRange: saida, extrapolate: 'clamp' });

  // Um valor so conduz a cena inteira: primeiro o contorno aparece sobre a
  // foto, depois a lousa sai dele e cresce ate o centro enquanto a foto some.
  const opacidadeContorno = faixa([0, 0.18, 0.5, 0.72], [0, 1, 1, 0]);
  const opacidadeFoto = faixa([0.4, 0.8], [1, 0]);
  const opacidadeLousa = faixa([0.3, 0.6], [0, 1]);
  const deslocX = faixa([0.3, 0.9], [geometria.deslocX, 0]);
  const deslocY = faixa([0.3, 0.9], [geometria.deslocY, 0]);
  const escalaX = faixa([0.3, 0.9], [geometria.escalaX, 1]);
  const escalaY = faixa([0.3, 0.9], [geometria.escalaY, 1]);
  const opacidadeAntes = faixa([0, 0.45], [1, 0]);
  const opacidadeDepois = faixa([0.55, 1], [0, 1]);

  return (
    <View style={styles.cena}>
      <View style={styles.rotulos}>
        <Animated.Text style={[styles.rotuloAntes, { opacity: opacidadeAntes }]}>ANTES</Animated.Text>
        <Animated.Text style={[styles.rotuloDepois, { opacity: opacidadeDepois }]}>
          DEPOIS
        </Animated.Text>
      </View>

      <View style={[styles.cartao, { width: geometria.largura, height: geometria.altura }]}>
        <Animated.Image
          source={{ uri: fotoUri }}
          style={[styles.preencher, { opacity: opacidadeFoto }]}
          resizeMode="cover"
          accessibilityLabel="A foto como a câmera tirou"
        />

        {geometria.contorno ? (
          <Animated.View pointerEvents="none" style={[styles.preencher, { opacity: opacidadeContorno }]}>
            <Svg width={geometria.largura} height={geometria.altura}>
              <Polygon
                points={geometria.contorno}
                fill="none"
                stroke={colors.haloContorno}
                strokeWidth={ESPESSURA_HALO}
                strokeLinejoin="round"
              />
              <Polygon
                points={geometria.contorno}
                fill={colors.primarySoft}
                stroke={colors.primary}
                strokeWidth={ESPESSURA_CONTORNO}
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
        ) : null}

        <Animated.Image
          source={{ uri: lousa.uri }}
          resizeMode="cover"
          accessibilityLabel="A lousa depois do tratamento"
          style={[
            styles.lousa,
            {
              left: geometria.final.x,
              top: geometria.final.y,
              width: geometria.final.largura,
              height: geometria.final.altura,
              opacity: opacidadeLousa,
              transform: [
                { translateX: deslocX },
                { translateY: deslocY },
                { scaleX: escalaX },
                { scaleY: escalaY },
              ],
            },
          ]}
        />
      </View>

      <Text style={styles.legendaCena}>
        {lousa.perspectiva
          ? 'Lousa endireitada e com a luz por igual'
          : 'Cantos não achados: luz por igual na foto inteira'}
      </Text>
      <View style={styles.dadoCena}>
        <Text style={styles.valorDado}>{segundos(lousa.ms)}</Text>
        <Text style={styles.rotuloDado}>no aparelho</Text>
      </View>
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
  cartao: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  preencher: {
    ...StyleSheet.absoluteFill,
    borderRadius: 0,
  },
  lousa: {
    position: 'absolute',
    borderRadius: 0,
  },
  legendaCena: {
    ...font.bodyMed,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing(5),
  },
  dadoCena: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing(2),
    marginTop: spacing(2),
  },
  valorDado: {
    ...fontDado.valor,
    color: colors.text,
  },
  rotuloDado: {
    ...fontDado.rotulo,
    color: colors.textFaint,
  },
});
