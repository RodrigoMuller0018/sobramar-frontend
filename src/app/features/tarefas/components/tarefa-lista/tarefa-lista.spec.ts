import { ComponentFixture, TestBed } from '@angular/core/testing';
import { violacoesDeAcessibilidade } from '../../../../../testing/acessibilidade';
import { Tarefa } from '../../tarefa.model';
import { TarefaLista } from './tarefa-lista';

function tarefa(parcial: Partial<Tarefa>): Tarefa {
  return {
    id: crypto.randomUUID(),
    titulo: 'Qualquer',
    concluida: false,
    criadaEm: '2026-11-02T10:00:00Z',
    concluidaEm: null,
    ...parcial,
  };
}

describe('TarefaLista', () => {
  let fixture: ComponentFixture<TarefaLista>;
  let elemento: HTMLElement;

  async function renderizar(tarefas: Tarefa[]): Promise<void> {
    fixture = TestBed.createComponent(TarefaLista);
    elemento = fixture.nativeElement;
    fixture.componentRef.setInput('tarefas', tarefas);
    await fixture.whenStable();
  }

  it('deve avisar quando não houver tarefas', async () => {
    await renderizar([]);

    expect(elemento.querySelector('ul')).toBeNull();
    expect(elemento.textContent).toContain('Nenhuma tarefa');
  });

  it('deve oferecer "Concluir" só para as pendentes', async () => {
    await renderizar([
      tarefa({ titulo: 'Pendente' }),
      tarefa({ titulo: 'Feita', concluida: true }),
    ]);

    const botoes = elemento.querySelectorAll('button');
    expect(botoes).toHaveLength(1);
    expect(botoes[0].getAttribute('aria-label')).toBe('Concluir: Pendente');
    expect(elemento.textContent).toContain('Concluída');
  });

  it('deve emitir o id ao concluir', async () => {
    const pendente = tarefa({ titulo: 'Pendente' });
    await renderizar([pendente]);
    const emitidos: string[] = [];
    fixture.componentInstance.concluir.subscribe((id) => emitidos.push(id));

    elemento.querySelector('button')?.click();

    expect(emitidos).toEqual([pendente.id]);
  });

  it('deve não ter violações de acessibilidade', async () => {
    await renderizar([tarefa({}), tarefa({ concluida: true })]);

    expect(await violacoesDeAcessibilidade(elemento)).toEqual([]);
  });
});
