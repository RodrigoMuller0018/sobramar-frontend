import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProjecaoApi } from './projecao-api';
import { SEM_FILTROS } from './projecao.model';

describe('ProjecaoApi', () => {
  let api: ProjecaoApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProjecaoApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('deve pedir o período sem filtros vazios', () => {
    api.projetar('2027-01', '2027-12', SEM_FILTROS).subscribe();

    const chamada = backend.expectOne((r) => r.url === '/api/v1/projecao');
    const { request } = chamada;
    expect(request.params.get('de')).toBe('2027-01');
    expect(request.params.get('ate')).toBe('2027-12');
    expect(request.params.has('pessoaId')).toBe(false);
    expect(request.params.has('categoriaId')).toBe(false);
    chamada.flush({ meses: [] });
  });

  it('deve enviar os filtros escolhidos', () => {
    api.projetar('2027-01', '2027-12', { pessoaId: 'p', categoriaId: 'c' }).subscribe();

    const chamada = backend.expectOne((r) => r.url === '/api/v1/projecao');
    const { request } = chamada;
    expect(request.params.get('pessoaId')).toBe('p');
    expect(request.params.get('categoriaId')).toBe('c');
    chamada.flush({ meses: [] });
  });

  it('deve converter pessoas e categorias em opções', () => {
    let pessoas: unknown;
    let categorias: unknown;
    api.pessoas().subscribe((p) => (pessoas = p));
    api.categorias().subscribe((c) => (categorias = c));

    backend
      .expectOne((r) => r.url === '/api/v1/pessoas')
      .flush({ content: [{ id: '1', apelido: 'Ana' }] });
    backend
      .expectOne((r) => r.url === '/api/v1/categorias')
      .flush({ content: [{ id: '2', nome: 'Moradia' }] });

    expect(pessoas).toEqual([{ id: '1', nome: 'Ana' }]);
    expect(categorias).toEqual([{ id: '2', nome: 'Moradia' }]);
  });
});
