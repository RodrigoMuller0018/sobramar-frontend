import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { Observable } from 'rxjs';
import { erroInterceptor } from '../http/erro.interceptor';
import { sessaoGuard } from './sessao.guard';
import { sessaoInterceptor } from './sessao.interceptor';
import { SessaoService } from './sessao.service';

const RENOVAR = '/api/v1/autenticacao/renovar';
const USUARIO = { email: 'a@exemplo.test', nomeConta: 'Conta', segundoFatorAtivo: false };

describe('sessão', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let sessao: SessaoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'entrar', children: [] }]),
        provideHttpClient(withInterceptors([sessaoInterceptor, erroInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    sessao = TestBed.inject(SessaoService);
  });

  afterEach(() => backend.verify());

  const naoAutenticado = { status: 401, statusText: 'Unauthorized' };

  it('deve renovar uma vez e repetir a chamada quando a sessão vencer', () => {
    let resposta: unknown;
    http.get('/api/v1/projecao').subscribe((r) => (resposta = r));

    backend.expectOne('/api/v1/projecao').flush({ codigo: 'NAO_AUTENTICADO' }, naoAutenticado);
    backend.expectOne(RENOVAR).flush(null, { status: 204, statusText: 'No Content' });
    backend.expectOne('/api/v1/projecao').flush({ meses: [] });

    expect(resposta).toEqual({ meses: [] });
  });

  it('deve dividir uma única renovação entre chamadas paralelas', () => {
    http.get('/api/v1/projecao').subscribe();
    http.get('/api/v1/pessoas').subscribe();

    backend.expectOne('/api/v1/projecao').flush(null, naoAutenticado);
    backend.expectOne('/api/v1/pessoas').flush(null, naoAutenticado);
    backend.expectOne(RENOVAR).flush(null, { status: 204, statusText: 'No Content' });

    backend.expectOne('/api/v1/projecao').flush({});
    backend.expectOne('/api/v1/pessoas').flush({});
  });

  it('deve levar ao login quando a renovação falhar', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    let erro: unknown;
    http.get('/api/v1/projecao').subscribe({ error: (e) => (erro = e) });

    backend.expectOne('/api/v1/projecao').flush(null, naoAutenticado);
    backend.expectOne(RENOVAR).flush(null, naoAutenticado);

    expect(navegar).toHaveBeenCalledWith('/entrar');
    expect(erro).toMatchObject({ status: 401 });
    expect(sessao.usuario()).toBeNull();
  });

  it('deve não tentar renovar quando o login falhar', () => {
    let erro: unknown;
    http.post('/api/v1/autenticacao/entrar', {}).subscribe({ error: (e) => (erro = e) });

    backend
      .expectOne('/api/v1/autenticacao/entrar')
      .flush({ codigo: 'CREDENCIAIS_INVALIDAS' }, naoAutenticado);

    expect(erro).toMatchObject({ codigo: 'CREDENCIAIS_INVALIDAS' });
  });

  it('deve deixar passar outros erros sem renovar', () => {
    let erro: unknown;
    http.get('/api/v1/projecao').subscribe({ error: (e) => (erro = e) });

    backend.expectOne('/api/v1/projecao').flush(null, { status: 404, statusText: 'Not Found' });

    expect(erro).toMatchObject({ status: 404 });
  });

  describe('sessaoGuard', () => {
    function executar(): Observable<boolean | UrlTree> {
      return TestBed.runInInjectionContext(() =>
        sessaoGuard({} as never, {} as never),
      ) as Observable<boolean | UrlTree>;
    }

    it('deve liberar quando houver sessão, sem perguntar de novo depois', () => {
      let resultado: unknown;
      executar().subscribe((r) => (resultado = r));
      backend.expectOne('/api/v1/autenticacao/eu').flush(USUARIO);

      expect(resultado).toBe(true);
      expect(sessao.usuario()).toEqual(USUARIO);

      executar().subscribe((r) => (resultado = r));
      expect(resultado).toBe(true);
    });

    it('deve levar ao login quando não houver sessão', () => {
      let resultado: unknown;
      executar().subscribe((r) => (resultado = r));
      backend.expectOne('/api/v1/autenticacao/eu').flush(null, naoAutenticado);
      backend.expectOne(RENOVAR).flush(null, naoAutenticado);

      expect(String(resultado)).toBe('/entrar');
    });
  });

  it('deve limpar a sessão ao sair', () => {
    sessao.verificar().subscribe();
    backend.expectOne('/api/v1/autenticacao/eu').flush(USUARIO);

    sessao.sair().subscribe();
    backend
      .expectOne('/api/v1/autenticacao/sair')
      .flush(null, { status: 204, statusText: 'No Content' });

    expect(sessao.usuario()).toBeNull();
  });
});
