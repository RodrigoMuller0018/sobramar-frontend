import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { violacoesDeAcessibilidade } from '../../../testing/acessibilidade';
import { erroInterceptor } from '../../core/http/erro.interceptor';
import { NotificacaoService } from '../../core/notificacao/notificacao.service';
import { competenciaAtual } from '../linha-do-tempo/dominio/competencia';
import { ComecarPage } from './comecar-page';

describe('ComecarPage', () => {
  let fixture: ComponentFixture<ComecarPage>;
  let elemento: HTMLElement;
  let backend: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    fixture = TestBed.createComponent(ComecarPage);
    elemento = fixture.nativeElement;
    backend = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => backend.verify());

  function escrever(id: string, valor: string | boolean) {
    const campo = elemento.querySelector(`#${id}`) as HTMLInputElement;
    if (typeof valor === 'boolean') {
      campo.checked = valor;
      campo.dispatchEvent(new Event('change'));
    } else {
      campo.value = valor;
      campo.dispatchEvent(new Event('input'));
    }
  }

  function enviar() {
    (elemento.querySelector('form') as HTMLFormElement).requestSubmit();
  }

  it('deve montar o carnê criando carteira, cartão e compromissos na ordem', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    escrever('renda-valor', '5.000,00');
    escrever('cartao-tem', true);
    await fixture.whenStable();
    escrever('conta-0-valor', '1.500,00');
    escrever('parcela-0-descricao', 'Notebook');
    escrever('parcela-0-valor', '300,00');
    escrever('parcela-0-atual', '5');
    await fixture.whenStable();

    enviar();
    backend.expectOne('/api/v1/carteiras').flush({ id: 'w1' });
    const cartao = backend.expectOne('/api/v1/cartoes');
    expect(cartao.request.body).toEqual({
      nome: 'Cartão',
      diaFechamento: 25,
      diaVencimento: 5,
      limiteCentavos: null,
    });
    cartao.flush({ id: 'k1' });

    const salario = backend.expectOne('/api/v1/compromissos');
    expect(salario.request.body).toMatchObject({
      natureza: 'ENTRADA',
      descricao: 'Salário',
      valorCentavos: 500000,
      carteiraId: 'w1',
    });
    salario.flush({ id: 'c1' });

    const aluguel = backend.expectOne('/api/v1/compromissos');
    expect(aluguel.request.body).toMatchObject({ descricao: 'Aluguel', valorCentavos: 150000 });
    aluguel.flush({ id: 'c2' });

    const notebook = backend.expectOne('/api/v1/compromissos');
    expect(notebook.request.body).toMatchObject({
      descricao: 'Notebook',
      valorTotalCentavos: 360000,
      parcelas: 12,
      cartaoId: 'k1',
    });
    notebook.flush({ id: 'c3' });
    await fixture.whenStable();

    expect(navegar).toHaveBeenCalledWith(['/mes', competenciaAtual()]);
    expect(TestBed.inject(NotificacaoService).atual()?.tipo).toBe('sucesso');
  });

  it('deve recusar um valor que não dá para ler, sem chamar a API', async () => {
    escrever('renda-valor', 'cinco mil');
    escrever('conta-0-valor', '1.500,00');
    escrever('parcela-0-descricao', 'Curso');
    escrever('parcela-0-valor', '100,00');
    await fixture.whenStable();

    enviar();
    await fixture.whenStable();

    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain('1.500,00');
    backend.expectNone('/api/v1/carteiras');
  });

  it('deve pedir os campos obrigatórios antes de enviar', async () => {
    enviar();
    await fixture.whenStable();

    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain('Preencha');
  });

  it('deve mostrar o erro da API e manter o formulário', async () => {
    escrever('renda-valor', '5000');
    escrever('conta-0-valor', '1500');
    (elemento.querySelectorAll('fieldset')[3].querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();

    enviar();
    backend.expectOne('/api/v1/carteiras').flush({ id: 'w1' });
    backend
      .expectOne('/api/v1/compromissos')
      .flush({ codigo: 'VALOR_INVALIDO' }, { status: 422, statusText: 'Unprocessable' });
    await fixture.whenStable();

    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain('Revise');
    expect((elemento.querySelector('#renda-valor') as HTMLInputElement).value).toBe('5000');
  });

  it('deve não ter violações de acessibilidade', async () => {
    expect(await violacoesDeAcessibilidade(elemento)).toEqual([]);
  });
});
