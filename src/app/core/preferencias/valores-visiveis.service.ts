import { Injectable, signal } from '@angular/core';

const CHAVE = 'sobramar.valores-ocultos';

/** Esconder os valores é só uma preferência deste navegador, sem rota na API. */
@Injectable({ providedIn: 'root' })
export class ValoresVisiveisService {
  private readonly estado = signal(lerPreferencia());
  readonly ocultos = this.estado.asReadonly();

  alternar(): void {
    const novo = !this.estado();
    this.estado.set(novo);
    try {
      localStorage.setItem(CHAVE, String(novo));
    } catch {
      // Navegador sem armazenamento: a preferência vale só nesta visita.
    }
  }
}

function lerPreferencia(): boolean {
  try {
    return localStorage.getItem(CHAVE) === 'true';
  } catch {
    return false;
  }
}
