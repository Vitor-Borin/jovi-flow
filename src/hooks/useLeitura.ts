import { setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Le um texto em voz alta com a sintese de voz nativa do aparelho. Offline,
 * sem dependencia de rede: e o "ouvir a aula" do pitch. Parar ao sair da tela
 * e obrigatorio, senao a voz continua por cima da tela seguinte.
 *
 * Por que o expo-audio: no iOS a voz sintetizada usa a sessao de audio do app,
 * e a sessao padrao obedece ao modo silencioso, entao com o iPhone no
 * silencioso a leitura nao sai som. A sessao passa a ser de reproducao, como a
 * de um player de podcast.
 */

/** Configurada uma vez por abertura do app, no primeiro toque em Ouvir. */
let sessaoDeAudio: Promise<void> | null = null;

function prepararSessaoDeAudio(): Promise<void> {
  if (sessaoDeAudio === null) {
    sessaoDeAudio = setAudioModeAsync({
      playsInSilentMode: true,
      // Musica tocando em outro app abaixa o volume enquanto a aula e lida.
      interruptionMode: 'duckOthers',
      shouldPlayInBackground: false,
      allowsRecording: false,
    }).catch((erro: unknown) => {
      // Sem a sessao a voz ainda sai com o aparelho fora do silencioso.
      console.log('[JOVI Flow] sessao de audio nao configurada:', erro);
      sessaoDeAudio = null;
    });
  }
  return sessaoDeAudio;
}

/** Pontua uma voz em portugues do Brasil. No iOS a premium e a aprimorada soam
 *  bem melhor que a compacta, que e a padrao e a mais robotica. O iOS so marca
 *  a aprimorada no campo quality, por isso o identificador entra na conta. No
 *  Android a voz "network" depende de internet e perde para a local. */
function notaDaVoz(voz: Speech.Voice): number {
  const id = voz.identifier.toLowerCase();
  if (id.includes('network')) return 0;
  if (id.includes('premium')) return 3;
  if (id.includes('enhanced') || voz.quality === Speech.VoiceQuality.Enhanced) return 2;
  return 1;
}

let vozEscolhida: Promise<string | undefined> | null = null;

function escolherVoz(): Promise<string | undefined> {
  if (vozEscolhida === null) {
    vozEscolhida = Speech.getAvailableVoicesAsync()
      .then((vozes) => {
        const ptBr = vozes
          .filter((v) => v.language.replace('_', '-').toLowerCase() === 'pt-br')
          .sort((a, b) => notaDaVoz(b) - notaDaVoz(a));
        const melhor = ptBr[0];
        console.log('[JOVI Flow] voz da leitura:', melhor ? melhor.identifier : 'padrao do sistema');
        return melhor?.identifier;
      })
      .catch(() => undefined);
  }
  return vozEscolhida;
}

export function useLeitura() {
  const [falando, setFalando] = useState(false);
  const montado = useRef(true);
  /** Cada leitura tem um numero. Callback de leitura antiga, ou leitura que
   *  terminou de preparar depois de o usuario tocar em Parar, e ignorada. */
  const leituraAtual = useRef(0);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      leituraAtual.current += 1;
      void Speech.stop();
    };
  }, []);

  const parar = useCallback(() => {
    leituraAtual.current += 1;
    void Speech.stop();
    setFalando(false);
  }, []);

  const falar = useCallback((texto: string) => {
    const limpo = texto.trim();
    if (limpo === '') return;
    const vez = leituraAtual.current + 1;
    leituraAtual.current = vez;
    void Speech.stop();
    setFalando(true);

    const encerrar = () => {
      if (montado.current && leituraAtual.current === vez) setFalando(false);
    };

    void Promise.all([prepararSessaoDeAudio(), escolherVoz()]).then(([, voz]) => {
      if (!montado.current || leituraAtual.current !== vez) return;
      Speech.speak(limpo, {
        language: 'pt-BR',
        voice: voz,
        rate: 1.0,
        pitch: 1.0,
        onDone: encerrar,
        onStopped: encerrar,
        onError: (erro) => {
          console.log('[JOVI Flow] leitura em voz alta falhou:', erro);
          encerrar();
        },
      });
    });
  }, []);

  const alternar = useCallback(
    (texto: string) => {
      if (falando) parar();
      else falar(texto);
    },
    [falando, falar, parar]
  );

  return { falando, falar, parar, alternar };
}
