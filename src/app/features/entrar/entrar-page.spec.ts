import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { violacoesDeAcessibilidade } from '../../../testing/acessibilidade';
import { AutenticacaoApi } from '../../core/autenticacao/autenticacao-api';
import { SessaoService } from '../../core/autenticacao/sessao.service';
import { EntrarPage } from './entrar-page';

describe('EntrarPage', () => {
  let fixture: ComponentFixture<EntrarPage>;
  let elemento: HTMLElement;
  let navegar: ReturnType<typeof vi.fn>;
  const api = { entrar: vi.fn(), confirmarSegundoFator: vi.fn() };
  const sessao = { verificar: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    sessao.verificar.mockReturnValue(of(true));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AutenticacaoApi, useValue: api },
        { provide: SessaoService, useValue: sessao },
      ],
    });
    navegar = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true) as unknown as ReturnType<typeof vi.fn>;
    fixture = TestBed.createComponent(EntrarPage);
    elemento = fixture.nativeElement;
    await fixture.whenStable();
  });

  function digitar(seletor: string, valor: string): void {
    const campo = elemento.querySelector(seletor) as HTMLInputElement;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  async function enviar(): Promise<void> {
    elemento.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('deve abrir a sessão direto quando o segundo fator não estiver ativo', async () => {
    api.entrar.mockReturnValue(of({ segundoFatorObrigatorio: false }));
    digitar('#email', 'a@exemplo.test');
    digitar('#senha', 'teste');
    await enviar();

    expect(api.entrar).toHaveBeenCalledWith('a@exemplo.test', 'teste');
    expect(navegar).toHaveBeenCalledWith('/');
  });

  it('deve pedir o código quando o segundo fator estiver ativo', async () => {
    api.entrar.mockReturnValue(of({ segundoFatorObrigatorio: true }));
    api.confirmarSegundoFator.mockReturnValue(of(undefined));
    digitar('#email', 'a@exemplo.test');
    digitar('#senha', 'teste');
    await enviar();

    expect(navegar).not.toHaveBeenCalled();

    digitar('#codigo', '123');
    await enviar();
    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain('6 números');

    digitar('#codigo', '123456');
    await enviar();
    expect(api.confirmarSegundoFator).toHaveBeenCalledWith('123456');
    expect(navegar).toHaveBeenCalledWith('/');
  });

  it('deve validar antes de chamar a API', async () => {
    await enviar();

    expect(api.entrar).not.toHaveBeenCalled();
    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain('e-mail válido');
  });

  it('deve mostrar o erro do servidor', async () => {
    api.entrar.mockReturnValue(
      throwError(() => ({ status: 401, codigo: null, mensagem: 'E-mail ou senha incorretos.' })),
    );
    digitar('#email', 'a@exemplo.test');
    digitar('#senha', 'errada');
    await enviar();

    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain('incorretos');
  });

  it('deve não ter violações de acessibilidade', async () => {
    expect(await violacoesDeAcessibilidade(elemento)).toEqual([]);
  });
});
