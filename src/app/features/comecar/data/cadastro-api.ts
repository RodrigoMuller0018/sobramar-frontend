import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { CartaoInformado, CompromissoRequest } from '../dominio/plano-do-carne';

export interface Criado {
  readonly id: string;
}

/** As rotas de cadastro do contrato (`/carteiras`, `/cartoes`, `/compromissos`). Sem conta no front. */
@Injectable({ providedIn: 'root' })
export class CadastroApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  criarCarteira(nome: string): Observable<Criado> {
    return this.http.post<Criado>(`${this.base}/carteiras`, {
      tipo: 'CONTA',
      nome,
      saldoInicialCentavos: 0,
    });
  }

  criarCartao(cartao: CartaoInformado): Observable<Criado> {
    return this.http.post<Criado>(`${this.base}/cartoes`, {
      nome: cartao.nome,
      diaFechamento: cartao.diaFechamento,
      diaVencimento: cartao.diaVencimento,
      limiteCentavos: null,
    });
  }

  criarCompromisso(compromisso: CompromissoRequest): Observable<Criado> {
    return this.http.post<Criado>(`${this.base}/compromissos`, compromisso);
  }
}
