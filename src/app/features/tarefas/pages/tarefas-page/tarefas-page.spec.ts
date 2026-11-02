import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { ErroApi } from '../../../../core/http/erro-api';
import { NotificacaoService } from '../../../../core/notificacao/notificacao.service';
import { TarefaApi } from '../../data/tarefa-api';
import { Pagina, Tarefa } from '../../tarefa.model';
import { TarefasPage } from './tarefas-page';

const PENDENTE: Tarefa = {
  id: 'a1',
  titulo: 'Pendente',
  concluida: false,
  criadaEm: '2026-11-02T10:00:00Z',
  concluidaEm: null,
};

function pagina(tarefas: Tarefa[]): Pagina<Tarefa> {
  return {
    content: tarefas,
    page: { size: 20, number: 0, totalElements: tarefas.length, totalPages: 1 },
  };
}

function falha(status: number, mensagem: string): Observable<never> {
  const erro: ErroApi = { status, codigo: null, mensagem };
  return throwError(() => erro);
}

describe('TarefasPage', () => {
  let fixture: ComponentFixture<TarefasPage>;
  let elemento: HTMLElement;
  let notificacao: NotificacaoService;
  const api = { listar: vi.fn(), criar: vi.fn(), concluir: vi.fn() };

  async function renderizar(): Promise<void> {
    TestBed.configureTestingModule({ providers: [{ provide: TarefaApi, useValue: api }] });
    notificacao = TestBed.inject(NotificacaoService);
    fixture = TestBed.createComponent(TarefasPage);
    elemento = fixture.nativeElement;
    await fixture.whenStable();
  }

  const titulos = () =>
    Array.from(elemento.querySelectorAll('li .lista__titulo')).map((li) => li.textContent?.trim());

  async function criarTarefa(titulo: string): Promise<void> {
    const campo = elemento.querySelector('input') as HTMLInputElement;
    campo.value = titulo;
    campo.dispatchEvent(new Event('input'));
    elemento.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  beforeEach(() => {
    vi.resetAllMocks();
    api.listar.mockReturnValue(of(pagina([PENDENTE])));
  });

  it('deve carregar e mostrar as tarefas com a contagem de pendentes', async () => {
    await renderizar();

    expect(titulos()).toEqual(['Pendente']);
    expect(elemento.querySelector('h2')?.textContent).toContain('1 pendentes');
  });

  it('deve mostrar o erro de carregamento e permitir tentar de novo', async () => {
    api.listar.mockReturnValueOnce(falha(500, 'Algo deu errado.'));
    await renderizar();

    expect(elemento.querySelector('.texto-erro')?.textContent).toContain('Algo deu errado.');

    (elemento.querySelector('section button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(api.listar).toHaveBeenCalledTimes(2);
    expect(titulos()).toEqual(['Pendente']);
  });

  it('deve criar, colocar a nova no topo, limpar o campo e avisar', async () => {
    const nova: Tarefa = { ...PENDENTE, id: 'b2', titulo: 'Nova' };
    api.criar.mockReturnValue(of(nova));
    await renderizar();

    await criarTarefa('Nova');

    expect(api.criar).toHaveBeenCalledWith('Nova');
    expect(titulos()).toEqual(['Nova', 'Pendente']);
    expect((elemento.querySelector('input') as HTMLInputElement).value).toBe('');
    expect(notificacao.atual()).toEqual({ tipo: 'sucesso', texto: 'Tarefa criada.' });
  });

  it('deve mostrar no campo o erro do servidor ao criar', async () => {
    api.criar.mockReturnValue(falha(422, 'Use no máximo 200 caracteres.'));
    await renderizar();

    await criarTarefa('Título');

    expect(elemento.querySelector('#titulo-erro')?.textContent).toContain('no máximo 200');
    expect(titulos()).toEqual(['Pendente']);
  });

  it('deve concluir e atualizar a tarefa na lista', async () => {
    api.concluir.mockReturnValue(of({ ...PENDENTE, concluida: true }));
    await renderizar();

    (elemento.querySelector('li button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(api.concluir).toHaveBeenCalledWith('a1');
    expect(elemento.querySelector('li')?.textContent).toContain('Concluída');
    expect(elemento.querySelector('h2')?.textContent).toContain('0 pendentes');
    expect(notificacao.atual()?.texto).toBe('Tarefa concluída.');
  });

  it('deve avisar quando não conseguir concluir', async () => {
    api.concluir.mockReturnValue(falha(422, 'Essa tarefa já estava concluída.'));
    await renderizar();

    (elemento.querySelector('li button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(notificacao.atual()).toEqual({
      tipo: 'erro',
      texto: 'Essa tarefa já estava concluída.',
    });
  });
});
