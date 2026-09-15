import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { Acervo, Aula, Pagina, Sessao } from '../data/acervo';
import {
  acervoInicial,
  acervoValido,
  aulaDaSessao,
  caminhosExistentes,
  dataBR,
  horaBR,
  iconeDaMateria,
  idNovo,
  mesmaPasta,
  sessaoDeAgora,
  tituloDaCaptura,
} from '../data/acervo';
import type { Flashcard, Questao } from '../data/mock';

/**
 * O acervo do estudante, gravado no aparelho.
 *
 * Persistencia com AsyncStorage e a foto copiada para o diretorio de documentos,
 * porque o arquivo que a camera devolve fica no cache e pode sumir. O estado
 * vive num ref alem do useState para as acoes poderem ler o valor mais recente
 * de forma sincrona: salvar uma captura precisa saber, na hora, se ja existe
 * uma aula da mesma sessao para virar pagina dela.
 */

const CHAVE_STORAGE = 'jovi-flow.acervo.v1';
const PASTA_FOTOS = 'aulas/';

type Persistido = { versao: 1; acervo: Acervo };

export type NovaCaptura = {
  fotoUri: string | null;
  subModo: string;
  materia: string;
  tema: string;
  topico: string;
  pasta: [string, string];
  textoExtraido: string;
  resumo: string[];
  flashcards: Flashcard[];
  questoes: Questao[];
  aoVivo: boolean;
};

export type ResultadoSalvar = {
  aula: Aula;
  /** true quando a captura virou pagina de uma aula que ja existia. */
  paginaNova: boolean;
  numeroPagina: number;
};

export type PreviaSessao = {
  aula: Aula;
  numeroPagina: number;
  sessao: Sessao;
};

export type AcervoState = {
  acervo: Acervo;
  /** false ate o armazenamento responder. As telas mostram o exemplo enquanto isso. */
  carregado: boolean;
  /** A aula salva ou atualizada por ultimo. E para onde as telas de acao apontam. */
  ultimaAulaId: string | null;
  caminhos: string[];
  aulaPorId: (id: string) => Aula | null;
  previaSessao: (pasta: [string, string]) => PreviaSessao | null;
  salvarCaptura: (entrada: NovaCaptura) => Promise<ResultadoSalvar>;
  criarPasta: (materia: string, nome: string) => boolean;
  renomearPasta: (materia: string, nome: string, novoNome: string) => boolean;
  excluirPasta: (materia: string, nome: string) => void;
  renomearAula: (id: string, titulo: string) => void;
  moverAula: (id: string, pasta: [string, string]) => void;
  excluirAula: (id: string) => void;
  marcarResumoSalvo: (id: string) => void;
  atualizarTextoDaAula: (id: string, texto: string) => void;
  /** Apaga as capturas e volta aos cinco exemplos. */
  restaurarExemplos: () => void;
};

const AcervoContext = createContext<AcervoState | null>(null);

function limpar(t: string): string {
  return t.replace(/\s+/g, ' ').trim();
}

/** Copia a foto do cache da camera para um lugar permanente. Se falhar, segue
 *  com o caminho original: melhor uma foto que talvez suma do que nenhuma. */
async function copiarFoto(uri: string | null): Promise<string | null> {
  if (uri === null) return null;
  const base = FileSystem.documentDirectory;
  if (base === null) return uri;
  try {
    const pasta = `${base}${PASTA_FOTOS}`;
    await FileSystem.makeDirectoryAsync(pasta, { intermediates: true }).catch(() => undefined);
    const destino = `${pasta}${idNovo('foto')}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: destino });
    return destino;
  } catch (erro) {
    console.log('[JOVI Flow] nao deu para copiar a foto, usando o cache:', erro);
    return uri;
  }
}

/** Junta listas sem repetir o que ja estava. Usado quando a segunda pagina de
 *  uma aula traz o proprio resumo e os proprios cartoes. */
function unir<T>(atual: T[], novos: T[], chave: (t: T) => string): T[] {
  const vistos = new Set(atual.map(chave));
  return [...atual, ...novos.filter((n) => !vistos.has(chave(n)))];
}

export function AcervoProvider({ children }: { children: ReactNode }) {
  const [acervo, setAcervoState] = useState<Acervo>(acervoInicial);
  const [carregado, setCarregado] = useState(false);
  const [ultimaAulaId, setUltimaAulaId] = useState<string | null>(null);
  const acervoRef = useRef<Acervo>(acervo);

  const atualizar = useCallback((fn: (a: Acervo) => Acervo) => {
    const novo = fn(acervoRef.current);
    acervoRef.current = novo;
    setAcervoState(novo);
  }, []);

  // Carrega uma vez. Sem nada gravado, ou com formato estranho, fica o exemplo.
  useEffect(() => {
    let vivo = true;
    AsyncStorage.getItem(CHAVE_STORAGE)
      .then((bruto) => {
        if (!vivo || bruto === null) return;
        const p = JSON.parse(bruto) as Partial<Persistido>;
        if (p.versao === 1 && acervoValido(p.acervo)) {
          acervoRef.current = p.acervo;
          setAcervoState(p.acervo);
        }
      })
      .catch((erro) => console.log('[JOVI Flow] acervo nao carregou, usando o exemplo:', erro))
      .finally(() => {
        if (vivo) setCarregado(true);
      });
    return () => {
      vivo = false;
    };
  }, []);

  // Grava a cada mudanca, mas so depois de carregar: gravar antes disso
  // sobrescreveria o que esta no aparelho com o exemplo.
  useEffect(() => {
    if (!carregado) return;
    const dados: Persistido = { versao: 1, acervo };
    AsyncStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados)).catch((erro) =>
      console.log('[JOVI Flow] acervo nao gravou:', erro)
    );
  }, [acervo, carregado]);

  const aulaPorId = useCallback(
    (id: string) => acervo.aulas.find((a) => a.id === id) ?? null,
    [acervo]
  );

  const previaSessao = useCallback((pasta: [string, string]): PreviaSessao | null => {
    const agora = new Date();
    const sessao = sessaoDeAgora(pasta, agora);
    const aula = aulaDaSessao(acervoRef.current, sessao, pasta, agora);
    return aula ? { aula, numeroPagina: aula.paginas.length + 1, sessao } : null;
  }, []);

  const garantirPasta = useCallback(
    (a: Acervo, pasta: [string, string]): Acervo => {
      const existe = a.pastas.some((p) => p.materia === pasta[0] && p.nome === pasta[1]);
      if (existe) return a;
      return {
        ...a,
        pastas: [...a.pastas, { materia: pasta[0], nome: pasta[1], icone: iconeDaMateria(pasta[0]) }],
      };
    },
    []
  );

  const salvarCaptura = useCallback(
    async (entrada: NovaCaptura): Promise<ResultadoSalvar> => {
      const fotoUri = await copiarFoto(entrada.fotoUri);
      const agora = new Date();
      const sessao = sessaoDeAgora(entrada.pasta, agora);
      const existente = aulaDaSessao(acervoRef.current, sessao, entrada.pasta, agora);

      const pagina: Pagina = {
        id: idNovo('pag'),
        fotoUri,
        hora: horaBR(agora),
        subModo: entrada.subModo,
        textoExtraido: entrada.textoExtraido,
      };

      if (existente) {
        const atualizada: Aula = {
          ...existente,
          paginas: [...existente.paginas, pagina],
          resumo: unir(existente.resumo, entrada.resumo, (r) => r),
          flashcards: unir(existente.flashcards, entrada.flashcards, (f) => f.p),
          questoes: unir(existente.questoes, entrada.questoes, (q) => q.q),
          aoVivo: existente.aoVivo || entrada.aoVivo,
          atualizadaEm: agora.getTime(),
        };
        atualizar((a) => ({
          ...a,
          aulas: a.aulas.map((x) => (x.id === atualizada.id ? atualizada : x)),
        }));
        setUltimaAulaId(atualizada.id);
        return { aula: atualizada, paginaNova: true, numeroPagina: atualizada.paginas.length };
      }

      const nova: Aula = {
        id: idNovo('aula'),
        titulo: `${tituloDaCaptura(entrada.topico)} · Aula ${dataBR(agora).slice(0, 5)}`,
        materia: entrada.materia,
        tema: entrada.tema,
        topico: entrada.topico,
        pasta: entrada.pasta,
        data: dataBR(agora),
        hora: horaBR(agora),
        criadaEm: agora.getTime(),
        atualizadaEm: agora.getTime(),
        sessao,
        paginas: [pagina],
        resumo: entrada.resumo,
        flashcards: entrada.flashcards,
        questoes: entrada.questoes,
        aoVivo: entrada.aoVivo,
        resumoSalvo: false,
      };
      atualizar((a) => {
        const comPasta = garantirPasta(a, entrada.pasta);
        return { ...comPasta, aulas: [nova, ...comPasta.aulas] };
      });
      setUltimaAulaId(nova.id);
      return { aula: nova, paginaNova: false, numeroPagina: 1 };
    },
    [atualizar, garantirPasta]
  );

  const criarPasta = useCallback(
    (materia: string, nome: string): boolean => {
      const m = limpar(materia);
      const n = limpar(nome);
      if (m === '' || n === '') return false;
      const existe = acervoRef.current.pastas.some((p) => p.materia === m && p.nome === n);
      if (existe) return false;
      atualizar((a) => garantirPasta(a, [m, n]));
      return true;
    },
    [atualizar, garantirPasta]
  );

  const renomearPasta = useCallback(
    (materia: string, nome: string, novoNome: string): boolean => {
      const n = limpar(novoNome);
      if (n === '' || n === nome) return false;
      const conflito = acervoRef.current.pastas.some((p) => p.materia === materia && p.nome === n);
      if (conflito) return false;
      atualizar((a) => ({
        pastas: a.pastas.map((p) => (p.materia === materia && p.nome === nome ? { ...p, nome: n } : p)),
        aulas: a.aulas.map((x) =>
          mesmaPasta(x.pasta, [materia, nome]) ? { ...x, pasta: [materia, n] } : x
        ),
      }));
      return true;
    },
    [atualizar]
  );

  const excluirPasta = useCallback(
    (materia: string, nome: string) => {
      atualizar((a) => ({
        pastas: a.pastas.filter((p) => !(p.materia === materia && p.nome === nome)),
        aulas: a.aulas.filter((x) => !mesmaPasta(x.pasta, [materia, nome])),
      }));
    },
    [atualizar]
  );

  const renomearAula = useCallback(
    (id: string, titulo: string) => {
      const t = limpar(titulo);
      if (t === '') return;
      atualizar((a) => ({
        ...a,
        aulas: a.aulas.map((x) => (x.id === id ? { ...x, titulo: t } : x)),
      }));
    },
    [atualizar]
  );

  const moverAula = useCallback(
    (id: string, pasta: [string, string]) => {
      atualizar((a) => {
        const comPasta = garantirPasta(a, pasta);
        return {
          ...comPasta,
          aulas: comPasta.aulas.map((x) =>
            x.id === id ? { ...x, pasta, atualizadaEm: Date.now() } : x
          ),
        };
      });
    },
    [atualizar, garantirPasta]
  );

  const excluirAula = useCallback(
    (id: string) => {
      atualizar((a) => ({ ...a, aulas: a.aulas.filter((x) => x.id !== id) }));
      setUltimaAulaId((atual) => (atual === id ? null : atual));
    },
    [atualizar]
  );

  const marcarResumoSalvo = useCallback(
    (id: string) => {
      atualizar((a) => ({
        ...a,
        aulas: a.aulas.map((x) => (x.id === id ? { ...x, resumoSalvo: true } : x)),
      }));
    },
    [atualizar]
  );

  /** Edicao do texto extraido. Vai para a ultima pagina, que e a que acabou de
   *  ser capturada. */
  const atualizarTextoDaAula = useCallback(
    (id: string, texto: string) => {
      atualizar((a) => ({
        ...a,
        aulas: a.aulas.map((x) => {
          if (x.id !== id || x.paginas.length === 0) return x;
          const ultima = x.paginas.length - 1;
          return {
            ...x,
            paginas: x.paginas.map((p, i) => (i === ultima ? { ...p, textoExtraido: texto } : p)),
          };
        }),
      }));
    },
    [atualizar]
  );

  const restaurarExemplos = useCallback(() => {
    atualizar(() => acervoInicial());
    setUltimaAulaId(null);
  }, [atualizar]);

  const caminhos = useMemo(() => caminhosExistentes(acervo), [acervo]);

  const valor = useMemo<AcervoState>(
    () => ({
      acervo,
      carregado,
      ultimaAulaId,
      caminhos,
      aulaPorId,
      previaSessao,
      salvarCaptura,
      criarPasta,
      renomearPasta,
      excluirPasta,
      renomearAula,
      moverAula,
      excluirAula,
      marcarResumoSalvo,
      atualizarTextoDaAula,
      restaurarExemplos,
    }),
    [
      acervo,
      carregado,
      ultimaAulaId,
      caminhos,
      aulaPorId,
      previaSessao,
      salvarCaptura,
      criarPasta,
      renomearPasta,
      excluirPasta,
      renomearAula,
      moverAula,
      excluirAula,
      marcarResumoSalvo,
      atualizarTextoDaAula,
      restaurarExemplos,
    ]
  );

  return <AcervoContext.Provider value={valor}>{children}</AcervoContext.Provider>;
}

export function useAcervo(): AcervoState {
  const ctx = useContext(AcervoContext);
  if (ctx === null) {
    throw new Error('useAcervo precisa estar dentro de <AcervoProvider>.');
  }
  return ctx;
}
