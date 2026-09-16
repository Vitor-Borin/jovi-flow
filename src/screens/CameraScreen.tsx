import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
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

import { FolhaModos } from '../components/FolhaModos';
import { WhiteboardFallback } from '../components/WhiteboardFallback';
import { ordenarAulas } from '../data/acervo';
import type { SubModo } from '../data/mock';
import { subModos } from '../data/mock';
import type { FrameContinuo } from '../hooks/useCapturaContinua';
import { useCapturaContinua } from '../hooks/useCapturaContinua';
import { useProcuraLousa } from '../hooks/useProcuraLousa';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';
import type { RootStackParamList } from '../navigation/types';
import {
  PX,
  classificarCaptura,
  gerarEstudo,
  prepararImagem,
  transcreverCaptura,
} from '../services/analiseAoVivo';
import type { ResultadoLousa } from '../services/tratarLousa';
import { tratarLousa } from '../services/tratarLousa';
import { useAcervo } from '../store/AcervoContext';
import { useFlow } from '../store/FlowContext';
import { TOQUE_MIN, colors, font, fontModo, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

/**
 * O visor copia a camera do JOVI V50, medida em capturas reais do aparelho:
 * preto de ponta a ponta, visor 4:3 sem borda, icones soltos em cima, zoom em
 * texto sobre a imagem, modos com capitalizacao normal, selecionado em amarelo
 * e obturador vazado com anel amarelo. Aula e um modo do carrossel, igual a
 * Retrato ou Noite. E assim que o Flow entraria no aparelho de verdade, e a
 * tela precisa sustentar isso sem explicacao verbal.
 */

type Modo = 'Noite' | 'Retrato' | 'Foto' | 'Aula' | 'Vídeo';

/** Os cinco modos que o prototipo implementa. Mais fecha a regua, como na
 *  camera da JOVI, e abre a folha com os modos reais do aparelho. */
const MODOS: Modo[] = ['Noite', 'Retrato', 'Foto', 'Aula', 'Vídeo'];
const MAIS = 'Mais';
const ITENS_REGUA: string[] = [...MODOS, MAIS];

function ehModo(v: string): v is Modo {
  return (MODOS as string[]).includes(v);
}

const ALTURA_BARRA = 48;
const ALTURA_MODOS = 44;
/** No V50 o centro do obturador fica 94 pt abaixo do visor: 44 da regua de
 *  modos mais metade desta faixa. */
const ALTURA_OBTURADOR = 100;

/** Obturador do V50: 68 pt, anel branco de 4, vao de 3 e anel amarelo de 1,5
 *  com o centro vazio. */
const TAMANHO_OBTURADOR = 68;
const ANEL_BRANCO = 4;
const VAO_ANEL = 3;
const ANEL_AMARELO = 1.5;
const TAMANHO_MIOLO = TAMANHO_OBTURADOR - 2 * (ANEL_BRANCO + VAO_ANEL);

const TAMANHO_MINIATURA = 40;
const ALTURA_PILULA = 32;
/** Completa a pilula ate a area tocavel minima sem aumentar o desenho. */
const FOLGA_PILULA = (TOQUE_MIN - ALTURA_PILULA) / 2;

const MS_AVISO_DETECCAO = 2200;

/** Quanto a transcricao espera pela lousa tratada antes de ler a original. */
const MS_ESPERA_TRATAMENTO = 2500;

/** Quanto o obturador espera a camera sair da procura da lousa ou da captura
 *  continua. Uma foto pequena leva menos de um segundo. */
const MS_ESPERA_CAMERA = 2500;

function esperar(ms: number): Promise<null> {
  return new Promise((resolver) => setTimeout(() => resolver(null), ms));
}

/** Espera a trava da camera soltar. Falso se ela nao soltar a tempo. */
async function esperarCameraLivre(ocupada: { current: boolean }): Promise<boolean> {
  const inicio = Date.now();
  while (ocupada.current) {
    if (Date.now() - inicio > MS_ESPERA_CAMERA) return false;
    await esperar(40);
  }
  return true;
}

/** Niveis de zoom oferecidos. O valor vai direto para a camera (0 a 1). */
const ZOOMS: { rotulo: string; valor: number }[] = [
  { rotulo: '1', valor: 0 },
  { rotulo: '2', valor: 0.12 },
];

/** A camera lembra o ultimo modo, como uma camera de verdade. Voltar do fluxo
 *  de salvar reabre direto em Aula, sem repetir a deteccao. */
let ultimoModo: Modo = 'Foto';

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
    registrarFotoSolta,
    definirTratamento,
  } = useFlow();
  const { acervo, caminhos } = useAcervo();

  const modoAtual: SubModo = subModos.find((m) => m.id === subModo) ?? subModos[0];

  const [modo, setModoEstado] = useState<Modo>(ultimoModo);
  const [flashLigado, setFlashLigado] = useState(false);
  const [lente, setLente] = useState<CameraType>('back');
  const [zoom, setZoom] = useState(0);
  const [capturaContinua, setCapturaContinua] = useState(false);
  const [erroCamera, setErroCamera] = useState(false);
  const [capturando, setCapturando] = useState(false);
  const [lousaReconhecida, setLousaReconhecida] = useState(false);
  const [avisoDeteccao, setAvisoDeteccao] = useState(false);
  const [ultimaFoto, setUltimaFoto] = useState<string | null>(null);
  const [modosAbertos, setModosAbertos] = useState(false);

  const [permissao, pedirPermissao] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const montado = useRef(true);
  const jaPediuPermissao = useRef(false);
  const capturaAtual = useRef(0);
  const cameraOcupada = useRef(false);
  const obturadorOcupado = useRef(false);

  const modoAula = modo === 'Aula';

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

  // A procura da lousa: em Foto, com a lente traseira, sem flash, com a camera
  // na frente e fora de uma captura do estudante. Achou lousa escrita de
  // verdade, o carrossel desliza para Aula e um aviso curto diz por que. Uma vez
  // por abertura da camera.
  const focada = useIsFocused();
  const procurandoLousa =
    modo === 'Foto' &&
    mostrarCamera &&
    focada &&
    lente === 'back' &&
    !flashLigado &&
    !capturando &&
    !lousaReconhecida;
  const aoAcharLousa = useCallback(() => {
    if (!montado.current) return;
    setLousaReconhecida(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModo('Aula');
    setAvisoDeteccao(true);
  }, [setModo]);
  useProcuraLousa({
    ativo: procurandoLousa,
    cameraRef,
    ocupada: cameraOcupada,
    aoAchar: aoAcharLousa,
  });

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
      if (pagina?.fotoUri) return pagina.fotoOriginalUri ?? pagina.fotoUri;
    }
    return null;
  }, [acervo.aulas]);
  const miniatura = ultimaFoto ?? miniaturaAcervo;

  const dimensoesVisor = useMemo(() => {
    const disponivel =
      height - insets.top - insets.bottom - ALTURA_BARRA - ALTURA_MODOS - ALTURA_OBTURADOR;
    // 4:3 ocupando a largura toda. Em aparelho curto o visor encolhe para os
    // controles nunca saírem da tela.
    return { largura: width, altura: Math.min(width * (4 / 3), Math.max(disponivel, spacing(60))) };
  }, [width, height, insets.top, insets.bottom]);

  const aoTocarObturador = useCallback(async () => {
    if (obturadorOcupado.current) return;
    obturadorOcupado.current = true;
    setCapturando(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // A procura da lousa e a captura continua usam a mesma camera: o toque
    // espera ela soltar, em vez de ser ignorado.
    if (!(await esperarCameraLivre(cameraOcupada))) {
      obturadorOcupado.current = false;
      if (montado.current) setCapturando(false);
      return;
    }
    cameraOcupada.current = true;

    try {
      let foto: { uri: string; width: number; height: number } | null = null;
      if (mostrarCamera && cameraRef.current) {
        const r = await cameraRef.current.takePictureAsync({ quality: 0.85 });
        if (r?.uri) foto = { uri: r.uri, width: r.width, height: r.height };
      }

      if (!modoAula) {
        // Nos outros modos a camera e so camera: tira a foto, mostra na
        // miniatura e poe na aba Fotos da galeria. Nao vira aula e nao e gravada.
        if (foto) {
          setUltimaFoto(foto.uri);
          registrarFotoSolta(foto.uri);
        }
        return;
      }

      // Cada captura comeca do zero: some o resultado da anterior e o exemplo
      // so e substituido quando a leitura real chegar.
      limparCaptura();
      const seq = capturaAtual.current + 1;
      capturaAtual.current = seq;
      if (foto) definirFoto(foto.uri);

      const quadros = sequencia.frames;
      const primeiro = quadros[0];
      const ultimo = quadros[quadros.length - 1];
      definirSequencia(
        quadros.length,
        primeiro && ultimo ? { inicio: primeiro.hora.slice(0, 5), fim: ultimo.hora.slice(0, 5) } : null
      );

      // [D1] O tratamento da foto comeca ja, em paralelo com a leitura da IA. A
      // tela de processamento mostra o antes e o depois de verdade.
      const tratamento: Promise<ResultadoLousa> | null = foto
        ? tratarLousa(foto.uri, foto.width, foto.height)
        : null;
      if (tratamento) {
        definirTratamento({ estado: 'tratando' });
        void tratamento.then((resultado) => {
          if (capturaAtual.current === seq) definirTratamento(resultado);
        });
      }

      if (modoAoVivo && foto) {
        definirAnalisando(true);
        const original = foto;
        // Nada aqui segura a camera: a tela de processamento abre na hora.
        void (async () => {
          try {
            // A classificacao le a foto original pequena, que fica pronta logo:
            // ela preenche o topo da tela e nao pode esperar o tratamento.
            const pequena = await prepararImagem(
              original.uri,
              original.width,
              original.height,
              PX.classificacao
            );
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

            // Transcricao e estudo leem a lousa tratada, se ela ficar pronta a
            // tempo: reta e com a luz por igual, a leitura melhora. Se demorar
            // ou falhar, leem a foto original.
            const resultado = tratamento
              ? await Promise.race([tratamento, esperar(MS_ESPERA_TRATAMENTO)])
              : null;
            const lousa = resultado?.estado === 'tratada' ? resultado.lousa : null;
            const grande = lousa
              ? await prepararImagem(lousa.uri, lousa.largura, lousa.altura, PX.transcricao)
              : await prepararImagem(original.uri, original.width, original.height, PX.transcricao);
            if (capturaAtual.current !== seq) return;
            definirFotoBase64(grande);

            const pTrans = transcreverCaptura(grande, modoAtual.id).then((r) => {
              if (capturaAtual.current !== seq) return;
              if (r.estado === 'ok') {
                definirTranscricao(r.dados);
                definirTexto(r.dados.textoExtraido);
                console.log(
                  `[JOVI Flow] transcricao em ${r.ms}ms, lendo a foto ${lousa ? 'tratada' : 'original'}`
                );
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

            await Promise.all([pClass, pTrans, pEstudo]);
          } catch (erro) {
            console.log('[JOVI Flow] leitura ao vivo falhou, seguindo com o exemplo:', erro);
          } finally {
            if (capturaAtual.current === seq) definirAnalisando(false);
          }
        })();
      }

      navigation.navigate('Processing');
    } catch (erro) {
      // Sem foto a demo continua: as telas seguintes caem no exemplo de lousa.
      console.log('[JOVI Flow] captura falhou, seguindo sem foto:', erro);
      if (modoAula) navigation.navigate('Processing');
    } finally {
      cameraOcupada.current = false;
      obturadorOcupado.current = false;
      if (montado.current) setCapturando(false);
    }
  }, [
    mostrarCamera,
    modoAula,
    limparCaptura,
    registrarFotoSolta,
    definirFoto,
    definirTratamento,
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
        modoAula={modoAula}
        continua={capturaContinua}
        onAlternarFlash={() => setFlashLigado((v) => !v)}
        onAlternarContinua={() => {
          void Haptics.selectionAsync();
          setCapturaContinua((v) => !v);
        }}
        onAbrirAjustes={() => navigation.navigate('Ajustes')}
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
              animateShutter={!continuaAtiva && !procurandoLousa}
              onMountError={() => setErroCamera(true)}
            />
          ) : (
            <WhiteboardFallback style={styles.fallback} />
          )}

          {modoAula ? <MolduraDeteccao reduzir={reduzir} /> : null}

          {avisoDeteccao ? <AvisoDeteccao reduzir={reduzir} texto={modoAtual.reconhecido} /> : null}

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

          {/* Onde o Retrato da JOVI mostra 23 / 35 / 50 mm, na base do visor, o
              Modo Aula mostra a superficie: lousa, slide e caderno pedem
              tratamentos opticos opostos. Fica sobre a imagem para a regua de
              modos continuar colada no visor, como no V50. */}
          {modoAula ? (
            <SeletorSubModo selecionado={modoAtual.id} onSelecionar={definirSubModo} />
          ) : null}

          <SeletorZoom valor={zoom} onSelecionar={setZoom} />
        </View>
      </View>

      <CarrosselModos
        selecionado={modo}
        onSelecionar={setModo}
        onAbrirMais={() => setModosAbertos(true)}
        reduzir={reduzir}
      />

      <FolhaModos
        aberto={modosAbertos}
        selecionado={modo}
        onSelecionar={(nome) => {
          if (ehModo(nome)) setModo(nome);
        }}
        onFechar={() => setModosAbertos(false)}
      />

      <LinhaObturador
        modo={modo}
        capturando={capturando}
        miniatura={miniatura}
        onCapturar={() => void aoTocarObturador()}
        onInverter={() => setLente((v) => (v === 'back' ? 'front' : 'back'))}
        // Em Aula a galeria ja abre nas aulas; nos outros modos, nas fotos,
        // como a galeria que qualquer camera abre pela miniatura.
        onAbrirGaleria={() =>
          navigation.navigate('Galeria', { screen: modoAula ? 'Aulas' : 'Fotos' })
        }
      />
    </View>
  );
}

/* ---------------------------------------------------------------- barra superior */

/** So os atalhos que agem de verdade, no layout reduzido que o proprio V50 usa
 *  fora do modo Foto: flash na ponta esquerda, ajustes na direita e, em Aula,
 *  a captura continua no meio. HDR e foto ao vivo sairam: nao mudavam a
 *  captura, e no V50 o HDR nem fica nesta barra, fica no painel de ajustes. */
function BarraSuperior({
  flashLigado,
  modoAula,
  continua,
  onAlternarFlash,
  onAlternarContinua,
  onAbrirAjustes,
}: {
  flashLigado: boolean;
  modoAula: boolean;
  continua: boolean;
  onAlternarFlash: () => void;
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
          size={22}
          color={flashLigado ? colors.visor.destaque : colors.visor.icone}
        />
      </Pressable>

      {modoAula ? (
        // A camera fotografa sozinha durante a aula e guarda so o que mudou.
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
            color={continua ? colors.visor.destaque : colors.visor.icone}
          />
        </Pressable>
      ) : null}

      <Pressable
        onPress={onAbrirAjustes}
        accessibilityRole="button"
        accessibilityLabel="Ajustes da câmera"
        style={styles.itemBarra}
      >
        <Ionicons name="settings-outline" size={22} color={colors.visor.icone} />
      </Pressable>
    </View>
  );
}

/* ---------------------------------------------------------- moldura de deteccao */

/** Quatro cantos encaixando na lousa. E o unico sinal visual de que a camera
 *  entrou em Aula, alem do proprio carrossel. */
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

/** Aparece por dois segundos quando a procura acha a lousa e a camera troca
 *  para Aula sozinha. Diz o que aconteceu e some: a tela nao fica explicando o
 *  modo que ja esta escrito no carrossel. */
function AvisoDeteccao({ reduzir, texto }: { reduzir: boolean; texto: string }) {
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
      accessibilityLabel={`${texto}. Modo Aula ligado.`}
    >
      <MaterialCommunityIcons name="auto-fix" size={14} color={colors.visor.icone} />
      <Text style={styles.textoAvisoDeteccao}>{texto} · Modo Aula</Text>
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

/** Zoom como no V50: numeros soltos sobre a imagem, separados por pontos. O
 *  ativo fica amarelo, com o "x", sobre um circulo escuro que o mantem legivel
 *  mesmo com a camera apontada para uma lousa branca. */
function SeletorZoom({ valor, onSelecionar }: { valor: number; onSelecionar: (v: number) => void }) {
  return (
    <View style={styles.zoom}>
      {ZOOMS.map((z, i) => {
        const ativo = z.valor === valor;
        return (
          <View key={z.rotulo} style={styles.itemZoom}>
            {i > 0 ? <Text style={styles.separadorZoom}>···</Text> : null}
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                onSelecionar(z.valor);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Zoom ${z.rotulo} vezes`}
              accessibilityState={{ selected: ativo }}
              style={styles.toqueZoom}
            >
              <View style={[styles.circuloZoom, ativo && styles.circuloZoomAtivo]}>
                <Text style={[styles.textoZoom, ativo && styles.textoZoomAtivo]}>
                  {ativo ? `${z.rotulo}x` : z.rotulo}
                </Text>
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

/* --------------------------------------------------------------- sub-modos */

/** Mesmo desenho do seletor Vivido / Texturizado / Natural do V50: a opcao
 *  ativa numa pilula amarela com texto preto, as outras so em texto. O veu
 *  escuro por tras faz o papel do preto que o V50 tem atras do seletor. */
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
            hitSlop={{ top: FOLGA_PILULA, bottom: FOLGA_PILULA }}
            accessibilityRole="button"
            accessibilityLabel={`${m.nome}. ${m.problema}`}
            accessibilityState={{ selected: ativo }}
            style={[styles.pilulaSubModo, ativo && styles.pilulaSubModoAtiva]}
          >
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
  onAbrirMais,
  reduzir,
}: {
  selecionado: Modo;
  onSelecionar: (m: Modo) => void;
  onAbrirMais: () => void;
  reduzir: boolean;
}) {
  const { width } = useWindowDimensions();
  const [larguras, setLarguras] = useState<Record<string, number>>({});
  const deslocamento = useRef(new Animated.Value(0)).current;

  // 26 pt entre os rotulos, medido na regua do V50.
  const ESPACO = spacing(6.5);

  // Posicao x do centro de cada rotulo dentro da regua.
  const centros = useMemo(() => {
    const resultado: Record<string, number> = {};
    let x = 0;
    ITENS_REGUA.forEach((m) => {
      const l = larguras[m] ?? 0;
      resultado[m] = x + l / 2;
      x += l + ESPACO;
    });
    return resultado;
  }, [larguras, ESPACO]);

  const pronto = ITENS_REGUA.every((m) => larguras[m] !== undefined);

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

  const medir = (m: string) => (e: LayoutChangeEvent) => {
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
        {ITENS_REGUA.map((m) => {
          const ehMais = m === MAIS;
          const ativo = m === selecionado;
          return (
            <Pressable
              key={m}
              onLayout={medir(m)}
              onPress={() => {
                if (ehMais) {
                  void Haptics.selectionAsync();
                  onAbrirMais();
                  return;
                }
                if (ativo || !ehModo(m)) return;
                void Haptics.selectionAsync();
                onSelecionar(m);
              }}
              accessibilityRole="button"
              accessibilityLabel={ehMais ? 'Mais modos da câmera' : `Modo ${m}`}
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
  const video = modo === 'Vídeo';
  const aula = modo === 'Aula';

  return (
    <View style={styles.linhaObturador}>
      <Pressable
        onPress={onAbrirGaleria}
        accessibilityRole="button"
        accessibilityLabel="Abrir a galeria"
        style={({ pressed }) => [styles.toqueCanto, pressed && styles.pressionado]}
      >
        <View style={styles.miniatura}>
          {miniatura ? (
            <Image source={{ uri: miniatura }} style={styles.imagemMiniatura} resizeMode="cover" />
          ) : (
            <Ionicons name="images-outline" size={18} color={colors.visor.icone} />
          )}
        </View>
      </Pressable>

      <Pressable
        onPress={onCapturar}
        disabled={capturando}
        accessibilityRole="button"
        accessibilityLabel={aula ? 'Capturar conteúdo de aula' : video ? 'Gravar' : 'Tirar foto'}
        accessibilityState={{ disabled: capturando }}
        style={({ pressed }) => [styles.obturador, pressed && styles.obturadorPressionado]}
      >
        <View style={video ? styles.mioloVideo : styles.anelAmarelo} />
      </Pressable>

      <Pressable
        onPress={onInverter}
        accessibilityRole="button"
        accessibilityLabel="Inverter câmera"
        style={({ pressed }) => [styles.toqueCanto, pressed && styles.pressionado]}
      >
        <Ionicons name="sync-outline" size={30} color={colors.visor.icone} />
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

  // Flash e ajustes com o centro a ~32 pt das bordas, como no V50.
  barra: {
    height: ALTURA_BARRA,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(2.5),
  },
  itemBarra: {
    minWidth: TOQUE_MIN,
    height: TOQUE_MIN,
    alignItems: 'center',
    justifyContent: 'center',
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
    ...StyleSheet.absoluteFill,
    borderRadius: 0,
  },

  // A base da moldura para acima do seletor de superficie e do zoom.
  moldura: {
    position: 'absolute',
    top: spacing(6),
    bottom: spacing(25),
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

  // No V50 o centro do zoom fica 28 pt acima da base do visor.
  zoom: {
    position: 'absolute',
    bottom: spacing(1.5),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemZoom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toqueZoom: {
    width: TOQUE_MIN,
    height: TOQUE_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloZoom: {
    width: spacing(8),
    height: spacing(8),
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloZoomAtivo: {
    backgroundColor: colors.visor.veu,
  },
  textoZoom: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.visor.icone,
    textShadowColor: colors.visor.sombra,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  textoZoomAtivo: {
    color: colors.visor.destaque,
    textShadowRadius: 0,
  },
  // Margem negativa aproxima os numeros: no V50 os centros ficam a ~45 pt.
  separadorZoom: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginHorizontal: -spacing(1),
    color: colors.visor.icone,
    textShadowColor: colors.visor.sombra,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },

  subModos: {
    position: 'absolute',
    bottom: spacing(1.5) + TOQUE_MIN + spacing(1),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    padding: spacing(0.75),
    borderRadius: radius.sm,
    backgroundColor: colors.visor.veu,
  },
  pilulaSubModo: {
    height: ALTURA_PILULA,
    paddingHorizontal: spacing(3.5),
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pilulaSubModoAtiva: {
    backgroundColor: colors.visor.destaque,
  },
  textoSubModo: {
    fontSize: 13,
    fontWeight: '700',
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
    color: colors.visor.icone,
  },
  textoModoAtivo: {
    color: colors.visor.destaque,
  },

  // Miniatura e inverter com o centro a ~41 pt das bordas, como no V50. O
  // espaco que sobra embaixo fica vazio, e o obturador nao desce com ele.
  linhaObturador: {
    height: ALTURA_OBTURADOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(5),
  },
  toqueCanto: {
    width: TOQUE_MIN,
    height: TOQUE_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniatura: {
    width: TAMANHO_MINIATURA,
    height: TAMANHO_MINIATURA,
    borderRadius: radius.xs,
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
    borderWidth: ANEL_BRANCO,
    borderColor: colors.visor.obturador,
    alignItems: 'center',
    justifyContent: 'center',
  },
  obturadorPressionado: {
    opacity: 0.7,
  },
  anelAmarelo: {
    width: TAMANHO_MIOLO,
    height: TAMANHO_MIOLO,
    borderRadius: radius.pill,
    borderWidth: ANEL_AMARELO,
    borderColor: colors.visor.destaque,
  },
  mioloVideo: {
    width: TAMANHO_MIOLO,
    height: TAMANHO_MIOLO,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
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
