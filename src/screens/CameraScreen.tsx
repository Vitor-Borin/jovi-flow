import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CameraType, FlashMode } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
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
import type { Chip, SubModo } from '../data/mock';
import { pastasExistentes, subModos } from '../data/mock';
import type { FrameContinuo } from '../hooks/useCapturaContinua';
import { useCapturaContinua } from '../hooks/useCapturaContinua';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import {
  PX,
  classificarCaptura,
  prepararImagem,
  transcreverCaptura,
} from '../services/analiseAoVivo';
import type { RootStackParamList } from '../navigation/types';
import { useFlow } from '../store/FlowContext';
import { TOQUE_MIN, colors, font, fontDado, radius, shadow, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

type Etapa = 'inativo' | 'ativo' | 'confirmar';

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
  const {
    definirFoto,
    ativarFlow,
    subModo,
    definirSubModo,
    jaApresentouModoAula,
    marcarApresentacaoVista,
    modoAoVivo,
    definirFotoBase64,
    definirClassificacao,
    definirTranscricao,
    definirAnalisando,
    definirTexto,
    definirDestino,
    definirSequencia,
  } = useFlow();

  const modoAtual: SubModo = subModos.find((m) => m.id === subModo) ?? subModos[0];

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
  // Numero de sequencia da captura: se o usuario cancelar e capturar de novo,
  // so o resultado da captura mais recente vale.
  const capturaAtual = useRef(0);
  // Trava da camera: a captura manual e o ciclo continuo passam pela mesma, para
  // nunca chamarem takePictureAsync ao mesmo tempo.
  const cameraOcupada = useRef(false);

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

  // A captura continua so roda com o Modo Aula ligado, camera disponivel e fora
  // da folha de confirmacao — capturar por baixo do sheet nao faria sentido.
  const continuaAtiva = capturaContinua && etapa === 'ativo' && mostrarCamera;
  const sequencia = useCapturaContinua({
    ativo: continuaAtiva,
    cameraRef,
    disponivel: mostrarCamera,
    ocupada: cameraOcupada,
  });

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
    if (capturando || cameraOcupada.current) return;
    setCapturando(true);
    cameraOcupada.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (mostrarCamera && cameraRef.current) {
        // A foto real e tirada ANTES da folha subir: as telas seguintes usam ela.
        // Qualidade alta na captura: o arquivo fica no aparelho, e serve de fonte
        // para o redimensionamento do modo ao vivo.
        const foto = await cameraRef.current.takePictureAsync({ quality: 0.85 });
        if (foto?.uri) {
          definirFoto(foto.uri);
          console.log('[JOVI Flow] foto capturada:', foto.uri);
        }

        // Zera o resultado anterior: cada captura comeca do exemplo e so e
        // substituida quando a leitura real chegar.
        definirClassificacao(null);
        definirTranscricao(null);
        definirFotoBase64(null);

        // A sequencia da captura continua nao pode ser descartada em silencio:
        // ela vira parte do que foi salvo, e a tela seguinte mostra isso.
        const quadros = sequencia.frames;
        const primeiro = quadros[0];
        const ultimo = quadros[quadros.length - 1];
        definirSequencia(
          quadros.length,
          primeiro && ultimo ? { inicio: primeiro.hora.slice(0, 5), fim: ultimo.hora.slice(0, 5) } : null
        );

        if (modoAoVivo && foto?.uri) {
          const seq = capturaAtual.current + 1;
          capturaAtual.current = seq;
          definirAnalisando(true);

          // Duas imagens, dois tamanhos, cada uma dimensionada para a tarefa.
          // A pequena e o que garante a leitura mesmo com rede ruim.
          const [pequena, grande] = await Promise.all([
            prepararImagem(foto.uri, foto.width, foto.height, PX.classificacao),
            prepararImagem(foto.uri, foto.width, foto.height, PX.transcricao),
          ]);
          definirFotoBase64(grande);

          const kb = (b: string | null) => Math.round((b?.length ?? 0) / 1024);
          console.log(
            `[JOVI Flow] ao vivo: ${foto.width}x${foto.height} -> classificacao ${kb(pequena)} KB, transcricao ${kb(grande)} KB`
          );

          // As duas correm em paralelo e sao independentes: se uma falhar, so
          // aquela parte da tela cai no exemplo.
          // O sub-modo e a lista de pastas existentes vao no prompt: o primeiro
          // muda como a imagem e lida, a segunda evita a IA inventar um nome novo
          // a cada captura para o mesmo assunto.
          const pClass = classificarCaptura(pequena, modoAtual.id, pastasExistentes()).then((r) => {
            if (capturaAtual.current !== seq) return;
            if (r.estado === 'ok') {
              definirClassificacao(r.dados);
              definirDestino(r.dados.pasta);
              console.log(
                `[JOVI Flow] classificacao em ${r.ms}ms: ${r.dados.topico} -> ${r.dados.pasta.join(' > ')}${r.dados.pastaNova ? ' (pasta nova)' : ''}`
              );
            } else {
              console.log('[JOVI Flow] classificacao indisponivel:', r.estado);
            }
          });

          const pTrans = transcreverCaptura(grande, modoAtual.id).then((r) => {
            if (capturaAtual.current !== seq) return;
            if (r.estado === 'ok') {
              definirTranscricao(r.dados);
              definirTexto(r.dados.textoExtraido);
              console.log(`[JOVI Flow] transcricao em ${r.ms}ms`);
            } else {
              console.log('[JOVI Flow] transcricao indisponivel:', r.estado);
            }
          });

          void Promise.all([pClass, pTrans]).then(() => {
            if (capturaAtual.current === seq) definirAnalisando(false);
          });
        }
      }
    } catch (erro) {
      // Sem foto a demo continua: as telas seguintes caem no WhiteboardFallback.
      console.log('[JOVI Flow] captura falhou, seguindo sem foto:', erro);
    } finally {
      cameraOcupada.current = false;
      if (montado.current) {
        setCapturando(false);
        setEtapa('confirmar');
      }
    }
  }, [
    capturando,
    mostrarCamera,
    definirFoto,
    modoAoVivo,
    definirFotoBase64,
    definirClassificacao,
    definirTranscricao,
    definirAnalisando,
    definirTexto,
    definirDestino,
    modoAtual.id,
    definirSequencia,
    sequencia.frames,
  ]);

  const alternarFlow = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEtapa((atual) => (atual === 'inativo' ? 'ativo' : 'inativo'));
  }, []);

  const flowLigado = etapa !== 'inativo';

  return (
    <View style={[styles.tela, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* A camera e a raiz do app: "sair" nao volta, avanca para as demais
          superficies do Flow — como a galeria numa camera nativa. */}
      <BarraSuperior
        flashLigado={flashLigado}
        onAlternarFlash={() => setFlashLigado((v) => !v)}
        onFechar={() => navigation.navigate('Tabs')}
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
              animateShutter={!continuaAtiva}
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
              <ChipsOtimizacao key={modoAtual.id} chips={modoAtual.chips} reduzir={reduzir} />
            </View>
          ) : null}

          {/* A pesquisa do grupo mostrou que o scan da Samsung existe e ninguem
              descobre. O Modo Aula se apresenta uma vez, no momento em que liga. */}
          {flowLigado && !jaApresentouModoAula ? (
            <CartaoDescoberta reduzir={reduzir} onFechar={marcarApresentacaoVista} />
          ) : null}

          <View style={styles.rodapeVisor}>
            {flowLigado ? (
              <ToggleCapturaContinua
                ligado={capturaContinua}
                onAlternar={setCapturaContinua}
                intervalo={sequencia.intervaloSegundos}
              />
            ) : (
              <View style={styles.pilulaZoom}>
                <Text style={styles.textoZoom}>1x</Text>
              </View>
            )}
          </View>

          {continuaAtiva && sequencia.frames.length > 0 ? (
            <TiraSequencia frames={sequencia.frames} reduzir={reduzir} />
          ) : null}

          {etapa === 'confirmar' ? <View style={styles.escurecedor} /> : null}
        </View>
      </View>

      {/* Quando o Flow liga, a propria regua de modos da camera muda: sai a lista
          generica e entra a escolha do tipo de superficie a capturar. E outro
          sinal de que a CAMERA entrou em outro modo, e nao so o destino da foto. */}
      {flowLigado ? (
        <SeletorSubModo selecionado={modoAtual.id} onSelecionar={definirSubModo} />
      ) : (
        <CarrosselModos selecionado={modo} onSelecionar={setModo} />
      )}

      {flowLigado ? (
        <Text style={styles.problemaModo} numberOfLines={1}>
          {modoAtual.problema}
        </Text>
      ) : null}

      <LinhaObturador
        modoAula={flowLigado}
        capturando={capturando}
        reduzir={reduzir}
        onCapturar={() => void aoTocarObturador()}
        onInverter={() => setLente((v) => (v === 'back' ? 'front' : 'back'))}
        onAbrirEstudos={() => navigation.navigate('Tabs', { screen: 'Estudos' })}
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

function ChipsOtimizacao({ chips, reduzir }: { chips: Chip[]; reduzir: boolean }) {
  const valores = useRef(chips.map(() => new Animated.Value(0))).current;

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
      {chips.map((chip, indice) => {
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

/* --------------------------------------------- tira da sequencia continua [D1] */

function TiraSequencia({ frames, reduzir }: { frames: FrameContinuo[]; reduzir: boolean }) {
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduzir) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduzir, pulso]);

  const opacidade = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] });
  const ultimos = frames.slice(-5);

  return (
    <View style={styles.tira}>
      <View style={styles.cabecalhoTira}>
        <Animated.View style={[styles.pontoGravando, { opacity: opacidade }]} />
        <Text style={styles.textoTira}>
          {frames.length} {frames.length === 1 ? 'QUADRO GUARDADO' : 'QUADROS GUARDADOS'}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listaTira}>
        {ultimos.map((f) => (
          <View key={f.id} style={styles.itemTira}>
            <Image source={{ uri: f.uri }} style={styles.miniaturaTira} resizeMode="cover" />
            <Text style={styles.horaTira}>{f.hora.slice(0, 5)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------- toggle de captura continua [D1] */

function ToggleCapturaContinua({
  ligado,
  onAlternar,
  intervalo,
}: {
  ligado: boolean;
  onAlternar: (v: boolean) => void;
  intervalo: number;
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
          Fotografando a cada {intervalo}s, em silêncio. Só guarda quando o conteúdo muda.
        </Text>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------ seletor de sub-modo [D1] */

function SeletorSubModo({
  selecionado,
  onSelecionar,
}: {
  selecionado: string;
  onSelecionar: (id: string) => void;
}) {
  return (
    <View style={styles.seletor}>
      {subModos.map((m) => {
        const ativo = m.id === selecionado;
        return (
          <Pressable
            key={m.id}
            onPress={() => {
              void Haptics.selectionAsync();
              onSelecionar(m.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Modo ${m.nome}. ${m.problema}`}
            accessibilityState={{ selected: ativo }}
            style={({ pressed }) => [
              styles.itemSeletor,
              ativo && styles.itemSeletorAtivo,
              pressed && styles.itemSeletorPressionado,
            ]}
          >
            <MaterialCommunityIcons
              name={m.icone}
              size={16}
              color={ativo ? colors.primaryHi : colors.textDim}
            />
            <Text style={[styles.textoSeletor, ativo && styles.textoSeletorAtivo]}>
              {m.nome}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------- cartao de descoberta [D1] */

/** Aparece uma unica vez, no instante em que o Modo Aula liga sozinho. Existe
 *  porque recurso que nao se apresenta e recurso que ninguem usa. */
function CartaoDescoberta({
  reduzir,
  onFechar,
}: {
  reduzir: boolean;
  onFechar: () => void;
}) {
  const entrada = useRef(new Animated.Value(reduzir ? 1 : 0)).current;

  useEffect(() => {
    if (reduzir) {
      entrada.setValue(1);
      return;
    }
    const anim = Animated.timing(entrada, {
      toValue: 1,
      duration: 300,
      delay: 420,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduzir, entrada]);

  const subida = entrada.interpolate({ inputRange: [0, 1], outputRange: [spacing(4), 0] });

  return (
    <Animated.View
      style={[styles.descoberta, { opacity: entrada, transform: [{ translateY: subida }] }]}
    >
      <View style={styles.topoDescoberta}>
        <MaterialCommunityIcons name="auto-fix" size={16} color={colors.primaryHi} />
        <Text style={styles.tituloDescoberta}>O Modo Aula ligou sozinho</Text>
        <Pressable
          onPress={onFechar}
          accessibilityRole="button"
          accessibilityLabel="Entendi, fechar o aviso"
          hitSlop={spacing(3)}
          style={styles.fecharDescoberta}
        >
          <Ionicons name="close" size={16} color={colors.textDim} />
        </Pressable>
      </View>
      <Text style={styles.textoDescoberta}>
        A câmera reconheceu uma lousa e sua agenda confirma que você está em aula. A captura foi
        ajustada para texto, não para rosto.
      </Text>
    </Animated.View>
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
  onAbrirEstudos,
}: {
  modoAula: boolean;
  capturando: boolean;
  reduzir: boolean;
  onCapturar: () => void;
  onInverter: () => void;
  onAbrirEstudos: () => void;
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
      <Pressable
        onPress={onAbrirEstudos}
        accessibilityRole="button"
        accessibilityLabel="Abrir Meus Estudos"
        style={({ pressed }) => [styles.miniatura, pressed && styles.miniaturaPressionada]}
      >
        <Ionicons name="images-outline" size={18} color={colors.textDim} />
      </Pressable>

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

  tira: {
    position: 'absolute',
    left: spacing(3),
    right: spacing(3),
    bottom: spacing(22),
    backgroundColor: colors.overlay,
    borderRadius: radius.md,
    paddingVertical: spacing(2.5),
    paddingHorizontal: spacing(3),
  },
  cabecalhoTira: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginBottom: spacing(2),
  },
  pontoGravando: {
    width: spacing(2),
    height: spacing(2),
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
  },
  textoTira: {
    ...fontDado.rotulo,
    color: colors.text,
  },
  listaTira: {
    gap: spacing(2),
  },
  itemTira: {
    alignItems: 'center',
    gap: spacing(1),
  },
  miniaturaTira: {
    width: spacing(11),
    height: spacing(14),
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primaryEdge,
    backgroundColor: colors.surfaceAlt,
  },
  horaTira: {
    ...fontDado.valor,
    fontSize: 10,
    color: colors.textDim,
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

  seletor: {
    height: ALTURA_CARROSSEL,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    paddingHorizontal: spacing(4),
  },
  itemSeletor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    minHeight: spacing(9),
    paddingHorizontal: spacing(3.5),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemSeletorAtivo: {
    borderColor: colors.primaryEdge,
    backgroundColor: colors.primarySoft,
  },
  itemSeletorPressionado: {
    opacity: 0.6,
  },
  textoSeletor: {
    ...font.tiny,
    color: colors.textDim,
  },
  textoSeletorAtivo: {
    color: colors.primaryHi,
  },
  problemaModo: {
    ...font.small,
    color: colors.textFaint,
    textAlign: 'center',
    paddingHorizontal: spacing(6),
    marginTop: -spacing(1),
  },

  descoberta: {
    position: 'absolute',
    left: spacing(3),
    right: spacing(3),
    top: spacing(16),
    backgroundColor: colors.overlay,
    borderWidth: 1,
    borderColor: colors.primaryEdge,
    borderRadius: radius.md,
    padding: spacing(3.5),
    ...shadow.card,
  },
  topoDescoberta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginBottom: spacing(2),
  },
  tituloDescoberta: {
    ...font.bodyMed,
    color: colors.text,
    flex: 1,
  },
  fecharDescoberta: {
    width: spacing(6),
    height: spacing(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoDescoberta: {
    ...font.small,
    color: colors.textDim,
    lineHeight: 17,
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
  miniaturaPressionada: {
    borderColor: colors.primaryEdge,
    backgroundColor: colors.surfaceHi,
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
