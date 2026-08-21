import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { caminhoSalvar, conteudoIdentificado } from '../data/mock';

export type FlowState = {
  /** Modo Aula ligado/desligado. */
  flowAtivo: boolean;
  /** Foto REAL capturada pelo usuario na Fase 4. */
  fotoUri: string | null;
  /** Caminho de pastas onde a aula sera salva. Ex.: ['Matemática','Cálculo','Funções'] */
  destino: string[];
  /** Texto reconhecido. Fica no estado porque a tela de Acoes permite edita-lo. */
  textoExtraido: string;
  resumoSalvo: boolean;
  ativarFlow: (v: boolean) => void;
  definirFoto: (uri: string | null) => void;
  definirDestino: (d: string[]) => void;
  definirTexto: (t: string) => void;
  salvarResumo: () => void;
  /** Volta ao estado inicial. Permite refazer o pitch varias vezes sem fechar o app. */
  reiniciar: () => void;
};

const FlowContext = createContext<FlowState | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [flowAtivo, setFlowAtivo] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [destino, setDestino] = useState<string[]>(caminhoSalvar);
  const [textoExtraido, setTextoExtraido] = useState(conteudoIdentificado.textoExtraido);
  const [resumoSalvo, setResumoSalvo] = useState(false);

  const ativarFlow = useCallback((v: boolean) => setFlowAtivo(v), []);
  const definirFoto = useCallback((uri: string | null) => setFotoUri(uri), []);
  const definirDestino = useCallback((d: string[]) => setDestino(d), []);
  const definirTexto = useCallback((t: string) => setTextoExtraido(t), []);
  const salvarResumo = useCallback(() => setResumoSalvo(true), []);

  const reiniciar = useCallback(() => {
    setFlowAtivo(false);
    setFotoUri(null);
    setDestino(caminhoSalvar);
    setTextoExtraido(conteudoIdentificado.textoExtraido);
    setResumoSalvo(false);
  }, []);

  const valor = useMemo<FlowState>(
    () => ({
      flowAtivo,
      fotoUri,
      destino,
      textoExtraido,
      resumoSalvo,
      ativarFlow,
      definirFoto,
      definirDestino,
      definirTexto,
      salvarResumo,
      reiniciar,
    }),
    [
      flowAtivo,
      fotoUri,
      destino,
      textoExtraido,
      resumoSalvo,
      ativarFlow,
      definirFoto,
      definirDestino,
      definirTexto,
      salvarResumo,
      reiniciar,
    ]
  );

  return <FlowContext.Provider value={valor}>{children}</FlowContext.Provider>;
}

export function useFlow(): FlowState {
  const ctx = useContext(FlowContext);
  if (ctx === null) {
    throw new Error('useFlow precisa estar dentro de <FlowProvider>.');
  }
  return ctx;
}
