/**
 * Tipos de rota do app.
 *
 * Ficam em arquivo proprio, e nao dentro do RootStack, para as telas poderem
 * importar o tipo sem criar dependencia circular com o navegador.
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  /** Aceita parametro para permitir pular direto para uma aba especifica. */
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
  /** Rota inicial. O JOVI Flow vive dentro da camera do aparelho, entao o
   *  aplicativo abre no visor, e nao numa tela de menu. */
  Camera: undefined;
  /** Viabilidade tecnica: quais APIs abertas do Google sustentam cada
   *  diferencial. E um dos entregaveis pedidos no brief da JOVI. */
  Feasibility: undefined;
  /** Plataformas que recebem o conteudo capturado. */
  Platforms: undefined;
  Processing: undefined;
  Identified: undefined;
  Organize: undefined;
  /** Chega depois de salvar: a aula ja existe no acervo. */
  Actions: { aulaId: string; paginaNova: boolean; numeroPagina: number };
  Summary: { aulaId: string };
  Questions: { aulaId: string };
  /** Uma aula do acervo, com as paginas, o resumo e as acoes de estudo. */
  Aula: { aulaId: string };
};

export type MainTabParamList = {
  Inicio: undefined;
  /** `abrir` deixa a pasta pedida ja expandida ao chegar. */
  Estudos: { abrir?: [string, string] } | undefined;
  /** Aba fantasma: nao renderiza tela, so hospeda o botao central de captura. */
  Capturar: undefined;
  /** Sem aulaId revisa a aula mais recente. */
  Revisao: { aulaId?: string } | undefined;
  Perfil: undefined;
};

// Torna useNavigation() tipado em todo o app, sem precisar anotar caso a caso.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
