import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { caminhoSalvar, conteudoIdentificado, plataformas, subModos } from '../data/mock';
import type {
  ClassificacaoAoVivo,
  EstudoAoVivo,
  TranscricaoAoVivo,
} from '../services/analiseAoVivo';
import { carregarChaveGuardada, esquecerChave, guardarChave } from '../services/analiseAoVivo';

/** Guarda so a escolha de desligar a analise. Sem nada gravado, a analise liga
 *  sozinha quando existe chave: e o que o apresentador espera ao abrir o app. */
const CHAVE_PREFERENCIA_AO_VIVO = 'jovi-flow.ao-vivo.v1';

/**
 * A captura em andamento: o que vai da camera ate a tela de acoes. Depois de
 * salva, a aula mora no acervo (store/AcervoContext) e este estado pode ser
 * reaproveitado pela proxima foto.
 */

export type FotoSolta = { uri: string; tiradaEm: number };

const CONECTADAS_PADRAO = plataformas.filter((p) => p.conectadaPorPadrao).map((p) => p.id);
const AUTOMATICAS_PADRAO = plataformas.filter((p) => p.automaticaPorPadrao).map((p) => p.id);
const SUBMODO_PADRAO = subModos[0]?.id ?? 'lousa';

export type FlowState = {
  /** Foto REAL capturada pelo usuario, como a camera entregou. O app nao altera
   *  esta foto: e ela que aparece, que vai para a aula e que a IA le. */
  fotoUri: string | null;
  /** Pasta onde a captura vai ser salva: [materia, subpasta]. */
  destino: [string, string];
  /** Texto reconhecido. Fica no estado porque a tela de Acoes permite edita-lo. */
  textoExtraido: string;
  /** Lousa, slide ou caderno: cada um pede um tratamento optico diferente. */
  subModo: string;
  /** Ids das plataformas que o estudante conectou. */
  plataformasConectadas: string[];
  /** Subconjunto das conectadas que envia sem perguntar. */
  plataformasAutomaticas: string[];
  /** Conectadas que perguntam antes e que o usuario ja mandou na mao. */
  enviadasManualmente: string[];
  /** Liga a analise real pela API. Desligado, o app continua 100% offline.
   *  Abre ligado quando ha chave guardada, a menos que o usuario tenha
   *  desligado em Ajustes. */
  modoAoVivo: boolean;
  /** Ha chave da Anthropic guardada neste aparelho. */
  temChave: boolean;
  /** Fotos tiradas fora do modo Aula nesta abertura do app, da mais nova para
   *  a mais antiga. Nao viram aula e nao sao gravadas: aparecem na aba Fotos
   *  da galeria para ela mostrar tudo o que a camera tirou. */
  fotosSoltas: FotoSolta[];
  registrarFotoSolta: (uri: string) => void;
  /** Imagem capturada em base64, usada apenas pelo modo ao vivo. */
  fotoBase64: string | null;
  /** Materia, tema e topico lidos da foto. Nulo = usar o exemplo. */
  classificacao: ClassificacaoAoVivo | null;
  /** Transcricao e resumo lidos da foto. Chega depois, e tudo bem. */
  transcricao: TranscricaoAoVivo | null;
  /** Flashcards e questoes lidos da foto. */
  estudo: EstudoAoVivo | null;
  /** Ha alguma chamada em andamento. */
  analisando: boolean;
  /** Quantos quadros a captura continua guardou nesta sessao. */
  quadrosSequencia: number;
  janelaSequencia: { inicio: string; fim: string } | null;
  definirFoto: (uri: string | null) => void;
  definirDestino: (d: [string, string]) => void;
  definirTexto: (t: string) => void;
  definirSubModo: (id: string) => void;
  alternarPlataforma: (id: string) => void;
  alternarAutomatico: (id: string) => void;
  enviarAgora: (id: string) => void;
  alternarModoAoVivo: () => void;
  /** Guarda a chave e liga a analise. Devolve se ficou no cofre do aparelho. */
  salvarChave: (valor: string) => Promise<'cofre' | 'memoria'>;
  /** Apaga a chave do aparelho e desliga a analise. */
  apagarChave: () => Promise<void>;
  definirFotoBase64: (b64: string | null) => void;
  definirClassificacao: (c: ClassificacaoAoVivo | null) => void;
  definirTranscricao: (t: TranscricaoAoVivo | null) => void;
  definirEstudo: (e: EstudoAoVivo | null) => void;
  definirAnalisando: (v: boolean) => void;
  definirSequencia: (quadros: number, janela: { inicio: string; fim: string } | null) => void;
  /** Limpa a captura em andamento. A proxima foto comeca do zero. */
  limparCaptura: () => void;
  /** Volta ao estado inicial, incluindo as plataformas. */
  reiniciar: () => void;
};

const FlowContext = createContext<FlowState | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [destino, setDestino] = useState<[string, string]>(caminhoSalvar);
  const [textoExtraido, setTextoExtraido] = useState(conteudoIdentificado.textoExtraido);
  const [subModo, setSubModo] = useState(SUBMODO_PADRAO);
  const [plataformasConectadas, setPlataformasConectadas] = useState<string[]>(CONECTADAS_PADRAO);
  const [plataformasAutomaticas, setPlataformasAutomaticas] = useState<string[]>(AUTOMATICAS_PADRAO);
  const [enviadasManualmente, setEnviadasManualmente] = useState<string[]>([]);
  const [modoAoVivo, setModoAoVivo] = useState(false);
  const [temChave, setTemChave] = useState(false);
  const [fotosSoltas, setFotosSoltas] = useState<FotoSolta[]>([]);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [classificacao, setClassificacao] = useState<ClassificacaoAoVivo | null>(null);
  const [transcricao, setTranscricao] = useState<TranscricaoAoVivo | null>(null);
  const [estudo, setEstudo] = useState<EstudoAoVivo | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const [quadrosSequencia, setQuadros] = useState(0);
  const [janelaSequencia, setJanela] = useState<{ inicio: string; fim: string } | null>(null);

  const definirFoto = useCallback((uri: string | null) => setFotoUri(uri), []);
  const definirDestino = useCallback((d: [string, string]) => setDestino(d), []);
  const definirTexto = useCallback((t: string) => setTextoExtraido(t), []);
  const definirSubModo = useCallback((id: string) => setSubModo(id), []);
  // Na abertura: a chave sai do cofre, e a analise liga sozinha se houver chave
  // e o usuario nao tiver desligado antes.
  useEffect(() => {
    let ativo = true;
    void (async () => {
      const [comChave, preferencia] = await Promise.all([
        carregarChaveGuardada(),
        AsyncStorage.getItem(CHAVE_PREFERENCIA_AO_VIVO).catch(() => null),
      ]);
      if (!ativo) return;
      setTemChave(comChave);
      setModoAoVivo(comChave && preferencia !== 'desligado');
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const alternarModoAoVivo = useCallback(() => {
    setModoAoVivo((v) => {
      const novo = !v;
      void AsyncStorage.setItem(CHAVE_PREFERENCIA_AO_VIVO, novo ? 'ligado' : 'desligado').catch(
        () => undefined
      );
      return novo;
    });
  }, []);

  const salvarChave = useCallback(async (valor: string) => {
    const onde = await guardarChave(valor);
    setTemChave(true);
    setModoAoVivo(true);
    await AsyncStorage.setItem(CHAVE_PREFERENCIA_AO_VIVO, 'ligado').catch(() => undefined);
    return onde;
  }, []);

  const apagarChave = useCallback(async () => {
    await esquecerChave();
    setTemChave(false);
    setModoAoVivo(false);
  }, []);

  const registrarFotoSolta = useCallback((uri: string) => {
    setFotosSoltas((atual) => [{ uri, tiradaEm: Date.now() }, ...atual]);
  }, []);
  const definirFotoBase64 = useCallback((b64: string | null) => setFotoBase64(b64), []);
  const definirClassificacao = useCallback((c: ClassificacaoAoVivo | null) => setClassificacao(c), []);
  const definirTranscricao = useCallback((t: TranscricaoAoVivo | null) => setTranscricao(t), []);
  const definirEstudo = useCallback((e: EstudoAoVivo | null) => setEstudo(e), []);
  const definirAnalisando = useCallback((v: boolean) => setAnalisando(v), []);
  const definirSequencia = useCallback(
    (quadros: number, janela: { inicio: string; fim: string } | null) => {
      setQuadros(quadros);
      setJanela(janela);
    },
    []
  );

  const alternarPlataforma = useCallback((id: string) => {
    setPlataformasConectadas((atual) =>
      atual.includes(id) ? atual.filter((p) => p !== id) : [...atual, id]
    );
    // Desconectar tambem tira do automatico: plataforma desligada nao pode
    // continuar marcada para receber sozinha.
    setPlataformasAutomaticas((atual) => atual.filter((p) => p !== id));
  }, []);

  const alternarAutomatico = useCallback((id: string) => {
    setPlataformasAutomaticas((atual) =>
      atual.includes(id) ? atual.filter((p) => p !== id) : [...atual, id]
    );
  }, []);

  /** Envio disparado pelo usuario, para as plataformas que perguntam antes. */
  const enviarAgora = useCallback((id: string) => {
    setEnviadasManualmente((atual) => (atual.includes(id) ? atual : [...atual, id]));
  }, []);

  const limparCaptura = useCallback(() => {
    setFotoUri(null);
    setDestino(caminhoSalvar);
    setTextoExtraido(conteudoIdentificado.textoExtraido);
    setEnviadasManualmente([]);
    setFotoBase64(null);
    setClassificacao(null);
    setTranscricao(null);
    setEstudo(null);
    setAnalisando(false);
    setQuadros(0);
    setJanela(null);
  }, []);

  const reiniciar = useCallback(() => {
    limparCaptura();
    setSubModo(SUBMODO_PADRAO);
    setPlataformasConectadas(CONECTADAS_PADRAO);
    setPlataformasAutomaticas(AUTOMATICAS_PADRAO);
    // modoAoVivo nao e limpo de proposito: e uma escolha do apresentador, e nao
    // parte do estado da captura. Reiniciar a demo nao deve desligar a API.
  }, [limparCaptura]);

  const valor = useMemo<FlowState>(
    () => ({
      fotoUri,
      destino,
      textoExtraido,
      subModo,
      plataformasConectadas,
      plataformasAutomaticas,
      enviadasManualmente,
      modoAoVivo,
      temChave,
      fotosSoltas,
      registrarFotoSolta,
      fotoBase64,
      classificacao,
      transcricao,
      estudo,
      analisando,
      quadrosSequencia,
      janelaSequencia,
      definirFoto,
      definirDestino,
      definirTexto,
      definirSubModo,
      alternarPlataforma,
      alternarAutomatico,
      enviarAgora,
      alternarModoAoVivo,
      salvarChave,
      apagarChave,
      definirFotoBase64,
      definirClassificacao,
      definirTranscricao,
      definirEstudo,
      definirAnalisando,
      definirSequencia,
      limparCaptura,
      reiniciar,
    }),
    [
      fotoUri,
      destino,
      textoExtraido,
      subModo,
      plataformasConectadas,
      plataformasAutomaticas,
      enviadasManualmente,
      modoAoVivo,
      temChave,
      fotosSoltas,
      registrarFotoSolta,
      fotoBase64,
      classificacao,
      transcricao,
      estudo,
      analisando,
      quadrosSequencia,
      janelaSequencia,
      definirFoto,
      definirDestino,
      definirTexto,
      definirSubModo,
      alternarPlataforma,
      alternarAutomatico,
      enviarAgora,
      alternarModoAoVivo,
      salvarChave,
      apagarChave,
      definirFotoBase64,
      definirClassificacao,
      definirTranscricao,
      definirEstudo,
      definirAnalisando,
      definirSequencia,
      limparCaptura,
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
