import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface Usuario {
  readonly email: string;
  readonly nomeConta: string;
  readonly segundoFatorAtivo: boolean;
}

export interface RespostaEntrada {
  readonly segundoFatorObrigatorio: boolean;
}

/** Os tokens ficam em cookies HttpOnly: o front nunca lê nem guarda token. */
@Injectable({ providedIn: 'root' })
export class AutenticacaoApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/autenticacao`;

  entrar(email: string, senha: string): Observable<RespostaEntrada> {
    return this.http.post<RespostaEntrada>(`${this.url}/entrar`, { email, senha });
  }

  confirmarSegundoFator(codigo: string): Observable<void> {
    return this.http.post<void>(`${this.url}/segundo-fator`, { codigo });
  }

  renovar(): Observable<void> {
    return this.http.post<void>(`${this.url}/renovar`, null);
  }

  sair(): Observable<void> {
    return this.http.post<void>(`${this.url}/sair`, null);
  }

  eu(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}/eu`);
  }
}
