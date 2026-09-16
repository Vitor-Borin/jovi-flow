import type { CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

import { procurarLousa } from '../services/tratarLousa';

/**
 * A camera procura a lousa sozinha enquanto esta em Foto, e so troca para Aula
 * quando acha uma de verdade.
 *
 * COMO PROCURA
 *
 * O Expo Go nao entrega os quadros do visor; isso exigiria build nativa com
 * vision-camera. Entao a procura usa a mesma tecnica da captura continua: tira
 * uma foto em silencio, reduz para 200 px e roda nela a deteccao de cantos do
 * tratamento da lousa, com a medida de traco no miolo do quadro.
 *
 * So conta quando duas procuras seguidas acham quadro inteiro com escrita: uma
 * so pode ser a camera passando por um cartaz enquanto sobe. Porta, tela
 * apagada e lousa vazia nao tem traco e nao trocam o modo.
 *
 * Limitacao honesta: janela com arvore ou predio ocupando o vidro tem traco e
 * pode passar por lousa. Lousa que nao cabe inteira na foto nao e achada, e o
 * estudante escolhe Aula no carrossel.
 */

/** Espera antes da primeira procura: a camera precisa estar rodando. */
const MS_PRIMEIRA_PROCURA = 800;
/** Intervalo entre o fim de uma procura e o inicio da proxima. A deteccao roda
 *  na thread do JavaScript; espacar deixa o visor e o carrossel respirarem. */
const MS_ENTRE_PROCURAS = 900;
const ACERTOS_SEGUIDOS = 2;

type Params = {
  /** Procurar agora. Falso fora de Foto, com flash, na lente frontal ou com
   *  outra tela por cima da camera. */
  ativo: boolean;
  cameraRef: RefObject<CameraView | null>;
  /** Trava compartilhada com a captura manual: duas chamadas simultaneas a
   *  takePictureAsync fazem uma das duas falhar. */
  ocupada: RefObject<boolean>;
  aoAchar: () => void;
};

export function useProcuraLousa({ ativo, cameraRef, ocupada, aoAchar }: Params) {
  const aoAcharRef = useRef(aoAchar);
  useEffect(() => {
    aoAcharRef.current = aoAchar;
  }, [aoAchar]);

  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    let acertos = 0;
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
      try {
        // Sem som e com a menor qualidade: esta foto so serve para procurar, e
        // e apagada logo em seguida.
        const foto = await camera.takePictureAsync({ quality: 0.1, shutterSound: false });
        uri = foto?.uri ?? null;
        if (foto?.uri && vivo) {
          const achou = await procurarLousa(foto.uri, foto.width, foto.height);
          acertos = achou ? acertos + 1 : 0;
        }
      } catch (erro) {
        console.log('[JOVI Flow] procura da lousa sem foto:', erro);
        acertos = 0;
      } finally {
        ocupada.current = false;
        if (uri) void FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
      }

      if (!vivo) return;
      if (acertos >= ACERTOS_SEGUIDOS) {
        aoAcharRef.current();
        return;
      }
      agendar(MS_ENTRE_PROCURAS);
    };

    agendar(MS_PRIMEIRA_PROCURA);
    return () => {
      vivo = false;
      if (timer !== null) clearTimeout(timer);
    };
  }, [ativo, cameraRef, ocupada]);
}
