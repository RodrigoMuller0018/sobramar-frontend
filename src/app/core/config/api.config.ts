import { InjectionToken } from '@angular/core';

/**
 * Base da API. Caminho relativo de propósito: em desenvolvimento o `proxy.conf.json` encaminha
 * `/api` para o backend; em produção o front e a API ficam no mesmo domínio (reverse proxy).
 * Nada de URL de ambiente ou segredo no bundle: tudo o que vai para o navegador é público.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api/v1',
});
