import { ComponentFixture, TestBed } from '@angular/core/testing';
import { violacoesDeAcessibilidade } from '../../../../testing/acessibilidade';
import { ValoresVisiveisService } from '../../../core/preferencias/valores-visiveis.service';
import { dadosDaIlha } from '../dominio/ilha-do-mes';
import { MAIO } from '../testing/exemplo';
import { IlhaMes } from './ilha-mes';
import { AoRedorDaCena, CRIAR_MOTOR, MotorDaIlha } from './motor-da-ilha';

const DADOS = dadosDaIlha(MAIO, 750000);

describe('IlhaMes', () => {
  let fixture: ComponentFixture<IlhaMes>;
  let elemento: HTMLElement;
  let redor: AoRedorDaCena;
  const motor: { [K in keyof MotorDaIlha]: ReturnType<typeof vi.fn> } = {
    mostrar: vi.fn(),
    selecionar: vi.fn(),
    pausar: vi.fn(),
    destruir: vi.fn(),
  };
  let criar: ReturnType<typeof vi.fn>;

  async function renderizar(): Promise<void> {
    TestBed.configureTestingModule({ providers: [{ provide: CRIAR_MOTOR, useValue: criar }] });
    fixture = TestBed.createComponent(IlhaMes);
    fixture.componentRef.setInput('dados', DADOS);
    elemento = fixture.nativeElement;
    await fixture.whenStable();
    await new Promise((resolver) => setTimeout(resolver));
    await fixture.whenStable();
  }

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    criar = vi.fn(async (_canvas: HTMLCanvasElement, _palco: HTMLElement, r: AoRedorDaCena) => {
      redor = r;
      return motor as unknown as MotorDaIlha;
    });
  });

  it('deve mostrar um botão com o valor no nome para cada lugar', async () => {
    await renderizar();
    const nomes = Array.from(elemento.querySelectorAll('.ponto')).map((b) =>
      b.getAttribute('aria-label'),
    );

    expect(nomes).toContain('Cartão: R$ 539,90');
    expect(nomes).toContain('Vale: R$ 800,00');
    expect(elemento.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
    expect(await violacoesDeAcessibilidade(elemento)).toEqual([]);
  });

  it('deve mandar os dados ao motor, sem animação na primeira vez', async () => {
    await renderizar();

    expect(motor.mostrar).toHaveBeenCalledWith(DADOS, 0);
  });

  it('deve indicar a direção da troca de mês', async () => {
    await renderizar();
    fixture.componentRef.setInput('dados', { ...DADOS, competencia: '2027-06' });
    await fixture.whenStable();
    expect(motor.mostrar).toHaveBeenLastCalledWith(expect.anything(), 1);

    fixture.componentRef.setInput('dados', { ...DADOS, competencia: '2027-04' });
    await fixture.whenStable();
    expect(motor.mostrar).toHaveBeenLastCalledWith(expect.anything(), -1);

    fixture.componentRef.setInput('dados', { ...DADOS, competencia: '2027-04', lugares: [] });
    await fixture.whenStable();
    expect(motor.mostrar).toHaveBeenLastCalledWith(expect.anything(), 0);
  });

  it('deve alternar a seleção e mostrar a ficha do lugar', async () => {
    await renderizar();
    const emitidos: unknown[] = [];
    fixture.componentInstance.selecionar.subscribe((id) => emitidos.push(id));
    const botao = elemento.querySelector('[data-lugar="cartao"]') as HTMLButtonElement;

    botao.click();
    fixture.componentRef.setInput('selecionado', 'cartao');
    await fixture.whenStable();

    expect(elemento.querySelector('.ficha')?.textContent).toContain('R$ 539,90');
    expect(motor.selecionar).toHaveBeenLastCalledWith('cartao');
    expect(botao.getAttribute('aria-pressed')).toBe('true');

    redor.posicionar('cartao', 100, 50);
    expect(botao.style.transform).toBe('translate(100.0px,50.0px)');
    expect((elemento.querySelector('.ficha') as HTMLElement).style.transform).toContain('100.0px');

    botao.click();
    expect(emitidos).toEqual(['cartao', null]);
  });

  it('deve repassar o gesto de deslizar', async () => {
    await renderizar();
    const emitidos: number[] = [];
    fixture.componentInstance.deslizar.subscribe((d) => emitidos.push(d));

    redor.deslizar(1);

    expect(emitidos).toEqual([1]);
  });

  it('deve esconder os valores também nos nomes dos botões', async () => {
    await renderizar();
    TestBed.inject(ValoresVisiveisService).alternar();
    await fixture.whenStable();

    expect(elemento.querySelector('[data-lugar="cartao"]')?.getAttribute('aria-label')).toBe(
      'Cartão: valor oculto',
    );
    TestBed.inject(ValoresVisiveisService).alternar();
  });

  it('deve desligar a cena, lembrar a escolha e religar', async () => {
    await renderizar();
    const alternar = elemento.querySelector('.alternar') as HTMLButtonElement;

    alternar.click();
    await fixture.whenStable();

    expect(motor.pausar).toHaveBeenLastCalledWith(true);
    expect(elemento.querySelector('.aviso-cena')?.textContent).toContain('desligada');
    expect(localStorage.getItem('sobramar.sem-3d')).toBe('true');

    alternar.click();
    await fixture.whenStable();

    expect(motor.pausar).toHaveBeenLastCalledWith(false);
    expect(elemento.querySelector('.aviso-cena')).toBeNull();
  });

  it('deve não criar a cena quando a pessoa preferir sem 3D, e criar ao religar', async () => {
    localStorage.setItem('sobramar.sem-3d', 'true');
    await renderizar();

    expect(criar).not.toHaveBeenCalled();

    (elemento.querySelector('.alternar') as HTMLButtonElement).click();
    await new Promise((resolver) => setTimeout(resolver));
    await fixture.whenStable();

    expect(criar).toHaveBeenCalled();
  });

  it('deve avisar e seguir funcionando quando o aparelho não abrir a cena', async () => {
    criar = vi.fn().mockRejectedValue(new Error('sem WebGL'));
    await renderizar();

    expect(elemento.querySelector('.aviso-cena')?.textContent).toContain('não abriu');
    expect(elemento.querySelector('.alternar')).toBeNull();
    expect(await violacoesDeAcessibilidade(elemento)).toEqual([]);
  });

  it('deve avisar quando a cena parar depois de aberta', async () => {
    await renderizar();

    redor.falhou();
    await fixture.whenStable();

    expect(elemento.querySelector('.aviso-cena')?.textContent).toContain('não abriu');
  });

  it('deve destruir a cena ao sair da tela', async () => {
    await renderizar();

    fixture.destroy();

    expect(motor.destruir).toHaveBeenCalled();
  });
});
