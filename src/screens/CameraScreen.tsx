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
import type { LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WhiteboardFallback } from '../components/WhiteboardFallback';
import { ordenarAulas } from '../data/acervo';
import type { SubModo } from '../data/mock';
import { subModos } from '../data/mock';
import type { FrameContinuo } from '../hooks/useCapturaContinua';
import { useCapturaContinua } from '../hooks/useCapturaContinua';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import type { RootStackParamList } from '../navigation/types';
import {
  PX,
  classificarCaptura,
  gerarEstudo,
  prepararImagem,
  transcreverCaptura,
} from '../services/analiseAoVivo';
import { useAcervo } from '../store/AcervoContext';
import { useFlow } from '../store/FlowContext';
import { TOQUE_MIN, colors, font, fontModo, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

/**
 * O visor copia o layout da camera da JOVI (Funtouch OS): preto de ponta a
 * ponta, visor 4:3 sem borda, icones brancos em cima, zoom sobre a imagem,
 * modos em caixa alta e obturador branco. AULA e um modo do carrossel, igual a
 * RETRATO ou NOITE. E assim que o Flow entraria no aparelho de verdade, e a
 * tela precisa sustentar isso sem explicacao verbal.
 */

type Modo = 'NOITE' | 'RETRATO' | 'FOTO' | 'AULA' | 'VÍDEO';
const MODOS: Modo[] = ['NOITE', 'RETRATO', 'FOTO', 'AULA', 'VÍDEO'];

const ALTURA_BARRA = 48;
const ALTURA_SUBMODOS = 44;
const ALTURA_MODOS = 44;
const ALTURA_OBTURADOR = 104;
const TAMANHO_OBTURADOR = 72;
const TAMANHO_MINIATURA = 44;

/** Tempo ate a camera "reconhecer" a lousa e deslizar sozinha para AULA. */
const MS_ATE_DETECTAR = 2500;
const MS_AVISO_DETECCAO = 2200;

/** Niveis de zoom oferecidos. O valor vai direto para a camera (0 a 1). */
const ZOOMS: { rotulo: string; valor: number }[] = [
  { rotulo: '1', valor: 0 },
  { rotulo: '2', valor: 0.12 },
];

/** A camera lembra o ultimo modo, como uma camera de verdade. Voltar do fluxo
 *  de salvar reabre direto em AULA, sem repetir a deteccao. */
let ultimoModo: Modo = 'FOTO';

export function CameraScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduzir = useReduzirMovimento();
  const {
    definirFoto,
    subModo,
    definirSubModo,
    modoAoVivo,
    definirFotoBase64,
    definirClassificacao,
    definirTranscricao,
    definirEstudo,
    definirAnalisando,
    definirTexto,
    definirDestino,
    definirSequencia,
    limparCaptura,
  } = useFlow();
  const { acervo, caminhos } = useAcervo();

  const modoAtual: SubModo = subModos.find((m) => m.id === subModo) ?? subModos[0];

  const [modo, setModoEstado] = useState<Modo>(ultimoModo);
  const [flashLigado, setFlashLigado] = useState(false);
  const [hdr, setHdr] = useState(true);
  const [fotoAoVivo, setFotoAoVivo] = useState(false);
  const [lente, setLente] = useState<CameraType>('back');
  const [zoom, setZoom] = useState(0);
  const [capturaContinua, setCapturaContinua] = useState(false);
  const [erroCamera, setErroCamera] = useState(false);
  const [capturando, setCapturando] = useState(false);
  const [avisoDeteccao, setAvisoDeteccao] = useState(false);
  const [ultimaFoto, setUltimaFoto] = useState<string | null>(null);

  const [permissao, pedirPermissao] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const montado = useRef(true);
  const jaPediuPermissao = useRef(false);
  const jaDetectou = useRef(false);
  const capturaAtual = useRef(0);
  const cameraOcupada = useRef(false);

  const modoAula = modo === 'AULA';

  const setModo = useCallback((m: Modo) => {
    ultimoModo = m;
    setModoEstado(m);
  }, []);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  useEffect(() => {
    if (!permissao || permissao.granted || jaPediuPermissao.current) return;
    jaPediuPermissao.current = true;
    void pedirPermissao();
  }, [permissao, pedirPermissao]);

  const mostrarCamera = permissao?.granted === true && !erroCamera;

  const continuaAtiva = capturaContinua && modoAula && mostrarCamera;
  const sequencia = useCapturaContinua({
    ativo: continuaAtiva,
    cameraRef,
    disponivel: mostrarCamera,
    ocupada: cameraOcupada,
  });

  // A deteccao da lousa: uma vez por abertura da camera, quando ela esta em
  // FOTO. O carrossel desliza para AULA sozinho e um aviso curto diz por que.
  useEffect(() => {
    if (modo !== 'FOTO' || jaDetectou.current) return;
    const timer = setTimeout(() => {
      if (!montado.current) return;
      jaDetectou.current = true;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setModo('AULA');
      setAvisoDeteccao(true);
    }, MS_ATE_DETECTAR);
    return () => clearTimeout(timer);
  }, [modo, setModo]);

  useEffect(() => {
    if (!avisoDeteccao) return;
    const timer = setTimeout(() => setAvisoDeteccao(false), MS_AVISO_DETECCAO);
    return () => clearTimeout(timer);
  }, [avisoDeteccao]);

  // Miniatura da galeria: a foto mais recente do acervo, ate uma foto nova ser
  // tirada nesta sessao.
  const miniaturaAcervo = useMemo(() => {
    for (const aula of ordenarAulas(acervo.aulas)) {
      const pagina = [...aula.paginas].reverse().find((p) => p.fotoUri !== null);
      if (pagina?.fotoUri) return pagina.fotoUri;
    }
    return null;
  }, [acervo.aulas]);
  const miniatura = ultimaFoto ?? miniaturaAcervo;

  const dimensoesVisor = useMemo(() => {
    const disponivel =
      height -
      insets.top -
      insets.bottom -
      ALTURA_BARRA -
      ALTURA_SUBMODOS -
      ALTURA_MODOS -
      ALTURA_OBTURADOR;
    // 4:3 ocupando a largura toda. Em aparelho curto o visor encolhe para os
    // controles nunca saírem da tela.
    return { largura: width, altura: Math.min(width * (4 / 3), Math.max(disponivel, spacing(60))) };
  }, [width, height, insets.top, insets.bottom]);

  const aoTocarObturador = useCallback(async () => {
    if (capturando || cameraOcupada.current) return;
    setCapturando(true);
    cameraOcupada.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let foto: { uri: string; width: number; height: number } | null = null;
      if (mostrarCamera && cameraRef.current) {
        const r = await cameraRef.current.takePictureAsync({ quality: 0.85 });
        if (r?.uri) foto = { uri: r.uri, width: r.width, height: r.height };
      }

      if (!modoAula) {
        // Nos outros modos a camera e so camera: tira a foto e mostra na
        // miniatura. O prototipo nao grava na galeria do aparelho.
        if (foto) setUltimaFoto(foto.uri);
        return;
      }

      // Cada captura comeca do zero: some o resultado da anterior e o exemplo
      // so e substituido quando a leitura real chegar.
      limparCaptura();
      if (foto) definirFoto(foto.uri);

      const quadros = sequencia.frames;
      const primeiro = quadros[0];
      const ultimo = quadros[quadros.length - 1];
      definirSequencia(
        quadros.length,
        primeiro && ultimo ? { inicio: primeiro.hora.slice(0, 5), fim: ultimo.hora.slice(0, 5) } : null
      );

      if (modoAoVivo && foto) {
        const seq = capturaAtual.current + 1;
        capturaAtual.current = seq;
        definirAnalisando(true);

        const [pequena, grande] = await Promise.all([
          prepararImagem(foto.uri, foto.width, foto.height, PX.classificacao),
          prepararImagem(foto.uri, foto.width, foto.height, PX.transcricao),
        ]);
        definirFotoBase64(grande);

        // Tres chamadas independentes e paralelas. Se uma falhar, so aquela
        // parte cai no exemplo.
        const pClass = classificarCaptura(pequena, modoAtual.id, caminhos).then((r) => {
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

        const pEstudo = gerarEstudo(grande, modoAtual.id).then((r) => {
          if (capturaAtual.current !== seq) return;
          if (r.estado === 'ok') {
            definirEstudo(r.dados);
            console.log(
              `[JOVI Flow] material de estudo em ${r.ms}ms: ${r.dados.flashcards.length} cartoes, ${r.dados.questoes.length} questoes`
            );
          } else {
            console.log('[JOVI Flow] material de estudo indisponivel:', r.estado);
          }
        });

        void Promise.all([pClass, pTrans, pEstudo]).then(() => {
          if (capturaAtual.current === seq) definirAnalisando(false);
        });
      }

      navigation.navigate('Processing');
    } catch (erro) {
      // Sem foto a demo continua: as telas seguintes caem no exemplo de lousa.
      console.log('[JOVI Flow] captura falhou, seguindo sem foto:', erro);
      if (modoAula) navigation.navigate('Processing');
    } finally {
      cameraOcupada.current = false;
      if (montado.current) setCapturando(false);
    }
  }, [
    capturando,
    mostrarCamera,
    modoAula,
    limparCaptura,
    definirFoto,
    sequencia.frames,
    definirSequencia,
    modoAoVivo,
    definirAnalisando,
    definirFotoBase64,
    modoAtual.id,
    caminhos,
    definirClassificacao,
    definirDestino,
    definirTranscricao,
    definirTexto,
    definirEstudo,
    navigation,
  ]);

  return (
    <View style={[styles.tela, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <BarraSuperior
        flashLigado={flashLigado}
        hdr={hdr}
        fotoAoVivo={fotoAoVivo}
        modoAula={modoAula}
        continua={capturaContinua}
        onAlternarFlash={() => setFlashLigado((v) => !v)}
        onAlternarHdr={() => setHdr((v) => !v)}
        onAlternarFotoAoVivo={() => setFotoAoVivo((v) => !v)}
        onAlternarContinua={() => {
          void Haptics.selectionAsync();
          setCapturaContinua((v) => !v);
        }}
        onAbrirAjustes={() => navigation.navigate('Tabs', { screen: 'Perfil' })}
      />

      <View style={styles.areaVisor}>
        <View style={[styles.visor, { width: dimensoesVisor.largura, height: dimensoesVisor.altura }]}>
          {mostrarCamera ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={lente}
              zoom={zoom}
              flash={(flashLigado ? 'on' : 'off') satisfies FlashMode}
              animateShutter={!continuaAtiva}
              onMountError={() => setErroCamera(true)}
            />
          ) : (
            <WhiteboardFallback style={styles.fallback} />
          )}

          {modoAula ? <MolduraDeteccao reduzir={reduzir} /> : null}

          {avisoDeteccao ? <AvisoDeteccao reduzir={reduzir} nome={modoAtual.nome} /> : null}

          {continuaAtiva ? (
            <TiraSequencia
              frames={sequencia.frames}
              intervalo={sequencia.intervaloSegundos}
              reduzir={reduzir}
            />
          ) : null}

          {permissao !== null && !permissao.granted ? (
            <AvisoPermissao onPermitir={() => void pedirPermissao()} />
          ) : null}

          <SeletorZoom valor={zoom} onSelecionar={setZoom} />
        </View>
      </View>

      {/* Onde o Retrato da JOVI mostra 23 / 35 / 50 mm, o Modo Aula mostra a
          superficie: lousa, slide e caderno pedem tratamentos opticos opostos. */}
      <View style={styles.faixaSubModos}>
        {modoAula ? (
          <SeletorSubModo selecionado={modoAtual.id} onSelecionar={definirSubModo} />
        ) : null}
      </View>

      <CarrosselModos selecionado={modo} onSelecionar={setModo} reduzir={reduzir} />

      <LinhaObturador
        modo={modo}
        capturando={capturando}
        miniatura={miniatura}
        onCapturar={() => void aoTocarObturador()}
        onInverter={() => setLente((v) => (v === 'back' ? 'front' : 'back'))}
        onAbrirGaleria={() => navigation.navigate('Tabs', { screen: 'Estudos' })}
      />
    </View>
  );
}

/* ---------------------------------------------------------------- barra superior */

function BarraSuperior({
  flashLigado,
  hdr,
  fotoAoVivo,
  modoAula,
  continua,
  onAlternarFlash,
  onAlternarHdr,
  onAlternarFotoAoVivo,
  onAlternarContinua,
  onAbrirAjustes,
}: {
  flashLigado: boolean;
  hdr: boolean;
  fotoAoVivo: boolean;
  modoAula: boolean;
  continua: boolean;
  onAlternarFlash: () => void;
  onAlternarHdr: () => void;
  onAlternarFotoAoVivo: () => void;
  onAlternarContinua: () => void;
  onAbrirAjustes: () => void;
}) {
  return (
    <View style={styles.barra}>
      <Pressable
        onPress={onAlternarFlash}
        accessibilityRole="button"
        accessibilityLabel={flashLigado ? 'Desligar o flash' : 'Ligar o flash'}
        accessibilityState={{ selected: flashLigado }}
        style={styles.itemBarra}
      >
        <Ionicons
          name={flashLigado ? 'flash' : 'flash-off-outline'}
          size={20}
          color={flashLigado ? colors.warn : colors.visor.icone}
        />
      </Pressable>

      <Pressable
        onPress={onAlternarHdr}
        accessibilityRole="button"
        accessibilityLabel={hdr ? 'Desligar o HDR' : 'Ligar o HDR'}
        accessibilityState={{ selected: hdr }}
        style={styles.itemBarra}
      >
        <Text style={[styles.textoBarra, !hdr && styles.textoBarraApagado]}>HDR</Text>
      </Pressable>

      {modoAula ? (
        // Em AULA o lugar da foto ao vivo vira a captura continua: a camera
        // fotografa sozinha durante a aula e guarda so o que mudou.
        <Pressable
          onPress={onAlternarContinua}
          accessibilityRole="switch"
          accessibilityLabel="Captura contínua"
          accessibilityState={{ checked: continua }}
          style={styles.itemBarra}
        >
          <MaterialCommunityIcons
            name="camera-burst"
            size={22}
            color={continua ? colors.warn : colors.visor.icone}
          />
        </Pressable>
      ) : (
        <Pressable
          onPress={onAlternarFotoAoVivo}
          accessibilityRole="button"
          accessibilityLabel={fotoAoVivo ? 'Desligar a foto ao vivo' : 'Ligar a foto ao vivo'}
          accessibilityState={{ selected: fotoAoVivo }}
          style={styles.itemBarra}
        >
          <MaterialCommunityIcons
            name="circle-double"
            size={20}
            color={fotoAoVivo ? colors.warn : colors.visor.icone}
          />
        </Pressable>
      )}

      <View style={styles.itemBarra}>
        <Text style={styles.textoBarra}>4:3</Text>
      </View>

      <Pressable
        onPress={onAbrirAjustes}
        accessibilityRole="button"
        accessibilityLabel="Ajustes da câmera"
        style={styles.itemBarra}
      >
        <Ionicons name="settings-outline" size={20} color={colors.visor.icone} />
      </Pressable>
    </View>
  );
}

/* ---------------------------------------------------------- moldura de deteccao */

/** Quatro cantos encaixando na lousa. E o unico sinal visual de que a camera
 *  entrou em AULA, alem do proprio carrossel. */
function MolduraDeteccao({ reduzir }: { reduzir: boolean }) {
  const encaixe = useRef(new Animated.Value(reduzir ? 1 : 0)).current;

  useEffect(() => {
    if (reduzir) {
      encaixe.setValue(1);
      return;
    }
    const anim = Animated.timing(encaixe, { toValue: 1, duration: 620, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [reduzir, encaixe]);

  const escala = encaixe.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.moldura, { opacity: encaixe, transform: [{ scale: escala }] }]}
    >
      <View style={[styles.canto, styles.cantoSE]} />
      <View style={[styles.canto, styles.cantoSD]} />
      <View style={[styles.canto, styles.cantoIE]} />
      <View style={[styles.canto, styles.cantoID]} />
    </Animated.View>
  );
}

/* ------------------------------------------------------------ aviso de deteccao */

/** Aparece por dois segundos quando a camera troca para AULA sozinha. Diz o
 *  que aconteceu e some: a tela nao fica explicando o modo que ja esta escrito
 *  no carrossel. */
function AvisoDeteccao({ reduzir, nome }: { reduzir: boolean; nome: string }) {
  const entrada = useRef(new Animated.Value(reduzir ? 1 : 0)).current;

  useEffect(() => {
    if (reduzir) {
      entrada.setValue(1);
      return;
    }
    const anim = Animated.timing(entrada, { toValue: 1, duration: 220, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [reduzir, entrada]);

  const subida = entrada.interpolate({ inputRange: [0, 1], outputRange: [spacing(2), 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.avisoDeteccao, { opacity: entrada, transform: [{ translateY: subida }] }]}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${nome} reconhecida. Modo Aula ligado.`}
    >
      <MaterialCommunityIcons name="auto-fix" size={14} color={colors.visor.icone} />
      <Text style={styles.textoAvisoDeteccao}>{nome} reconhecida · Modo Aula</Text>
    </Animated.View>
  );
}

/* ------------------------------------------------------------- tira da sequencia */

function TiraSequencia({
  frames,
  intervalo,
  reduzir,
}: {
  frames: FrameContinuo[];
  intervalo: number;
  reduzir: boolean;
}) {
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
    <View style={styles.tira} pointerEvents="none">
      <View style={styles.cabecalhoTira}>
        <Animated.View style={[styles.pontoGravando, { opacity: opacidade }]} />
        <Text style={styles.textoTira}>
          {frames.length === 0
            ? `A cada ${intervalo}s · guarda só o que mudou`
            : `${frames.length} ${frames.length === 1 ? 'quadro guardado' : 'quadros guardados'}`}
        </Text>
      </View>
      {ultimos.length > 0 ? (
        <View style={styles.listaTira}>
          {ultimos.map((f) => (
            <View key={f.id} style={styles.itemTira}>
              <Image source={{ uri: f.uri }} style={styles.miniaturaTira} resizeMode="cover" />
              <Text style={styles.horaTira}>{f.hora.slice(0, 5)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------- zoom */

function SeletorZoom({ valor, onSelecionar }: { valor: number; onSelecionar: (v: number) => void }) {
  return (
    <View style={styles.zoom}>
      {ZOOMS.map((z) => {
        const ativo = z.valor === valor;
        return (
          <Pressable
            key={z.rotulo}
            onPress={() => {
              void Haptics.selectionAsync();
              onSelecionar(z.valor);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Zoom ${z.rotulo} vezes`}
            accessibilityState={{ selected: ativo }}
            style={[styles.bolinhaZoom, ativo && styles.bolinhaZoomAtiva]}
          >
            <Text style={[styles.textoZoom, ativo && styles.textoZoomAtivo]}>
              {ativo ? `${z.rotulo}×` : z.rotulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* --------------------------------------------------------------- sub-modos */

function SeletorSubModo({
  selecionado,
  onSelecionar,
}: {
  selecionado: string;
  onSelecionar: (id: string) => void;
}) {
  return (
    <View style={styles.subModos}>
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
            accessibilityLabel={`${m.nome}. ${m.problema}`}
            accessibilityState={{ selected: ativo }}
            style={[styles.pilulaSubModo, ativo && styles.pilulaSubModoAtiva]}
          >
            <MaterialCommunityIcons
              name={m.icone}
              size={14}
              color={ativo ? colors.visor.fundo : colors.visor.icone}
            />
            <Text style={[styles.textoSubModo, ativo && styles.textoSubModoAtivo]}>{m.nome}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* --------------------------------------------------------- carrossel de modos */

/** Regua de modos centrada no selecionado, como na camera da JOVI. Mede a
 *  largura de cada rotulo para deslizar a regua inteira e deixar o modo ativo
 *  no meio da tela. */
function CarrosselModos({
  selecionado,
  onSelecionar,
  reduzir,
}: {
  selecionado: Modo;
  onSelecionar: (m: Modo) => void;
  reduzir: boolean;
}) {
  const { width } = useWindowDimensions();
  const [larguras, setLarguras] = useState<Record<string, number>>({});
  const deslocamento = useRef(new Animated.Value(0)).current;

  const ESPACO = spacing(7);

  // Posicao x do centro de cada rotulo dentro da regua.
  const centros = useMemo(() => {
    const resultado: Record<string, number> = {};
    let x = 0;
    MODOS.forEach((m) => {
      const l = larguras[m] ?? 0;
      resultado[m] = x + l / 2;
      x += l + ESPACO;
    });
    return resultado;
  }, [larguras, ESPACO]);

  const pronto = MODOS.every((m) => larguras[m] !== undefined);

  useEffect(() => {
    if (!pronto) return;
    const alvo = width / 2 - (centros[selecionado] ?? 0);
    if (reduzir) {
      deslocamento.setValue(alvo);
      return;
    }
    const anim = Animated.spring(deslocamento, {
      toValue: alvo,
      damping: 18,
      stiffness: 160,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [selecionado, centros, pronto, width, reduzir, deslocamento]);

  const medir = (m: Modo) => (e: LayoutChangeEvent) => {
    const l = e.nativeEvent.layout.width;
    setLarguras((atual) => (atual[m] === l ? atual : { ...atual, [m]: l }));
  };

  return (
    <View style={styles.modos}>
      <Animated.View
        style={[
          styles.reguaModos,
          // Invisivel ate medir os rotulos, para a regua nao pular do canto
          // esquerdo para o centro no primeiro quadro.
          { gap: ESPACO, opacity: pronto ? 1 : 0, transform: [{ translateX: deslocamento }] },
        ]}
      >
        {MODOS.map((m) => {
          const ativo = m === selecionado;
          return (
            <Pressable
              key={m}
              onLayout={medir(m)}
              onPress={() => {
                if (ativo) return;
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
      </Animated.View>
    </View>
  );
}

/* ---------------------------------------------------------- linha do obturador */

function LinhaObturador({
  modo,
  capturando,
  miniatura,
  onCapturar,
  onInverter,
  onAbrirGaleria,
}: {
  modo: Modo;
  capturando: boolean;
  miniatura: string | null;
  onCapturar: () => void;
  onInverter: () => void;
  onAbrirGaleria: () => void;
}) {
  const video = modo === 'VÍDEO';
  const aula = modo === 'AULA';

  return (
    <View style={styles.linhaObturador}>
      <Pressable
        onPress={onAbrirGaleria}
        accessibilityRole="button"
        accessibilityLabel="Abrir as aulas capturadas"
        style={({ pressed }) => [styles.miniatura, pressed && styles.pressionado]}
      >
        {miniatura ? (
          <Image source={{ uri: miniatura }} style={styles.imagemMiniatura} resizeMode="cover" />
        ) : (
          <Ionicons name="images-outline" size={18} color={colors.visor.icone} />
        )}
      </Pressable>

      <Pressable
        onPress={onCapturar}
        disabled={capturando}
        accessibilityRole="button"
        accessibilityLabel={aula ? 'Capturar conteúdo de aula' : video ? 'Gravar' : 'Tirar foto'}
        accessibilityState={{ disabled: capturando }}
        style={({ pressed }) => [styles.obturador, pressed && styles.obturadorPressionado]}
      >
        <View style={[styles.miolodObturador, video && styles.miolodVideo]}>
          {aula ? (
            <MaterialCommunityIcons name="school-outline" size={22} color={colors.visor.fundo} />
          ) : null}
        </View>
      </Pressable>

      <Pressable
        onPress={onInverter}
        accessibilityRole="button"
        accessibilityLabel="Inverter câmera"
        style={({ pressed }) => [styles.botaoInverter, pressed && styles.pressionado]}
      >
        <Ionicons name="camera-reverse-outline" size={22} color={colors.visor.icone} />
      </Pressable>
    </View>
  );
}

/* ---------------------------------------------------------- aviso de permissao */

function AvisoPermissao({ onPermitir }: { onPermitir: () => void }) {
  return (
    <View style={styles.aviso}>
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

/* ------------------------------------------------------------------- estilos */

const TAMANHO_CANTO = 28;
const ESPESSURA_CANTO = 3;

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.visor.fundo,
  },

  barra: {
    height: ALTURA_BARRA,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing(2),
  },
  itemBarra: {
    minWidth: TOQUE_MIN,
    height: TOQUE_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBarra: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.visor.icone,
  },
  textoBarraApagado: {
    color: colors.visor.iconeFraco,
    textDecorationLine: 'line-through',
  },

  areaVisor: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  visor: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
  },

  moldura: {
    position: 'absolute',
    top: spacing(6),
    bottom: spacing(14),
    left: spacing(5),
    right: spacing(5),
  },
  canto: {
    position: 'absolute',
    width: TAMANHO_CANTO,
    height: TAMANHO_CANTO,
    borderColor: colors.visor.icone,
  },
  cantoSE: { top: 0, left: 0, borderTopWidth: ESPESSURA_CANTO, borderLeftWidth: ESPESSURA_CANTO, borderTopLeftRadius: 6 },
  cantoSD: { top: 0, right: 0, borderTopWidth: ESPESSURA_CANTO, borderRightWidth: ESPESSURA_CANTO, borderTopRightRadius: 6 },
  cantoIE: { bottom: 0, left: 0, borderBottomWidth: ESPESSURA_CANTO, borderLeftWidth: ESPESSURA_CANTO, borderBottomLeftRadius: 6 },
  cantoID: { bottom: 0, right: 0, borderBottomWidth: ESPESSURA_CANTO, borderRightWidth: ESPESSURA_CANTO, borderBottomRightRadius: 6 },

  avisoDeteccao: {
    position: 'absolute',
    top: spacing(3),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(3),
    borderRadius: radius.pill,
    backgroundColor: colors.visor.pilula,
    borderWidth: 1,
    borderColor: colors.visor.pilulaBorda,
  },
  textoAvisoDeteccao: {
    ...font.small,
    fontWeight: '600',
    color: colors.visor.icone,
  },

  tira: {
    position: 'absolute',
    left: spacing(3),
    right: spacing(3),
    top: spacing(12),
    gap: spacing(2),
  },
  cabecalhoTira: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    alignSelf: 'flex-start',
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2.5),
    borderRadius: radius.pill,
    backgroundColor: colors.visor.pilula,
  },
  pontoGravando: {
    width: spacing(2),
    height: spacing(2),
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
  },
  textoTira: {
    ...font.small,
    fontWeight: '600',
    color: colors.visor.icone,
  },
  listaTira: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  itemTira: {
    alignItems: 'center',
    gap: spacing(1),
  },
  miniaturaTira: {
    width: spacing(11),
    height: spacing(8),
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.visor.pilulaBorda,
  },
  horaTira: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.visor.icone,
  },

  zoom: {
    position: 'absolute',
    bottom: spacing(3),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    padding: spacing(1),
    borderRadius: radius.pill,
    backgroundColor: colors.visor.pilula,
  },
  bolinhaZoom: {
    minWidth: spacing(8),
    height: spacing(8),
    paddingHorizontal: spacing(2),
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolinhaZoomAtiva: {
    backgroundColor: colors.visor.icone,
  },
  textoZoom: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.visor.icone,
  },
  textoZoomAtivo: {
    color: colors.visor.fundo,
  },

  faixaSubModos: {
    height: ALTURA_SUBMODOS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subModos: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  pilulaSubModo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    height: spacing(8),
    paddingHorizontal: spacing(3.5),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  pilulaSubModoAtiva: {
    backgroundColor: colors.visor.icone,
  },
  textoSubModo: {
    ...font.small,
    fontWeight: '600',
    color: colors.visor.icone,
  },
  textoSubModoAtivo: {
    color: colors.visor.fundo,
  },

  modos: {
    height: ALTURA_MODOS,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  reguaModos: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  itemModo: {
    height: ALTURA_MODOS,
    justifyContent: 'center',
  },
  textoModo: {
    ...fontModo,
    color: colors.visor.iconeFraco,
  },
  textoModoAtivo: {
    color: colors.visor.icone,
    fontWeight: '700',
  },

  linhaObturador: {
    flex: 1,
    minHeight: ALTURA_OBTURADOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(9),
  },
  miniatura: {
    width: TAMANHO_MINIATURA,
    height: TAMANHO_MINIATURA,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.visor.pilulaBorda,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagemMiniatura: {
    width: '100%',
    height: '100%',
  },
  pressionado: {
    opacity: 0.6,
  },
  obturador: {
    width: TAMANHO_OBTURADOR,
    height: TAMANHO_OBTURADOR,
    borderRadius: radius.pill,
    borderWidth: 4,
    borderColor: colors.visor.obturador,
    alignItems: 'center',
    justifyContent: 'center',
  },
  obturadorPressionado: {
    opacity: 0.7,
  },
  miolodObturador: {
    width: TAMANHO_OBTURADOR - 16,
    height: TAMANHO_OBTURADOR - 16,
    borderRadius: radius.pill,
    backgroundColor: colors.visor.obturador,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miolodVideo: {
    width: spacing(6),
    height: spacing(6),
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
  },
  botaoInverter: {
    width: TAMANHO_MINIATURA,
    height: TAMANHO_MINIATURA,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aviso: {
    position: 'absolute',
    left: spacing(3),
    right: spacing(3),
    top: spacing(3),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: radius.md,
    backgroundColor: colors.visor.pilula,
  },
  avisoTexto: {
    ...font.small,
    color: colors.visor.icone,
    flex: 1,
  },
  avisoBotao: {
    minHeight: spacing(8),
    paddingHorizontal: spacing(3),
    borderRadius: radius.pill,
    backgroundColor: colors.visor.icone,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avisoBotaoTexto: {
    ...font.small,
    fontWeight: '700',
    color: colors.visor.fundo,
  },
});
