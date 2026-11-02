import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { violacoesDeAcessibilidade } from '../testing/acessibilidade';
import { App } from './app';
import { routes } from './app.routes';
import { NotificacaoService } from './core/notificacao/notificacao.service';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let elemento: HTMLElement;

  beforeEach(async () => {
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

  it('deve não ter violações de acessibilidade no shell', async () => {
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
  ])('deve abrir %s', async (url, titulo) => {
    const harness = await RouterTestingHarness.create(url);
    const pagina = harness.routeNativeElement as HTMLElement;

    expect(pagina.querySelector('h1')?.textContent).toBe(titulo);
    expect(await violacoesDeAcessibilidade(pagina)).toEqual([]);
  });

  it('deve redirecionar a raiz para tarefas', async () => {
    const harness = await RouterTestingHarness.create('/');

    expect((harness.routeNativeElement as HTMLElement).querySelector('h1')?.textContent).toBe(
      'Tarefas',
    );
  });
});
