import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { Pagina, Tarefa } from '../tarefa.model';

/** Único ponto que conhece as URLs de tarefa. Componentes nunca usam `HttpClient` direto. */
@Injectable({ providedIn: 'root' })
export class TarefaApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/tarefas`;

  listar(pagina = 0, tamanho = 20): Observable<Pagina<Tarefa>> {
    const params = new HttpParams().set('page', pagina).set('size', tamanho);
    return this.http.get<Pagina<Tarefa>>(this.url, { params });
  }

  criar(titulo: string): Observable<Tarefa> {
    return this.http.post<Tarefa>(this.url, { titulo });
  }

  concluir(id: string): Observable<Tarefa> {
    return this.http.patch<Tarefa>(`${this.url}/${encodeURIComponent(id)}/conclusao`, null);
  }
}
