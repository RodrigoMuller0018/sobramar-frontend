import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { AutenticacaoApi, Usuario } from './autenticacao-api';

@Injectable({ providedIn: 'root' })
export class SessaoService {
  private readonly api = inject(AutenticacaoApi);
  private readonly estado = signal<Usuario | null>(null);
  private renovacao: Observable<void> | null = null;

  readonly usuario = this.estado.asReadonly();

  /** Responde se há sessão, perguntando ao servidor quando ainda não se sabe. */
  verificar(): Observable<boolean> {
    if (this.estado()) {
      return of(true);
    }
    return this.api.eu().pipe(
      tap((usuario) => this.estado.set(usuario)),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  /**
   * Chamadas paralelas dividem a mesma renovação. O refresh token é rotativo, e reapresentar um
   * token já usado encerra todas as sessões.
   */
  renovar(): Observable<void> {
    this.renovacao ??= this.api.renovar().pipe(
      finalize(() => (this.renovacao = null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.renovacao;
  }

  sair(): Observable<void> {
    return this.api.sair().pipe(finalize(() => this.limpar()));
  }

  limpar(): void {
    this.estado.set(null);
  }
}
