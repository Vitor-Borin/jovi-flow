/**
 * Tipos de rota do app.
 *
 * Ficam em arquivo proprio, e nao dentro do RootStack, para as telas poderem
 * importar o tipo sem criar dependencia circular com o navegador.
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  /** Aceita parametro para permitir pular direto para uma aba especifica,
   *  como a tela de Acoes faz ao mandar o usuario para Revisao ou Estudos. */
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
  /** Rota inicial. O JOVI Flow vive dentro da camera do aparelho, entao o
   *  aplicativo abre no visor, e nao numa tela de menu. */
  Camera: undefined;
  /** Viabilidade tecnica: quais APIs abertas do Google sustentam cada
   *  diferencial. E um dos entregaveis pedidos no brief da JOVI. */
  Feasibility: undefined;
  Processing: undefined;
  Identified: undefined;
  Organize: undefined;
  Actions: undefined;
  Summary: undefined;
  Questions: undefined;
};

export type MainTabParamList = {
  Inicio: undefined;
  Estudos: undefined;
  /** Aba fantasma: nao renderiza tela, so hospeda o botao central de captura. */
  Capturar: undefined;
  Revisao: undefined;
  Perfil: undefined;
};

// Torna useNavigation() tipado em todo o app, sem precisar anotar caso a caso.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
