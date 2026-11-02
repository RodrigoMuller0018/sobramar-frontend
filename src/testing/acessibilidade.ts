import axe from 'axe-core';

/**
 * Roda o axe-core (mesma engine do Lighthouse) no elemento e devolve as violações WCAG encontradas.
 * `color-contrast` fica desligado porque o jsdom não calcula estilos; o contraste é garantido pelos
 * tokens em `styles.scss`. `region` só faz sentido na página inteira, não num componente isolado.
 */
export async function violacoesDeAcessibilidade(elemento: Element): Promise<string[]> {
  const resultado = await axe.run(elemento, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
    },
  });
  return resultado.violations.map((violacao) => `${violacao.id}: ${violacao.help}`);
}
