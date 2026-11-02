import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { Filtros, OpcaoDeFiltro, Projecao } from './projecao.model';

const MAXIMO_POR_PAGINA = 100;

interface Pagina<T> {
  readonly content: readonly T[];
}

/** A regra de cálculo fica só no backend: esta classe nunca faz conta. */
@Injectable({ providedIn: 'root' })
export class ProjecaoApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  projetar(de: string, ate: string, filtros: Filtros): Observable<Projecao> {
    let params = new HttpParams().set('de', de).set('ate', ate);
    if (filtros.pessoaId) {
      params = params.set('pessoaId', filtros.pessoaId);
    }
    if (filtros.categoriaId) {
      params = params.set('categoriaId', filtros.categoriaId);
    }
    return this.http.get<Projecao>(`${this.base}/projecao`, { params });
  }

  pessoas(): Observable<readonly OpcaoDeFiltro[]> {
    return this.listar<{ id: string; apelido: string }>('pessoas').pipe(
      map((lista) => lista.map(({ id, apelido }) => ({ id, nome: apelido }))),
    );
  }

  categorias(): Observable<readonly OpcaoDeFiltro[]> {
    return this.listar<{ id: string; nome: string }>('categorias').pipe(
      map((lista) => lista.map(({ id, nome }) => ({ id, nome }))),
    );
  }

  private listar<T>(recurso: string): Observable<readonly T[]> {
    const params = new HttpParams().set('size', MAXIMO_POR_PAGINA);
    return this.http
      .get<Pagina<T>>(`${this.base}/${recurso}`, { params })
      .pipe(map((pagina) => pagina.content));
  }
}
