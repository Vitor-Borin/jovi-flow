import type { CameraView } from 'expo-camera';
import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

/**
 * Captura continua: a camera fotografa sozinha enquanto o estudante assiste a
 * aula, e guarda so os quadros em que o conteudo mudou.
 *
 * COMO A MUDANCA E DETECTADA
 *
 * O Expo Go nao expoe stream de frames da camera — isso exigiria build nativa
 * com vision-camera. O que existe e `takePictureAsync`, entao a deteccao usa um
 * sinal que da para medir com ele: o TAMANHO DO JPEG comprimido em baixa
 * resolucao.
 *
 * E sinal fisico, nao heuristica inventada: compressao JPEG gasta bytes com
 * detalhe de alta frequencia, e escrita no quadro e exatamente isso. O professor
 * escrevendo tres linhas aumenta o arquivo de forma mensuravel; apagar diminui.
 * Ruido de sensor com a cena parada mexe uns 1 a 2 por cento, bem abaixo do
 * limiar.
 *
 * Limitacao honesta: alguem passando na frente tambem muda o tamanho. Na pratica
 * isso e aceitavel — capturar um quadro a mais custa pouco, e perder o momento em
 * que o professor terminou a demonstracao custa a aula inteira.
 *
 * Os valores medidos vao para o console a cada ciclo, para o limiar poder ser
 * calibrado com numeros reais do aparelho em vez de chute.
 */

/** Intervalo entre disparos. */
const INTERVALO_MS = 5000;

/** Variacao relativa de tamanho a partir da qual consideramos que o quadro mudou. */
const LIMIAR_VARIACAO = 0.08;

/** Mesmo sem variacao, guarda um quadro de tempos em tempos: quadro que muda
 *  devagar nao pode passar despercebido a aula inteira. */
const MS_FORCAR_GUARDA = 45000;

/** Teto de quadros guardados numa sessao, para nao crescer sem limite. */
const MAX_FRAMES = 20;

/** Resolucao usada so para medir a variacao. Pequena de proposito: e mais
 *  rapido, gasta menos memoria e diminui o peso do ruido de sensor. */
const PX_MEDICAO = 200;

export type FrameContinuo = {
  id: string;
  uri: string;
  hora: string;
  /** Variacao de detalhe que fez este quadro ser guardado, em porcentagem. */
  variacao: number;
};

type Params = {
  ativo: boolean;
  cameraRef: RefObject<CameraView | null>;
  /** Falso enquanto a camera nao esta disponivel (permissao negada, por exemplo). */
  disponivel: boolean;
  /** Trava compartilhada com a captura manual. Duas chamadas simultaneas a
   *  takePictureAsync fazem uma das duas falhar, entao as duas passam por aqui. */
  ocupada: RefObject<boolean>;
};

function agoraHHMM(): string {
  const d = new Date();
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${dois(d.getHours())}:${dois(d.getMinutes())}:${dois(d.getSeconds())}`;
}

export function useCapturaContinua({ ativo, cameraRef, disponivel, ocupada }: Params) {
  const [frames, setFrames] = useState<FrameContinuo[]>([]);
  const [ciclos, setCiclos] = useState(0);

  const montado = useRef(true);
  const emCaptura = useRef(false);
  const tamanhoReferencia = useRef<number | null>(null);
  const instanteUltimoGuardado = useRef(0);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const limpar = useCallback(() => {
    setFrames([]);
    setCiclos(0);
    tamanhoReferencia.current = null;
    instanteUltimoGuardado.current = 0;
  }, []);

  useEffect(() => {
    if (!ativo || !disponivel) return;

    const ciclo = async () => {
      // Nunca dois disparos ao mesmo tempo: o segundo falharia e poderia
      // travar a camera.
      if (emCaptura.current || ocupada.current || !montado.current) return;
      emCaptura.current = true;
      ocupada.current = true;

      try {
        const camera = cameraRef.current;
        if (!camera) return;

        // Sem som e sem animacao: em sala de aula, uma camera que apita a cada
        // cinco segundos e inutilizavel.
        const foto = await camera.takePictureAsync({
          quality: 0.6,
          shutterSound: false,
        });
        if (!foto?.uri || !montado.current) return;

        const medida = await manipulateAsync(
          foto.uri,
          [{ resize: { width: PX_MEDICAO } }],
          { base64: true, compress: 0.5, format: SaveFormat.JPEG }
        );
        if (!montado.current) return;

        const tamanho = medida.base64?.length ?? 0;
        if (tamanho === 0) return;

        const referencia = tamanhoReferencia.current;
        const variacao = referencia === null ? 1 : Math.abs(tamanho - referencia) / referencia;
        const desdeUltimo = Date.now() - instanteUltimoGuardado.current;

        const primeiro = referencia === null;
        const mudou = variacao >= LIMIAR_VARIACAO;
        const venceuPrazo = desdeUltimo >= MS_FORCAR_GUARDA;
        const guardar = primeiro || mudou || venceuPrazo;

        console.log(
          `[JOVI Flow] continua: ${tamanho} bytes, variacao ${(variacao * 100).toFixed(1)}% -> ${guardar ? 'GUARDA' : 'descarta'}`
        );

        setCiclos((c) => c + 1);

        if (!guardar) return;

        tamanhoReferencia.current = tamanho;
        instanteUltimoGuardado.current = Date.now();

        setFrames((atuais) => {
          const novo: FrameContinuo = {
            id: `${Date.now()}`,
            uri: foto.uri,
            hora: agoraHHMM(),
            variacao: primeiro ? 0 : Math.round(variacao * 100),
          };
          const lista = [...atuais, novo];
          return lista.length > MAX_FRAMES ? lista.slice(lista.length - MAX_FRAMES) : lista;
        });
      } catch (erro) {
        console.log('[JOVI Flow] ciclo da captura continua falhou:', erro);
      } finally {
        emCaptura.current = false;
        ocupada.current = false;
      }
    };

    // Um disparo imediato para o primeiro quadro virar referencia sem esperar.
    void ciclo();
    const timer = setInterval(() => void ciclo(), INTERVALO_MS);

    return () => clearInterval(timer);
  }, [ativo, disponivel, cameraRef, ocupada]);

  // Desligar limpa a sessao: o proximo uso comeca do zero.
  useEffect(() => {
    if (!ativo) limpar();
  }, [ativo, limpar]);

  return {
    frames,
    ciclos,
    limpar,
    intervaloSegundos: INTERVALO_MS / 1000,
    ultimoFrame: frames.length > 0 ? frames[frames.length - 1] : null,
  };
}
