import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Diz se o usuario pediu menos animacao nas preferencias do sistema.
 *
 * Quem consome deve ir direto ao estado final em vez de animar, e nunca deixar
 * uma animacao em loop rodando. Requisito de acessibilidade do projeto.
 */
export function useReduzirMovimento(): boolean {
  const [reduzir, setReduzir] = useState(false);

  useEffect(() => {
    let vivo = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((ligado) => {
        if (vivo) setReduzir(ligado);
      })
      .catch(() => {
        // Sem suporte na plataforma: mantem a animacao padrao.
      });

    const inscricao = AccessibilityInfo.addEventListener('reduceMotionChanged', (ligado) => {
      if (vivo) setReduzir(ligado);
    });

    return () => {
      vivo = false;
      inscricao.remove();
    };
  }, []);

  return reduzir;
}
