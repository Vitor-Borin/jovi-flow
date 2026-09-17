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

export type QualidadeDaVoz = 'premium' | 'aprimorada' | 'basica';

export type VozDaLeitura = {
  identificador: string;
  nome: string;
  qualidade: QualidadeDaVoz;
};

/**
 * Pontua uma voz em portugues do Brasil. Zero fica de fora.
 *
 * No iOS a premium e a aprimorada soam bem mais naturais que a basica, que ja
 * vem instalada. O iOS so marca a aprimorada no campo quality, por isso o
 * identificador entra na conta.
 *
 * O iOS 17 em diante traz tambem vozes de novidade (Eddy, Flo, Grandma, Reed,
 * Rocko, Sandy, Shelley) que imitam sintetizador antigo de proposito. Pelo
 * identificador elas vinham antes da Luciana e empatavam com ela na nota, e a
 * leitura saia com voz de robo. No Android a voz "network" depende de internet.
 */
function notaDaVoz(voz: Speech.Voice): number {
  const id = voz.identifier.toLowerCase();
  if (id.includes('eloquence') || id.includes('network')) return 0;
  if (id.includes('premium')) return 3;
  if (id.includes('enhanced') || voz.quality === Speech.VoiceQuality.Enhanced) return 2;
  return 1;
}

/**
 * A voz mais natural em portugues do Brasil instalada agora. Nulo quando nao ha
 * nenhuma boa: a leitura usa a voz padrao do sistema. Consultada a cada leitura,
 * para uma voz baixada nos ajustes do iPhone valer na hora, sem reabrir o app.
 */
export async function melhorVoz(): Promise<VozDaLeitura | null> {
  try {
    const vozes = await Speech.getAvailableVoicesAsync();
    const melhor = vozes
      .filter((v) => v.language.replace('_', '-').toLowerCase() === 'pt-br' && notaDaVoz(v) > 0)
      .sort((a, b) => notaDaVoz(b) - notaDaVoz(a))[0];
    if (!melhor) return null;
    const nota = notaDaVoz(melhor);
    return {
      identificador: melhor.identifier,
      nome: melhor.name,
      qualidade: nota === 3 ? 'premium' : nota === 2 ? 'aprimorada' : 'basica',
    };
  } catch {
    return null;
  }
}

/**
 * Prepara o texto para a voz. Simbolo lido em voz alta soa como maquina: a voz
 * soletra seta e barra, ou emenda uma linha na outra sem respirar. Seta e
 * separador viram pausa, marca de formatacao sai, e cada linha fecha com ponto.
 */
export function textoParaFala(texto: string): string {
  return texto
    .split(/\n+/)
    .map((linha) =>
      linha
        .replace(/\s*(->|=>|→|›|»|\||·|•)\s*/g, ', ')
        .replace(/[{}[\];`*_#]/g, ' ')
        .replace(/\.{2,}/g, '.')
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.:!?])/g, '$1')
        .replace(/^[\s,.]+|[\s,]+$/g, '')
    )
    .filter((linha) => linha !== '')
    .map((linha) => (/[.!?:]$/.test(linha) ? linha : `${linha}.`))
    .join(' ');
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
    const fala = textoParaFala(texto);
    if (fala === '') return;
    const vez = leituraAtual.current + 1;
    leituraAtual.current = vez;
    void Speech.stop();
    setFalando(true);

    const encerrar = () => {
      if (montado.current && leituraAtual.current === vez) setFalando(false);
    };

    void Promise.all([prepararSessaoDeAudio(), melhorVoz()]).then(([, voz]) => {
      if (!montado.current || leituraAtual.current !== vez) return;
      console.log(
        '[JOVI Flow] voz da leitura:',
        voz ? `${voz.nome}, ${voz.qualidade} (${voz.identificador})` : 'padrao do sistema'
      );
      Speech.speak(fala, {
        language: 'pt-BR',
        voice: voz?.identificador,
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
