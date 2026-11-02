import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Tarefa } from '../../tarefa.model';

@Component({
  selector: 'app-tarefa-lista',
  templateUrl: './tarefa-lista.html',
  styleUrl: './tarefa-lista.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarefaLista {
  readonly tarefas = input.required<readonly Tarefa[]>();
  readonly concluir = output<string>();
}
