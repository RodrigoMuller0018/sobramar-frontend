import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ErroApi } from '../../../../core/http/erro-api';
import { NotificacaoService } from '../../../../core/notificacao/notificacao.service';
import { TarefaForm } from '../../components/tarefa-form/tarefa-form';
import { TarefaLista } from '../../components/tarefa-lista/tarefa-lista';
import { TarefaApi } from '../../data/tarefa-api';
import { Tarefa } from '../../tarefa.model';

/** Container: orquestra API, estado (signals) e avisos. A UI fica nos componentes de apresentação. */
@Component({
  selector: 'app-tarefas-page',
  imports: [TarefaForm, TarefaLista],
  templateUrl: './tarefas-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarefasPage {
  private readonly api = inject(TarefaApi);
  private readonly notificacao = inject(NotificacaoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formulario = viewChild.required(TarefaForm);

  protected readonly tarefas = signal<readonly Tarefa[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erroCarregamento = signal<string | null>(null);
  protected readonly salvando = signal(false);
  protected readonly erroFormulario = signal<string | null>(null);
  protected readonly pendentes = computed(() => this.tarefas().filter((t) => !t.concluida).length);

  constructor() {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erroCarregamento.set(null);
    this.api
      .listar()
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => this.tarefas.set(pagina.content),
        error: (erro: ErroApi) => this.erroCarregamento.set(erro.mensagem),
      });
  }

  protected criar(titulo: string): void {
    this.salvando.set(true);
    this.erroFormulario.set(null);
    this.api
      .criar(titulo)
      .pipe(
        finalize(() => this.salvando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (tarefa) => {
          this.tarefas.update((atuais) => [tarefa, ...atuais]);
          this.formulario().limpar();
          this.notificacao.sucesso('Tarefa criada.');
        },
        error: (erro: ErroApi) => this.erroFormulario.set(erro.mensagem),
      });
  }

  protected concluir(id: string): void {
    this.api
      .concluir(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (concluida) => {
          this.tarefas.update((atuais) => atuais.map((t) => (t.id === id ? concluida : t)));
          this.notificacao.sucesso('Tarefa concluída.');
        },
        error: (erro: ErroApi) => this.notificacao.erro(erro.mensagem),
      });
  }
}
