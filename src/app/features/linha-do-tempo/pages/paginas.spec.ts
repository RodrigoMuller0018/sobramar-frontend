import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProjecaoApi } from '../data/projecao-api';
import { competenciaAtual } from '../dominio/competencia';
import { CRIAR_MOTOR } from '../ilha/motor-da-ilha';
import { LinhaDoTempoStore } from '../linha-do-tempo.store';
import { MAIO } from '../testing/exemplo';
import { AnoPage } from './ano-page';
import { MesPage } from './mes-page';

describe('páginas da linha do tempo', () => {
  const api = { projetar: vi.fn(), pessoas: vi.fn(), categorias: vi.fn() };
  const motor = { mostrar: vi.fn(), selecionar: vi.fn(), pausar: vi.fn(), destruir: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('sobramar.modo-de-leitura', 'cena');
    api.projetar.mockReturnValue(of({ atualizadoEm: null, meses: [MAIO] }));
    api.pessoas.mockReturnValue(of([]));
    api.categorias.mockReturnValue(of([]));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        LinhaDoTempoStore,
        { provide: ProjecaoApi, useValue: api },
        { provide: CRIAR_MOTOR, useValue: async () => motor },
      ],
    });
  });

  async function abrirMes(competencia: string) {
    const fixture = TestBed.createComponent(MesPage);
    fixture.componentRef.setInput('competencia', competencia);
    await fixture.whenStable();
    return fixture;
  }

  it('deve mostrar o mês com o número exato em texto, fora da cena', async () => {
    const elemento: HTMLElement = (await abrirMes('2027-05')).nativeElement;

    expect(elemento.querySelector('h1')?.textContent).toBe('Maio de 2027');
    expect(elemento.querySelector('.placar')?.textContent).toContain('Sobram');
    expect(elemento.querySelector('.placar')?.textContent).toContain('R$ 2.680,10');
    expect(elemento.querySelector('.placar')?.closest('app-ilha-mes')).toBeNull();
  });

  it('deve dizer quanto falta quando a sobra for negativa', async () => {
    api.projetar.mockReturnValue(of({ meses: [{ ...MAIO, sobraCentavos: -5000 }] }));
    const elemento: HTMLElement = (await abrirMes('2027-05')).nativeElement;

    expect(elemento.querySelector('.placar')?.textContent).toContain('Faltam');
    expect(elemento.querySelector('.placar')?.textContent).toContain('R$ 50,00');
  });

  it('deve levar aos meses vizinhos pelas setas', async () => {
    const elemento: HTMLElement = (await abrirMes('2027-12')).nativeElement;
    const setas = elemento.querySelectorAll('.seta');

    expect(setas[0].getAttribute('href')).toBe('/mes/2027-11');
    expect(setas[1].getAttribute('href')).toBe('/mes/2028-01');
  });

  it('deve navegar quando a pessoa deslizar a cena', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = await abrirMes('2027-05');
    const ilha = fixture.debugElement.query((d) => d.name === 'app-ilha-mes');

    ilha.triggerEventHandler('deslizar', 1);
    expect(navegar).toHaveBeenLastCalledWith(['/mes', '2027-06']);

    ilha.triggerEventHandler('deslizar', -1);
    expect(navegar).toHaveBeenLastCalledWith(['/mes', '2027-04']);
  });

  it('deve destacar na tabela o lugar escolhido na ilha e limpar ao trocar de mês', async () => {
    const fixture = await abrirMes('2027-05');
    const ilha = fixture.debugElement.query((d) => d.name === 'app-ilha-mes');
    const elemento: HTMLElement = fixture.nativeElement;

    ilha.triggerEventHandler('selecionar', 'cartao');
    await fixture.whenStable();
    expect(elemento.querySelectorAll('tr.destacada')).toHaveLength(3);

    fixture.componentRef.setInput('competencia', '2027-04');
    await fixture.whenStable();
    expect(elemento.querySelector('tr.destacada')).toBeNull();
  });

  it('deve mostrar o erro e permitir tentar de novo', async () => {
    api.projetar.mockReturnValueOnce(
      throwError(() => ({ status: 500, codigo: null, mensagem: 'Falhou.' })),
    );
    const fixture = await abrirMes('2027-05');
    const elemento: HTMLElement = fixture.nativeElement;

    expect(elemento.querySelector('.texto-erro')?.textContent).toBe('Falhou.');

    (elemento.querySelector('.estado button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(elemento.querySelector('.placar')).not.toBeNull();
  });

  it('deve avisar quando o mês não vier na resposta', async () => {
    const elemento: HTMLElement = (await abrirMes('2027-04')).nativeElement;

    expect(elemento.querySelector('.estado')?.textContent).toContain('não está disponível');
  });

  it('deve mostrar os próximos 12 meses na visão do ano', async () => {
    const atual = competenciaAtual();
    api.projetar.mockReturnValue(
      of({
        meses: [
          { ...MAIO, competencia: atual },
          { ...MAIO, competencia: '2000-01' },
        ],
      }),
    );
    const fixture = TestBed.createComponent(AnoPage);
    await fixture.whenStable();
    const elemento: HTMLElement = fixture.nativeElement;

    expect(elemento.querySelector('h1')?.textContent).toBe('Os próximos 12 meses');
    expect(elemento.querySelectorAll('tbody tr')).toHaveLength(1);
  });

  it('deve mostrar o erro na visão do ano', async () => {
    api.projetar.mockReturnValue(
      throwError(() => ({ status: 500, codigo: null, mensagem: 'Falhou.' })),
    );
    const fixture = TestBed.createComponent(AnoPage);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('.texto-erro')).not.toBeNull();
  });
});
