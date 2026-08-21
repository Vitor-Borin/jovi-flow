import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CameraType, FlashMode } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '../components/Badge';
import { GhostButton } from '../components/GhostButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { WhiteboardFallback } from '../components/WhiteboardFallback';
import type { NomeIcone } from '../data/mock';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import type { RootStackParamList } from '../navigation/types';
import { useFlow } from '../store/FlowContext';
import { TOQUE_MIN, colors, font, fontDado, radius, shadow, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

type Etapa = 'inativo' | 'ativo' | 'confirmar';

/** [D1] O Modo Aula muda como a CAMERA captura, nao so o destino da foto.
 *  Estes chips sao a prova visual disso — sao o coracao do diferencial. */
const CHIPS_OTIMIZACAO: { id: string; icone: NomeIcone; label: string }[] = [
  { id: 'reflexo', icone: 'flare', label: 'Anti-reflexo' },
  { id: 'perspectiva', icone: 'perspective-less', label: 'Perspectiva' },
  { id: 'traco', icone: 'fountain-pen-tip', label: 'Traço realçado' },
  { id: 'frames', icone: 'layers-triple-outline', label: '4 frames' },
];

const MODOS = ['Noite', 'Retrato', 'Foto', 'Vídeo', 'Mais'];

const ALTURA_BARRA = 48;
const ALTURA_CARROSSEL = 44;
const ALTURA_OBTURADOR = 104;
const TAMANHO_OBTURADOR = 72;
const MS_ATE_DETECTAR = 2500;

export function CameraScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduzir = useReduzirMovimento();
  const { definirFoto, ativarFlow } = useFlow();

  const [etapa, setEtapa] = useState<Etapa>('inativo');
  const [flashLigado, setFlashLigado] = useState(false);
  const [lente, setLente] = useState<CameraType>('back');
  const [modo, setModo] = useState('Foto');
  const [capturaContinua, setCapturaContinua] = useState(false);
  const [erroCamera, setErroCamera] = useState(false);
  const [capturando, setCapturando] = useState(false);

  const [permissao, pedirPermissao] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const montado = useRef(true);
  const jaPediuPermissao = useRef(false);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  // Pede a permissao uma unica vez. Sem a trava, um "negar" reabriria o dialogo em loop.
  useEffect(() => {
    if (!permissao || permissao.granted || jaPediuPermissao.current) return;
    jaPediuPermissao.current = true;
    void pedirPermissao();
  }, [permissao, pedirPermissao]);

  const mostrarCamera = permissao?.granted === true && !erroCamera;

  // Gatilho da demo: a lousa e "detectada" sozinha. O toque no badge FLOW e a
  // garantia manual caso o tempo nao caia bem durante o pitch.
  useEffect(() => {
    if (etapa !== 'inativo') return;
    const timer = setTimeout(() => {
      if (montado.current) setEtapa('ativo');
    }, MS_ATE_DETECTAR);
    return () => clearTimeout(timer);
  }, [etapa]);

  useEffect(() => {
    ativarFlow(etapa !== 'inativo');
  }, [etapa, ativarFlow]);

  const dimensoesVisor = useMemo(() => {
    const largura = width - spacing(4) * 2;
    const disponivel =
      height -
      insets.top -
      insets.bottom -
      ALTURA_BARRA -
      ALTURA_CARROSSEL -
      ALTURA_OBTURADOR -
      spacing(4);
    // Nunca deixa o visor estourar a tela em aparelho pequeno.
    return { largura, altura: Math.min(largura * (4 / 3), Math.max(disponivel, spacing(40))) };
  }, [width, height, insets.top, insets.bottom]);

  const aoTocarObturador = useCallback(async () => {
    if (capturando) return;
    setCapturando(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (mostrarCamera && cameraRef.current) {
        // A foto real e tirada ANTES da folha subir: as telas seguintes usam ela.
        const foto = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        if (foto?.uri) {
          definirFoto(foto.uri);
          console.log('[JOVI Flow] foto capturada:', foto.uri);
        }
      }
    } catch (erro) {
      // Sem foto a demo continua: as telas seguintes caem no WhiteboardFallback.
      console.log('[JOVI Flow] captura falhou, seguindo sem foto:', erro);
    } finally {
      if (montado.current) {
        setCapturando(false);
        setEtapa('confirmar');
      }
    }
  }, [capturando, mostrarCamera, definirFoto]);

  const alternarFlow = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEtapa((atual) => (atual === 'inativo' ? 'ativo' : 'inativo'));
  }, []);

  const flowLigado = etapa !== 'inativo';

  return (
    <View style={[styles.tela, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <BarraSuperior
        flashLigado={flashLigado}
        onAlternarFlash={() => setFlashLigado((v) => !v)}
        onFechar={() => navigation.goBack()}
      />

      <View style={styles.areaVisor}>
        <View
          style={[
            styles.visor,
            { width: dimensoesVisor.largura, height: dimensoesVisor.altura },
            flowLigado && styles.visorAtivo,
          ]}
        >
          {mostrarCamera ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={lente}
              flash={(flashLigado ? 'on' : 'off') satisfies FlashMode}
              onMountError={() => setErroCamera(true)}
            />
          ) : (
            <WhiteboardFallback style={styles.fallback} />
          )}

          {flowLigado ? <MolduraDeteccao reduzir={reduzir} /> : null}

          <View style={styles.badgesVisor}>
            {flowLigado ? (
              <>
                <Badge label="FLOW ATIVO" variant="solid" dot />
                <Badge label="MODO AULA" variant="soft" style={styles.badgeSegundo} />
              </>
            ) : (
              <Pressable
                onPress={alternarFlow}
                accessibilityRole="button"
                accessibilityLabel="Ativar o Modo Aula"
                hitSlop={spacing(2)}
              >
                <Badge label="FLOW" variant="neutral" />
              </Pressable>
            )}
          </View>

          {flowLigado ? (
            <View style={styles.blocoDeteccao}>
              <PilulaDeteccao reduzir={reduzir} />
              <ChipsOtimizacao reduzir={reduzir} />
            </View>
          ) : null}

          <View style={styles.rodapeVisor}>
            {flowLigado ? (
              <ToggleCapturaContinua ligado={capturaContinua} onAlternar={setCapturaContinua} />
            ) : (
              <View style={styles.pilulaZoom}>
                <Text style={styles.textoZoom}>1x</Text>
              </View>
            )}
          </View>

          {etapa === 'confirmar' ? <View style={styles.escurecedor} /> : null}
        </View>
      </View>

      <CarrosselModos selecionado={modo} onSelecionar={setModo} />

      <LinhaObturador
        modoAula={flowLigado}
        capturando={capturando}
        reduzir={reduzir}
        onCapturar={() => void aoTocarObturador()}
        onInverter={() => setLente((v) => (v === 'back' ? 'front' : 'back'))}
      />

      {permissao !== null && !permissao.granted ? (
        <AvisoPermissao onPermitir={() => void pedirPermissao()} />
      ) : null}

      {etapa === 'confirmar' ? (
        <FolhaConfirmacao
          reduzir={reduzir}
          onConfirmar={() => navigation.navigate('Processing')}
          onCancelar={() => setEtapa('ativo')}
        />
      ) : null}
    </View>
  );
}

/* ---------------------------------------------------------------- barra superior */

function BarraSuperior({
  flashLigado,
  onAlternarFlash,
  onFechar,
}: {
  flashLigado: boolean;
  onAlternarFlash: () => void;
  onFechar: () => void;
}) {
  return (
    <View style={styles.barra}>
      <Pressable
        onPress={onFechar}
        accessibilityRole="button"
        accessibilityLabel="Fechar a câmera"
        style={styles.itemBarra}
      >
        <Ionicons name="close" size={24} color={colors.text} />
      </Pressable>

      <Pressable
        onPress={onAlternarFlash}
        accessibilityRole="button"
        accessibilityLabel={flashLigado ? 'Desligar o flash' : 'Ligar o flash'}
        accessibilityState={{ selected: flashLigado }}
        style={styles.itemBarra}
      >
        <Ionicons
          name={flashLigado ? 'flash' : 'flash-off'}
          size={20}
          color={flashLigado ? colors.warn : colors.text}
        />
      </Pressable>

      <View style={styles.itemBarra}>
        <Text style={styles.textoBarra}>HDR</Text>
      </View>

      <View style={styles.itemBarra}>
        <Ionicons name="timer-outline" size={20} color={colors.text} />
      </View>

      <View style={styles.itemBarra}>
        <Text style={styles.textoBarra}>4:3</Text>
      </View>

      <View style={styles.itemBarra}>
        <Ionicons name="settings-outline" size={20} color={colors.text} />
      </View>
    </View>
  );
}

/* ------------------------------------------------------- moldura de deteccao [D1] */

/** Retangulo com apenas os 4 cantos desenhados, encaixando na lousa. */
function MolduraDeteccao({ reduzir }: { reduzir: boolean }) {
  const encaixe = useRef(new Animated.Value(reduzir ? 1 : 0)).current;

  useEffect(() => {
    if (reduzir) {
      encaixe.setValue(1);
      return;
    }
    const anim = Animated.timing(encaixe, {
      toValue: 1,
      duration: 620,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduzir, encaixe]);

  const escala = encaixe.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] });

  return (
    <Animated.View style={[styles.moldura, { opacity: encaixe, transform: [{ scale: escala }] }]}>
      <View style={[styles.canto, styles.cantoSE]} />
      <View style={[styles.canto, styles.cantoSD]} />
      <View style={[styles.canto, styles.cantoIE]} />
      <View style={[styles.canto, styles.cantoID]} />
    </Animated.View>
  );
}

/* --------------------------------------------------------- pilula de deteccao */

function PilulaDeteccao({ reduzir }: { reduzir: boolean }) {
  const entrada = useRef(new Animated.Value(reduzir ? 1 : 0)).current;
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduzir) {
      entrada.setValue(1);
      return;
    }
    const anim = Animated.timing(entrada, { toValue: 1, duration: 260, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [reduzir, entrada]);

  useEffect(() => {
    if (reduzir) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduzir, pulso]);

  const subida = entrada.interpolate({ inputRange: [0, 1], outputRange: [spacing(3), 0] });
  const escalaPonto = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const opacidadePonto = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] });

  return (
    <Animated.View
      style={[styles.pilula, { opacity: entrada, transform: [{ translateY: subida }] }]}
      accessible
      accessibilityLabel="Apontado para lousa. Detectamos conteúdo de aula."
    >
      <View style={styles.areaPonto}>
        <Animated.View
          style={[styles.ponto, { opacity: opacidadePonto, transform: [{ scale: escalaPonto }] }]}
        />
      </View>
      <View style={styles.textosPilula}>
        <Text style={styles.pilulaTitulo}>Apontado para lousa</Text>
        <Text style={styles.pilulaDetalhe}>Detectamos conteúdo de aula</Text>
      </View>
    </Animated.View>
  );
}

/* ------------------------------------------------------ chips de otimizacao [D1] */

function ChipsOtimizacao({ reduzir }: { reduzir: boolean }) {
  const valores = useRef(CHIPS_OTIMIZACAO.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (reduzir) {
      valores.forEach((v) => v.setValue(1));
      return;
    }
    const cascata = Animated.stagger(
      80,
      valores.map((v) =>
        Animated.timing(v, { toValue: 1, duration: 220, useNativeDriver: true })
      )
    );
    cascata.start();
    return () => cascata.stop();
  }, [reduzir, valores]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listaChips}
    >
      {CHIPS_OTIMIZACAO.map((chip, indice) => {
        const valor = valores[indice];
        if (!valor) return null;
        const deslocamento = valor.interpolate({
          inputRange: [0, 1],
          outputRange: [spacing(4), 0],
        });
        return (
          <Animated.View
            key={chip.id}
            style={[styles.chip, { opacity: valor, transform: [{ translateX: deslocamento }] }]}
          >
            <MaterialCommunityIcons name={chip.icone} size={13} color={colors.primaryHi} />
            <Text style={styles.chipTexto}>{chip.label}</Text>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

/* ------------------------------------------------- toggle de captura continua [D1] */

function ToggleCapturaContinua({
  ligado,
  onAlternar,
}: {
  ligado: boolean;
  onAlternar: (v: boolean) => void;
}) {
  return (
    <View style={styles.blocoContinua}>
      <Pressable
        onPress={() => {
          void Haptics.selectionAsync();
          onAlternar(!ligado);
        }}
        accessibilityRole="switch"
        accessibilityLabel="Captura contínua"
        accessibilityState={{ checked: ligado }}
        style={styles.linhaContinua}
      >
        <View style={[styles.trilho, ligado && styles.trilhoLigado]}>
          <View style={[styles.botaoTrilho, ligado && styles.botaoTrilhoLigado]} />
        </View>
        <Text style={[styles.rotuloContinua, ligado && styles.rotuloContinuaLigado]}>
          Captura contínua
        </Text>
      </Pressable>

      {ligado ? (
        <Text style={styles.explicacaoContinua}>
          A câmera captura sozinha quando a lousa mudar
        </Text>
      ) : null}
    </View>
  );
}

/* ---------------------------------------------------------- carrossel de modos */

function CarrosselModos({
  selecionado,
  onSelecionar,
}: {
  selecionado: string;
  onSelecionar: (m: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carrossel}
      style={styles.carrosselContainer}
    >
      {MODOS.map((m) => {
        const ativo = m === selecionado;
        return (
          <Pressable
            key={m}
            onPress={() => {
              void Haptics.selectionAsync();
              onSelecionar(m);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Modo ${m}`}
            accessibilityState={{ selected: ativo }}
            style={styles.itemModo}
          >
            <Text style={[styles.textoModo, ativo && styles.textoModoAtivo]}>{m}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* --------------------------------------------------------- linha do obturador */

function LinhaObturador({
  modoAula,
  capturando,
  reduzir,
  onCapturar,
  onInverter,
}: {
  modoAula: boolean;
  capturando: boolean;
  reduzir: boolean;
  onCapturar: () => void;
  onInverter: () => void;
}) {
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!modoAula || reduzir) {
      pulso.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [modoAula, reduzir, pulso]);

  const escala = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <View style={styles.linhaObturador}>
      <View style={styles.miniatura}>
        <Ionicons name="images-outline" size={18} color={colors.textFaint} />
      </View>

      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <Pressable
          onPress={onCapturar}
          disabled={capturando}
          accessibilityRole="button"
          accessibilityLabel={modoAula ? 'Capturar conteúdo de aula' : 'Tirar foto'}
          accessibilityState={{ disabled: capturando }}
          style={({ pressed }) => [
            styles.obturador,
            modoAula ? styles.obturadorAula : styles.obturadorNormal,
            pressed && styles.obturadorPressionado,
          ]}
        >
          {modoAula ? <View style={styles.miolodObturador} /> : null}
        </Pressable>
      </Animated.View>

      <Pressable
        onPress={onInverter}
        accessibilityRole="button"
        accessibilityLabel="Inverter câmera"
        style={styles.botaoInverter}
      >
        <Ionicons name="camera-reverse-outline" size={26} color={colors.text} />
      </Pressable>
    </View>
  );
}

/* ---------------------------------------------------------- aviso de permissao */

function AvisoPermissao({ onPermitir }: { onPermitir: () => void }) {
  return (
    <View style={styles.aviso}>
      <Ionicons name="alert-circle-outline" size={18} color={colors.warn} />
      <Text style={styles.avisoTexto} numberOfLines={2}>
        Sem acesso à câmera. Mostrando um exemplo de lousa.
      </Text>
      <Pressable
        onPress={onPermitir}
        accessibilityRole="button"
        accessibilityLabel="Permitir o uso da câmera"
        style={styles.avisoBotao}
      >
        <Text style={styles.avisoBotaoTexto}>Permitir</Text>
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------ folha de confirmacao */

function FolhaConfirmacao({
  reduzir,
  onConfirmar,
  onCancelar,
}: {
  reduzir: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const subida = useRef(new Animated.Value(reduzir ? 1 : 0)).current;

  useEffect(() => {
    if (reduzir) {
      subida.setValue(1);
      return;
    }
    const anim = Animated.spring(subida, {
      toValue: 1,
      damping: 20,
      stiffness: 180,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduzir, subida]);

  const deslocamento = subida.interpolate({ inputRange: [0, 1], outputRange: [spacing(70), 0] });

  return (
    <View style={styles.camadaFolha}>
      <Pressable
        style={styles.scrimFolha}
        onPress={onCancelar}
        accessibilityRole="button"
        accessibilityLabel="Cancelar a captura"
      />
      <Animated.View style={[styles.folha, { transform: [{ translateY: deslocamento }] }]}>
        <View style={styles.alca} />
        <Text style={styles.folhaTitulo}>Capturar como conteúdo de aula?</Text>
        <Text style={styles.folhaSubtitulo}>
          O Flow irá analisar, organizar e salvar para seus estudos.
        </Text>
        <PrimaryButton label="Capturar" onPress={onConfirmar} style={styles.folhaBotao} />
        <GhostButton label="Cancelar" variant="text" onPress={onCancelar} />
      </Animated.View>
    </View>
  );
}

/* ------------------------------------------------------------------- estilos */

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  barra: {
    height: ALTURA_BARRA,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(3),
  },
  itemBarra: {
    minWidth: TOQUE_MIN,
    height: TOQUE_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBarra: {
    ...fontDado.rotulo,
    color: colors.text,
  },

  areaVisor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visor: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  visorAtivo: {
    borderColor: colors.primaryEdge,
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
  },
  escurecedor: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scrim,
  },

  badgesVisor: {
    position: 'absolute',
    top: spacing(3),
    right: spacing(3),
    alignItems: 'flex-end',
  },
  badgeSegundo: {
    marginTop: spacing(1.5),
  },

  moldura: {
    ...StyleSheet.absoluteFillObject,
    margin: spacing(5),
  },
  canto: {
    position: 'absolute',
    width: spacing(7),
    height: spacing(7),
    borderColor: colors.primary,
  },
  cantoSE: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: radius.sm },
  cantoSD: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: radius.sm },
  cantoIE: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: radius.sm },
  cantoID: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: radius.sm },

  blocoDeteccao: {
    position: 'absolute',
    left: spacing(3),
    right: spacing(3),
    bottom: spacing(16),
  },
  pilula: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: colors.overlay,
    borderRadius: radius.pill,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    ...shadow.card,
  },
  areaPonto: {
    width: spacing(4),
    height: spacing(4),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(2),
  },
  ponto: {
    width: spacing(2),
    height: spacing(2),
    borderRadius: radius.pill,
    backgroundColor: colors.primaryHi,
  },
  textosPilula: {
    flexShrink: 1,
  },
  pilulaTitulo: {
    ...font.bodyMed,
    color: colors.text,
  },
  pilulaDetalhe: {
    ...font.small,
    color: colors.textDim,
  },

  listaChips: {
    paddingTop: spacing(2),
    gap: spacing(2),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryEdge,
    borderRadius: radius.pill,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2.5),
  },
  chipTexto: {
    ...font.tiny,
    color: colors.primaryHi,
  },

  rodapeVisor: {
    position: 'absolute',
    left: spacing(3),
    right: spacing(3),
    bottom: spacing(3),
    alignItems: 'center',
  },
  pilulaZoom: {
    minWidth: spacing(9),
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2.5),
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
  },
  textoZoom: {
    ...fontDado.valor,
    fontSize: 13,
    color: colors.text,
  },

  blocoContinua: {
    alignSelf: 'stretch',
    backgroundColor: colors.overlay,
    borderRadius: radius.md,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
  },
  linhaContinua: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: spacing(7),
  },
  trilho: {
    width: spacing(9),
    height: spacing(5),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHi,
    padding: spacing(0.5),
    justifyContent: 'center',
    marginRight: spacing(2.5),
  },
  trilhoLigado: {
    backgroundColor: colors.primary,
  },
  botaoTrilho: {
    width: spacing(4),
    height: spacing(4),
    borderRadius: radius.pill,
    backgroundColor: colors.textDim,
  },
  botaoTrilhoLigado: {
    backgroundColor: colors.onPrimary,
    alignSelf: 'flex-end',
  },
  rotuloContinua: {
    ...font.small,
    color: colors.textDim,
    flexShrink: 1,
  },
  rotuloContinuaLigado: {
    color: colors.text,
  },
  explicacaoContinua: {
    ...font.tiny,
    fontWeight: '400',
    color: colors.textDim,
    paddingBottom: spacing(1),
  },

  carrosselContainer: {
    maxHeight: ALTURA_CARROSSEL,
  },
  carrossel: {
    alignItems: 'center',
    paddingHorizontal: spacing(4),
    gap: spacing(5),
  },
  itemModo: {
    minHeight: TOQUE_MIN,
    justifyContent: 'center',
  },
  textoModo: {
    ...font.bodyMed,
    color: colors.textDim,
  },
  // Ambar, e nao verde: o verde do app significa acao e Flow ativo. Ver DESIGN.md.
  textoModoAtivo: {
    color: colors.warn,
  },

  linhaObturador: {
    height: ALTURA_OBTURADOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(8),
  },
  miniatura: {
    width: spacing(11),
    height: spacing(11),
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  obturador: {
    width: TAMANHO_OBTURADOR,
    height: TAMANHO_OBTURADOR,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  obturadorNormal: {
    backgroundColor: colors.text,
  },
  // No Modo Aula o obturador vira anel: sinal de que a camera esta em outro modo.
  obturadorAula: {
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: colors.primary,
  },
  obturadorPressionado: {
    opacity: 0.7,
  },
  miolodObturador: {
    width: TAMANHO_OBTURADOR - spacing(6),
    height: TAMANHO_OBTURADOR - spacing(6),
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  botaoInverter: {
    width: spacing(11),
    height: spacing(11),
    alignItems: 'center',
    justifyContent: 'center',
  },

  aviso: {
    position: 'absolute',
    left: spacing(4),
    right: spacing(4),
    bottom: spacing(30),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
  },
  avisoTexto: {
    ...font.small,
    color: colors.textDim,
    flex: 1,
  },
  avisoBotao: {
    minHeight: TOQUE_MIN,
    justifyContent: 'center',
    paddingHorizontal: spacing(1),
  },
  avisoBotaoTexto: {
    ...font.bodyMed,
    color: colors.primaryHi,
  },

  camadaFolha: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  scrimFolha: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scrim,
  },
  folha: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(5),
    paddingTop: spacing(3),
    paddingBottom: spacing(8),
  },
  alca: {
    width: spacing(10),
    height: spacing(1),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHi,
    alignSelf: 'center',
    marginBottom: spacing(5),
  },
  folhaTitulo: {
    ...font.h3,
    color: colors.text,
    textAlign: 'center',
  },
  folhaSubtitulo: {
    ...font.small,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing(2),
    marginBottom: spacing(6),
  },
  folhaBotao: {
    marginBottom: spacing(2),
  },
});
