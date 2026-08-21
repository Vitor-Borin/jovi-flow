import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { caminhoSalvar, conteudoIdentificado, plataformas, subModos } from '../data/mock';
import type { ConteudoReconhecido } from '../services/analiseAoVivo';

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
  /** Liga a analise real pela API. Desligado, o app continua 100% offline. */
  modoAoVivo: boolean;
  /** Imagem capturada em base64, usada apenas pelo modo ao vivo. */
  fotoBase64: string | null;
  /** Conteudo reconhecido de verdade. Nulo = usar o conteudo simulado. */
  analiseAoVivo: ConteudoReconhecido | null;
  /** Ha uma analise em andamento neste momento. */
  analisando: boolean;
  ativarFlow: (v: boolean) => void;
  definirFoto: (uri: string | null) => void;
  definirDestino: (d: string[]) => void;
  definirTexto: (t: string) => void;
  definirSubModo: (id: string) => void;
  alternarPlataforma: (id: string) => void;
  marcarApresentacaoVista: () => void;
  alternarModoAoVivo: () => void;
  definirFotoBase64: (b64: string | null) => void;
  definirAnalise: (c: ConteudoReconhecido | null) => void;
  definirAnalisando: (v: boolean) => void;
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
  const [modoAoVivo, setModoAoVivo] = useState(false);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [analiseAoVivo, setAnalise] = useState<ConteudoReconhecido | null>(null);
  const [analisando, setAnalisando] = useState(false);

  const ativarFlow = useCallback((v: boolean) => setFlowAtivo(v), []);
  const definirFoto = useCallback((uri: string | null) => setFotoUri(uri), []);
  const definirDestino = useCallback((d: string[]) => setDestino(d), []);
  const definirTexto = useCallback((t: string) => setTextoExtraido(t), []);
  const definirSubModo = useCallback((id: string) => setSubModo(id), []);
  const marcarApresentacaoVista = useCallback(() => setJaApresentou(true), []);
  const alternarModoAoVivo = useCallback(() => setModoAoVivo((v) => !v), []);
  const definirFotoBase64 = useCallback((b64: string | null) => setFotoBase64(b64), []);
  const definirAnalise = useCallback((c: ConteudoReconhecido | null) => setAnalise(c), []);
  const definirAnalisando = useCallback((v: boolean) => setAnalisando(v), []);
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
    setFotoBase64(null);
    setAnalise(null);
    setAnalisando(false);
    // modoAoVivo nao e limpo de proposito: e uma escolha do apresentador, e nao
    // parte do estado da captura. Reiniciar a demo nao deve desligar a API.
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
      modoAoVivo,
      fotoBase64,
      analiseAoVivo,
      analisando,
      ativarFlow,
      definirFoto,
      definirDestino,
      definirTexto,
      definirSubModo,
      alternarPlataforma,
      marcarApresentacaoVista,
      alternarModoAoVivo,
      definirFotoBase64,
      definirAnalise,
      definirAnalisando,
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
      modoAoVivo,
      fotoBase64,
      analiseAoVivo,
      analisando,
      ativarFlow,
      definirFoto,
      definirDestino,
      definirTexto,
      definirSubModo,
      alternarPlataforma,
      marcarApresentacaoVista,
      alternarModoAoVivo,
      definirFotoBase64,
      definirAnalise,
      definirAnalisando,
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
