import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TITULO_MAXIMO } from '../../tarefa.model';

/** Mesmas regras do domínio no backend (TITULO_OBRIGATORIO, TITULO_MUITO_LONGO). */
export function validarTitulo(titulo: string): string | null {
  const limpo = titulo.trim();
  if (!limpo) {
    return 'Informe o título da tarefa.';
  }
  if (limpo.length > TITULO_MAXIMO) {
    return `Use no máximo ${TITULO_MAXIMO} caracteres.`;
  }
  return null;
}

/** Apresentação: não conhece API nem serviço. Recebe estado por input e avisa por output. */
@Component({
  selector: 'app-tarefa-form',
  imports: [ReactiveFormsModule],
  templateUrl: './tarefa-form.html',
  styleUrl: './tarefa-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarefaForm {
  readonly enviando = input(false);
  /** Erro vindo do servidor (ex.: regra de negócio), exibido no próprio campo. */
  readonly erro = input<string | null>(null);
  readonly criar = output<string>();

  protected readonly maximo = TITULO_MAXIMO;
  protected readonly form = new FormGroup({
    titulo: new FormControl('', { nonNullable: true }),
  });

  private readonly valor = toSignal(this.form.controls.titulo.valueChanges, { initialValue: '' });
  private readonly tentouEnviar = signal(false);
  private readonly erroLocal = computed(() =>
    this.tentouEnviar() ? validarTitulo(this.valor()) : null,
  );

  protected readonly mensagemErro = computed(() => this.erroLocal() ?? this.erro());
  protected readonly descritoPor = computed(() =>
    this.mensagemErro() ? 'titulo-ajuda titulo-erro' : 'titulo-ajuda',
  );

  protected enviar(): void {
    this.tentouEnviar.set(true);
    if (validarTitulo(this.valor())) {
      return;
    }
    this.criar.emit(this.valor().trim());
  }

  /** Chamado pelo container depois que o servidor confirmou a criação. */
  limpar(): void {
    this.form.reset();
    this.tentouEnviar.set(false);
  }
}
