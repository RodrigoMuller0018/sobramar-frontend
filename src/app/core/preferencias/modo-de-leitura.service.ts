import { Injectable, signal } from '@angular/core';

export type ModoDeLeitura = 'lista' | 'cena';

const CHAVE = 'sobramar.modo-de-leitura';

/**
 * Como a pessoa prefere ler o mês: a lista simples (tabela, o padrão acessível) ou a cena. A escolha é feita na
 * primeira tela, fica só neste navegador e nunca sai do menu. Sem escolha, vale a lista.
 */
@Injectable({ providedIn: 'root' })
export class ModoDeLeituraService {
  private readonly estado = signal<ModoDeLeitura | null>(lerPreferencia());

  /** Nulo enquanto a pessoa não escolheu. */
  readonly escolhido = this.estado.asReadonly();

  modo(): ModoDeLeitura {
    return this.estado() ?? 'lista';
  }

  escolher(modo: ModoDeLeitura): void {
    this.estado.set(modo);
    try {
      localStorage.setItem(CHAVE, modo);
    } catch {
      // Navegador sem armazenamento: a escolha vale só nesta visita.
    }
  }

  alternar(): void {
    this.escolher(this.modo() === 'lista' ? 'cena' : 'lista');
  }
}

function lerPreferencia(): ModoDeLeitura | null {
  try {
    const valor = localStorage.getItem(CHAVE);
    return valor === 'lista' || valor === 'cena' ? valor : null;
  } catch {
    return null;
  }
}
