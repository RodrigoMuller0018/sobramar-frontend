import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, finalize, forkJoin, of, switchMap, tap } from 'rxjs';
import { ErroApi } from '../../core/http/erro-api';
import { ProjecaoApi } from './data/projecao-api';
import { Filtros, MesProjetado, OpcaoDeFiltro, SEM_FILTROS } from './data/projecao.model';
import { janelaPara } from './dominio/competencia';
import { maiorReceita } from './dominio/ilha-do-mes';

/** Estado da linha do tempo, compartilhado entre o mês e o ano. */
@Injectable()
export class LinhaDoTempoStore {
  private readonly api = inject(ProjecaoApi);
  private readonly pedidos = new Subject<{ de: string; ate: string; filtros: Filtros }>();
  private janela: { de: string; ate: string } | null = null;

  readonly meses = signal<readonly MesProjetado[]>([]);
  readonly atualizadoEm = signal<string | null>(null);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly filtros = signal<Filtros>(SEM_FILTROS);
  readonly pessoas = signal<readonly OpcaoDeFiltro[]>([]);
  readonly categorias = signal<readonly OpcaoDeFiltro[]>([]);
  readonly receitaDeReferencia = computed(() => maiorReceita(this.meses()));

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.pedidos
      .pipe(
        tap(() => {
          this.carregando.set(true);
          this.erro.set(null);
        }),
        switchMap(({ de, ate, filtros }) =>
          this.api.projetar(de, ate, filtros).pipe(
            tap(({ meses, atualizadoEm }) => {
              this.meses.set(meses);
              this.atualizadoEm.set(atualizadoEm ?? null);
            }),
            catchError((erro: ErroApi) => {
              this.erro.set(erro.mensagem);
              return of(null);
            }),
            finalize(() => this.carregando.set(false)),
          ),
        ),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe();
    forkJoin({
      pessoas: this.api.pessoas().pipe(catchError(() => of([]))),
      categorias: this.api.categorias().pipe(catchError(() => of([]))),
    })
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(({ pessoas, categorias }) => {
        this.pessoas.set(pessoas);
        this.categorias.set(categorias);
      });
  }

  /** Só busca de novo se o mês estiver fora do período já carregado. */
  garantirMes(competencia: string): void {
    const janela = this.janela;
    if (janela && competencia >= janela.de && competencia <= janela.ate) {
      return;
    }
    this.janela = janelaPara(competencia);
    this.buscar();
  }

  aplicarFiltros(filtros: Filtros): void {
    this.filtros.set(filtros);
    this.buscar();
  }

  tentarDeNovo(): void {
    this.buscar();
  }

  private buscar(): void {
    if (this.janela) {
      this.pedidos.next({ ...this.janela, filtros: this.filtros() });
    }
  }
}
