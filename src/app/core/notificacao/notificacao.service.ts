import { Injectable, signal } from '@angular/core';

export interface Notificacao {
  readonly tipo: 'sucesso' | 'erro';
  readonly texto: string;
}

/** Aviso global exibido pelo shell numa região `aria-live`, para leitores de tela anunciarem. */
@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private readonly estado = signal<Notificacao | null>(null);
  readonly atual = this.estado.asReadonly();

  sucesso(texto: string): void {
    this.estado.set({ tipo: 'sucesso', texto });
  }

  erro(texto: string): void {
    this.estado.set({ tipo: 'erro', texto });
  }

  limpar(): void {
    this.estado.set(null);
  }
}
