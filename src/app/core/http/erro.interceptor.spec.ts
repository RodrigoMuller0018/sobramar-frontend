import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NotificacaoService } from '../notificacao/notificacao.service';
import { ErroApi } from './erro-api';
import { erroInterceptor } from './erro.interceptor';

describe('erroInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let notificacao: NotificacaoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    notificacao = TestBed.inject(NotificacaoService);
  });

  afterEach(() => backend.verify());

  function requisitarERetornar(status: number, corpo: object | null): ErroApi | undefined {
    let recebido: ErroApi | undefined;
    http.get('/api/teste').subscribe({ error: (erro: ErroApi) => (recebido = erro) });
    backend.expectOne('/api/teste').flush(corpo, { status, statusText: 'Erro' });
    return recebido;
  }

  it('deve converter o erro em ErroApi e avisar globalmente quando for 5xx', () => {
    const erro = requisitarERetornar(500, null);

    expect(erro?.status).toBe(500);
    expect(notificacao.atual()).toEqual({ tipo: 'erro', texto: erro?.mensagem });
  });

  it('deve deixar o 4xx para quem chamou, sem aviso global', () => {
    const erro = requisitarERetornar(422, { codigo: 'VALOR_INVALIDO' });

    expect(erro?.codigo).toBe('VALOR_INVALIDO');
    expect(notificacao.atual()).toBeNull();
  });

  it('deve avisar globalmente quando não houver conexão', () => {
    let recebido: ErroApi | undefined;
    http.get('/api/teste').subscribe({ error: (erro: ErroApi) => (recebido = erro) });
    backend.expectOne('/api/teste').error(new ProgressEvent('error'), { status: 0 });

    expect(recebido?.status).toBe(0);
    expect(notificacao.atual()?.tipo).toBe('erro');
  });
});
