import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Le um texto em voz alta com a sintese de voz nativa do aparelho. Offline,
 * sem dependencia de rede: e o "ouvir a aula" do pitch. Parar ao sair da tela
 * e obrigatorio, senao a voz continua por cima da tela seguinte.
 */
export function useLeitura() {
  const [falando, setFalando] = useState(false);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      void Speech.stop();
    };
  }, []);

  const parar = useCallback(() => {
    void Speech.stop();
    setFalando(false);
  }, []);

  const falar = useCallback((texto: string) => {
    const limpo = texto.trim();
    if (limpo === '') return;
    void Speech.stop();
    setFalando(true);
    Speech.speak(limpo, {
      language: 'pt-BR',
      rate: 1.0,
      pitch: 1.0,
      onDone: () => {
        if (montado.current) setFalando(false);
      },
      onStopped: () => {
        if (montado.current) setFalando(false);
      },
      onError: () => {
        if (montado.current) setFalando(false);
      },
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
