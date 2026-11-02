import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { ProjecaoApi } from './data/projecao-api';
import { LinhaDoTempoStore } from './linha-do-tempo.store';
import { MAIO } from './testing/exemplo';

describe('LinhaDoTempoStore', () => {
  const api = { projetar: vi.fn(), pessoas: vi.fn(), categorias: vi.fn() };

  function criar(): LinhaDoTempoStore {
    TestBed.configureTestingModule({
      providers: [LinhaDoTempoStore, { provide: ProjecaoApi, useValue: api }],
    });
    return TestBed.inject(LinhaDoTempoStore);
  }

  beforeEach(() => {
    vi.resetAllMocks();
    api.projetar.mockReturnValue(of({ meses: [MAIO] }));
    api.pessoas.mockReturnValue(of([{ id: 'p', nome: 'Ana' }]));
    api.categorias.mockReturnValue(of([]));
  });

  it('deve carregar a janela do mês e as opções de filtro', () => {
    const store = criar();
    store.garantirMes('2027-05');

    expect(api.projetar).toHaveBeenCalledWith('2026-11', '2028-04', {
      pessoaId: null,
      categoriaId: null,
    });
    expect(store.meses()).toEqual([MAIO]);
    expect(store.carregando()).toBe(false);
    expect(store.pessoas()).toEqual([{ id: 'p', nome: 'Ana' }]);
    expect(store.receitaDeReferencia()).toBe(500000);
  });

  it('deve buscar de novo só quando o mês sair do período carregado', () => {
    const store = criar();
    store.garantirMes('2027-05');
    store.garantirMes('2028-04');
    expect(api.projetar).toHaveBeenCalledTimes(1);

    store.garantirMes('2028-05');
    expect(api.projetar).toHaveBeenCalledTimes(2);
  });

  it('deve ignorar a resposta antiga quando um novo pedido chegar antes', () => {
    const antiga = new Subject<{ meses: never[] }>();
    api.projetar.mockReturnValueOnce(antiga);
    const store = criar();
    store.garantirMes('2027-05');
    store.garantirMes('2030-01');

    antiga.next({ meses: [] });

    expect(store.meses()).toEqual([MAIO]);
  });

  it('deve aplicar filtros buscando de novo', () => {
    const store = criar();
    store.garantirMes('2027-05');
    store.aplicarFiltros({ pessoaId: 'p', categoriaId: null });

    expect(api.projetar).toHaveBeenLastCalledWith('2026-11', '2028-04', {
      pessoaId: 'p',
      categoriaId: null,
    });
  });

  it('deve guardar o erro, seguir vivo e permitir tentar de novo', () => {
    api.projetar.mockReturnValueOnce(
      throwError(() => ({ status: 500, codigo: null, mensagem: 'Falhou.' })),
    );
    const store = criar();
    store.garantirMes('2027-05');

    expect(store.erro()).toBe('Falhou.');
    expect(store.carregando()).toBe(false);

    store.tentarDeNovo();

    expect(store.erro()).toBeNull();
    expect(store.meses()).toEqual([MAIO]);
  });

  it('deve funcionar sem as opções de filtro quando elas falharem', () => {
    api.pessoas.mockReturnValue(throwError(() => new Error('falhou')));
    const store = criar();

    expect(store.pessoas()).toEqual([]);
  });
});
