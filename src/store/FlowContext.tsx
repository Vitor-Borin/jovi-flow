import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { caminhoSalvar, conteudoIdentificado, plataformas, subModos } from '../data/mock';

const CONECTADAS_PADRAO = plataformas.filter((p) => p.conectadaPorPadrao).map((p) => p.id);
const SUBMODO_PADRAO = subModos[0]?.id ?? 'lousa';

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
  /** Lousa, slide ou caderno: cada um pede um tratamento optico diferente. */
  subModo: string;
  /** Ids das plataformas que o estudante conectou. */
  plataformasConectadas: string[];
  /** O Modo Aula ja se apresentou nesta sessao? A pesquisa do grupo mostrou que
   *  recurso que nao se apresenta e recurso que ninguem descobre. */
  jaApresentouModoAula: boolean;
  ativarFlow: (v: boolean) => void;
  definirFoto: (uri: string | null) => void;
  definirDestino: (d: string[]) => void;
  definirTexto: (t: string) => void;
  definirSubModo: (id: string) => void;
  alternarPlataforma: (id: string) => void;
  marcarApresentacaoVista: () => void;
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
  const [subModo, setSubModo] = useState(SUBMODO_PADRAO);
  const [plataformasConectadas, setPlataformasConectadas] = useState<string[]>(CONECTADAS_PADRAO);
  const [jaApresentouModoAula, setJaApresentou] = useState(false);

  const ativarFlow = useCallback((v: boolean) => setFlowAtivo(v), []);
  const definirFoto = useCallback((uri: string | null) => setFotoUri(uri), []);
  const definirDestino = useCallback((d: string[]) => setDestino(d), []);
  const definirTexto = useCallback((t: string) => setTextoExtraido(t), []);
  const definirSubModo = useCallback((id: string) => setSubModo(id), []);
  const marcarApresentacaoVista = useCallback(() => setJaApresentou(true), []);
  const salvarResumo = useCallback(() => setResumoSalvo(true), []);

  const alternarPlataforma = useCallback((id: string) => {
    setPlataformasConectadas((atual) =>
      atual.includes(id) ? atual.filter((p) => p !== id) : [...atual, id]
    );
  }, []);

  const reiniciar = useCallback(() => {
    setFlowAtivo(false);
    setFotoUri(null);
    setDestino(caminhoSalvar);
    setTextoExtraido(conteudoIdentificado.textoExtraido);
    setResumoSalvo(false);
    setSubModo(SUBMODO_PADRAO);
    setPlataformasConectadas(CONECTADAS_PADRAO);
    setJaApresentou(false);
  }, []);

  const valor = useMemo<FlowState>(
    () => ({
      flowAtivo,
      fotoUri,
      destino,
      textoExtraido,
      resumoSalvo,
      subModo,
      plataformasConectadas,
      jaApresentouModoAula,
      ativarFlow,
      definirFoto,
      definirDestino,
      definirTexto,
      definirSubModo,
      alternarPlataforma,
      marcarApresentacaoVista,
      salvarResumo,
      reiniciar,
    }),
    [
      flowAtivo,
      fotoUri,
      destino,
      textoExtraido,
      resumoSalvo,
      subModo,
      plataformasConectadas,
      jaApresentouModoAula,
      ativarFlow,
      definirFoto,
      definirDestino,
      definirTexto,
      definirSubModo,
      alternarPlataforma,
      marcarApresentacaoVista,
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
