import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Tarefa } from '../tarefa.model';
import { TarefaApi } from './tarefa-api';

const TAREFA: Tarefa = {
  id: '7b1d6c1e-0000-4000-8000-000000000001',
  titulo: 'Estudar signals',
  concluida: false,
  criadaEm: '2026-11-02T10:00:00Z',
  concluidaEm: null,
};

describe('TarefaApi', () => {
  let api: TarefaApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(TarefaApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('deve listar paginado, com 20 itens por padrão', () => {
    api.listar().subscribe();

    const requisicao = backend.expectOne((r) => r.url === '/api/v1/tarefas');
    expect(requisicao.request.method).toBe('GET');
    expect(requisicao.request.params.get('page')).toBe('0');
    expect(requisicao.request.params.get('size')).toBe('20');
    requisicao.flush({
      content: [],
      page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
    });
  });

  it('deve criar enviando só o título', () => {
    let criada: Tarefa | undefined;
    api.criar('Estudar signals').subscribe((t) => (criada = t));

    const requisicao = backend.expectOne('/api/v1/tarefas');
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({ titulo: 'Estudar signals' });
    requisicao.flush(TAREFA);

    expect(criada).toEqual(TAREFA);
  });

  it('deve concluir pelo endpoint de conclusão', () => {
    api.concluir(TAREFA.id).subscribe();

    const requisicao = backend.expectOne(`/api/v1/tarefas/${TAREFA.id}/conclusao`);
    expect(requisicao.request.method).toBe('PATCH');
    requisicao.flush({ ...TAREFA, concluida: true });
  });
});
