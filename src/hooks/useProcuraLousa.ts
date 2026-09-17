import type { CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import { procurarLousa } from '../services/procurarLousa';

/**
 * A camera procura a lousa sozinha: diz se ha uma lousa escrita inteira no
 * enquadramento agora. Em Foto, isso troca o modo para Aula; em Aula, acende a
 * moldura do visor, vibra e avisa o leitor de tela.
 *
 * COMO PROCURA
 *
 * O Expo Go nao entrega os quadros do visor; isso exigiria build nativa com
 * vision-camera. Entao a procura usa a mesma tecnica da captura continua: tira
 * uma foto em silencio, reduz para 200 px e roda nela a deteccao de quadro de
 * services/quadro.ts, com a medida de traco no miolo do quadro. Essa foto e
 * apagada em seguida e nunca aparece para o estudante.
 *
 * A resposta so muda depois de duas procuras seguidas concordarem: uma so pode
 * ser a camera passando por um cartaz enquanto sobe, ou a mao tremendo na borda.
 * Porta, tela apagada e lousa vazia nao tem traco e nao contam.
 *
 * Limitacao honesta: roda cerca de uma vez por segundo, entao e um aviso em
 * passos, e nao continuo. Janela com arvore ou predio ocupando o vidro tem traco
 * e pode passar por lousa. Lousa que nao cabe inteira na foto nao e achada.
 */

/** Espera antes da primeira procura: a camera precisa estar rodando. */
const MS_PRIMEIRA_PROCURA = 800;
/** Intervalo entre o fim de uma procura e o inicio da proxima. A deteccao roda
 *  na thread do JavaScript; espacar deixa o visor e o carrossel respirarem. */
const MS_ENTRE_PROCURAS = 700;
/** Procuras seguidas que precisam concordar para a resposta mudar. */
const SEGUIDAS_PARA_MUDAR = 2;

type Params = {
  /** Procurar agora. Falso com flash, na lente frontal, durante uma captura ou
   *  com outra tela por cima da camera. */
  ativo: boolean;
  cameraRef: RefObject<CameraView | null>;
  /** Trava compartilhada com a captura manual: duas chamadas simultaneas a
   *  takePictureAsync fazem uma das duas falhar. */
  ocupada: RefObject<boolean>;
  /** Chamado quando a lousa entra ou sai do enquadramento, ja confirmado. */
  aoMudar: (noQuadro: boolean) => void;
};

/** Devolve se ha lousa escrita inteira no enquadramento, ja confirmado. */
export function useProcuraLousa({ ativo, cameraRef, ocupada, aoMudar }: Params): boolean {
  const [noQuadro, setNoQuadro] = useState(false);
  const aoMudarRef = useRef(aoMudar);
  useEffect(() => {
    aoMudarRef.current = aoMudar;
  }, [aoMudar]);

  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    let confirmado = false;
    let contrarias = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const agendar = (ms: number) => {
      timer = setTimeout(() => void procurar(), ms);
    };

    const procurar = async () => {
      const camera = cameraRef.current;
      // Camera ocupada com a foto do estudante: tenta de novo depois.
      if (!vivo || !camera || ocupada.current) {
        if (vivo) agendar(MS_ENTRE_PROCURAS);
        return;
      }

      ocupada.current = true;
      let uri: string | null = null;
      let achou = false;
      try {
        // Sem som e com a menor qualidade: esta foto so serve para procurar, e
        // e apagada logo em seguida.
        const foto = await camera.takePictureAsync({ quality: 0.1, shutterSound: false });
        uri = foto?.uri ?? null;
        if (foto?.uri && vivo) achou = await procurarLousa(foto.uri, foto.width, foto.height);
      } catch (erro) {
        console.log('[JOVI Flow] procura da lousa sem foto:', erro);
      } finally {
        ocupada.current = false;
        if (uri) void FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
      }

      if (!vivo) return;
      if (achou === confirmado) {
        contrarias = 0;
      } else {
        contrarias += 1;
        if (contrarias >= SEGUIDAS_PARA_MUDAR) {
          confirmado = achou;
          contrarias = 0;
          setNoQuadro(achou);
          aoMudarRef.current(achou);
        }
      }
      agendar(MS_ENTRE_PROCURAS);
    };

    agendar(MS_PRIMEIRA_PROCURA);
    return () => {
      vivo = false;
      if (timer !== null) clearTimeout(timer);
      // Parou de procurar, parou de afirmar: na volta a moldura comeca apagada.
      setNoQuadro(false);
    };
  }, [ativo, cameraRef, ocupada]);

  return noQuadro;
}
