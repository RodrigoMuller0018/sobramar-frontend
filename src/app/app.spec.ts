import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { violacoesDeAcessibilidade } from '../testing/acessibilidade';
import { App } from './app';
import { routes } from './app.routes';
import { AutenticacaoApi } from './core/autenticacao/autenticacao-api';
import { SessaoService } from './core/autenticacao/sessao.service';
import { NotificacaoService } from './core/notificacao/notificacao.service';

const USUARIO = { email: 'a@exemplo.test', nomeConta: 'Conta', segundoFatorAtivo: false };

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(App);
    elemento = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('deve ter navegação principal, conteúdo e links legais no rodapé', () => {
    expect(elemento.querySelector('nav[aria-label="Principal"]')).not.toBeNull();
    expect(elemento.querySelector('main#conteudo')).not.toBeNull();
    const legais = Array.from(elemento.querySelectorAll('footer a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(legais).toEqual(['/privacidade', '/termos']);
  });

  it('deve levar o foco ao conteúdo pelo link "Pular para o conteúdo"', () => {
    (elemento.querySelector('a.pular') as HTMLAnchorElement).click();

    expect(document.activeElement).toBe(elemento.querySelector('main'));
  });

  it('deve exibir e fechar o aviso global', async () => {
    const notificacao = TestBed.inject(NotificacaoService);
    notificacao.erro('Falhou.');
    await fixture.whenStable();

    expect(elemento.querySelector('[role="status"]')?.textContent).toContain('Falhou.');
    expect(elemento.querySelector('.aviso--erro')).not.toBeNull();

    (elemento.querySelector('.aviso button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(notificacao.atual()).toBeNull();
    expect(elemento.querySelector('.aviso')).toBeNull();
  });

  it('deve não mostrar as ações de sessão sem login', () => {
    expect(elemento.querySelector('.topo__acoes')).toBeNull();
  });

  it('deve não ter violações de acessibilidade no shell', async () => {
    expect(await violacoesDeAcessibilidade(elemento)).toEqual([]);
  });
});

describe('App com sessão', () => {
  const api = { eu: vi.fn(), sair: vi.fn() };
  let fixture: ComponentFixture<App>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    vi.resetAllMocks();
    localStorage.clear();
    api.eu.mockReturnValue(of(USUARIO));
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), { provide: AutenticacaoApi, useValue: api }],
    });
    TestBed.inject(SessaoService).verificar().subscribe();
    fixture = TestBed.createComponent(App);
    elemento = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('deve esconder e mostrar os valores', async () => {
    const botao = elemento.querySelector('.topo__acoes button') as HTMLButtonElement;
    expect(botao.textContent).toContain('Esconder valores');

    botao.click();
    await fixture.whenStable();

    expect(botao.textContent).toContain('Mostrar valores');
    expect(botao.getAttribute('aria-pressed')).toBe('true');
    botao.click();
  });

  it.each([
    ['com sucesso', () => of(undefined)],
    ['mesmo com erro', () => throwError(() => new Error('falhou'))],
  ])('deve ir ao login ao sair %s', async (_nome, resposta) => {
    api.sair.mockReturnValue(resposta());
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    (elemento.querySelectorAll('.topo__acoes button')[1] as HTMLButtonElement).click();

    expect(navegar).toHaveBeenCalledWith('/entrar');
  });

  it('deve não ter violações de acessibilidade', async () => {
    expect(await violacoesDeAcessibilidade(elemento)).toEqual([]);
  });
});

describe('Rotas', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it.each([
    ['/privacidade', 'Política de privacidade'],
    ['/termos', 'Termos de uso'],
    ['/nao-existe', 'Página não encontrada'],
    ['/entrar', 'Entrar'],
  ])('deve abrir %s', async (url, titulo) => {
    const harness = await RouterTestingHarness.create(url);
    const pagina = harness.routeNativeElement as HTMLElement;

    expect(pagina.querySelector('h1')?.textContent).toBe(titulo);
    expect(await violacoesDeAcessibilidade(pagina)).toEqual([]);
    TestBed.inject(HttpTestingController).verify();
  });

  it('deve levar ao login quem abre a raiz sem sessão', async () => {
    const harness = RouterTestingHarness.create();
    const backend = TestBed.inject(HttpTestingController);
    const navegacao = (await harness).navigateByUrl('/');
    await new Promise((resolver) => setTimeout(resolver));
    backend
      .expectOne('/api/v1/autenticacao/eu')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await navegacao;

    expect(TestBed.inject(Router).url).toBe('/entrar');
  });
});
