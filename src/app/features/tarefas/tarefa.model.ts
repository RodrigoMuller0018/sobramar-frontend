/** Espelha o `TarefaResponse` do backend. Datas chegam em ISO-8601 (UTC). */
export interface Tarefa {
  readonly id: string;
  readonly titulo: string;
  readonly concluida: boolean;
  readonly criadaEm: string;
  readonly concluidaEm: string | null;
}

/** Formato do `PagedModel` do Spring. */
export interface Pagina<T> {
  readonly content: readonly T[];
  readonly page: {
    readonly size: number;
    readonly number: number;
    readonly totalElements: number;
    readonly totalPages: number;
  };
}

/** Mesmo limite do backend (`@Size(max = 200)`). O front valida para dar feedback rápido; o back decide. */
export const TITULO_MAXIMO = 200;
