import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { violacoesDeAcessibilidade } from '../../../../testing/acessibilidade';
import { ModoDeLeituraService } from '../../../core/preferencias/modo-de-leitura.service';
import { ProjecaoApi } from '../data/projecao-api';
import { CRIAR_MOTOR } from '../ilha/motor-da-ilha';
import { LinhaDoTempoStore } from '../linha-do-tempo.store';
import { MAIO } from '../testing/exemplo';
import { MesPage } from './mes-page';

describe('a lista simples e a sobra a lápis', () => {
  const api = { projetar: vi.fn(), pessoas: vi.fn(), categorias: vi.fn() };
  const motor = { mostrar: vi.fn(), selecionar: vi.fn(), pausar: vi.fn(), destruir: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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

  async function abrir() {
    const fixture = TestBed.createComponent(MesPage);
    fixture.componentRef.setInput('competencia', '2027-05');
    await fixture.whenStable();
    return fixture;
  }

  it('deve começar na lista, sem a cena, e perguntar como a pessoa quer ler', async () => {
    const elemento: HTMLElement = (await abrir()).nativeElement;

    expect(elemento.querySelector('.escolha h2')?.textContent).toContain('Como você quer ler');
    expect(elemento.querySelector('app-ilha-mes')).toBeNull();
    expect(elemento.querySelector('.principal app-resumo-mes table')).not.toBeNull();
    expect(await violacoesDeAcessibilidade(elemento)).toEqual([]);
  });

  it('deve guardar a escolha da cena e parar de perguntar', async () => {
    const fixture = await abrir();
    const elemento: HTMLElement = fixture.nativeElement;

    (elemento.querySelectorAll('.escolha button')[1] as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(elemento.querySelector('.escolha')).toBeNull();
    expect(elemento.querySelector('app-ilha-mes')).not.toBeNull();
    expect(TestBed.inject(ModoDeLeituraService).modo()).toBe('cena');
  });

  it('deve dizer que a sobra é estimada e quando os dados foram atualizados', async () => {
    const hoje = new Date().toISOString();
    api.projetar.mockReturnValue(of({ atualizadoEm: hoje, meses: [MAIO] }));
    const elemento: HTMLElement = (await abrir()).nativeElement;

    expect(elemento.querySelector('.placar')?.classList).toContain('placar--estimada');
    expect(elemento.querySelector('.placar__confianca')?.textContent).toBe('estimado');
    expect(elemento.querySelector('.atualizado')?.textContent).toBe('Atualizado hoje');
    expect(elemento.querySelector('app-resumo-mes .nota')?.textContent).toContain('Sobra estimada');
  });

  it('deve mostrar a sobra firme e a fatura conciliada', async () => {
    api.projetar.mockReturnValue(
      of({
        atualizadoEm: null,
        meses: [
          {
            ...MAIO,
            contemEstimativa: false,
            confianca: 'FIRME',
            faturas: [
              {
                ...MAIO.faturas[0],
                informadoCentavos: 53990,
                diferencaCentavos: 0,
                conciliada: true,
              },
            ],
          },
        ],
      }),
    );
    const elemento: HTMLElement = (await abrir()).nativeElement;

    expect(elemento.querySelector('.placar')?.classList).not.toContain('placar--estimada');
    expect(elemento.querySelector('.placar__confianca')?.textContent).toBe('firme');
    expect(elemento.querySelector('.atualizado')?.textContent).toBe('Ainda sem lançamentos');
    expect(elemento.querySelector('app-resumo-mes .lista')?.textContent).toContain(
      'bate com o banco',
    );
  });

  it('deve dizer quanto falta explicar na fatura', async () => {
    api.projetar.mockReturnValue(
      of({
        atualizadoEm: null,
        meses: [
          {
            ...MAIO,
            faturas: [
              {
                ...MAIO.faturas[0],
                informadoCentavos: 58990,
                diferencaCentavos: 5000,
                conciliada: false,
              },
            ],
          },
        ],
      }),
    );
    const elemento: HTMLElement = (await abrir()).nativeElement;

    expect(elemento.querySelector('app-resumo-mes .lista')?.textContent).toContain(
      'falta explicar R$ 50,00',
    );
  });

  it('deve convidar a montar o carnê quando a conta está em branco', async () => {
    api.projetar.mockReturnValue(
      of({
        atualizadoEm: null,
        meses: [
          {
            ...MAIO,
            receitasCentavos: 0,
            compromissosCentavos: 0,
            sobraCentavos: 0,
            faturas: [],
            itens: [],
            vale: [],
          },
        ],
      }),
    );
    const elemento: HTMLElement = (await abrir()).nativeElement;

    expect(elemento.querySelector('.vazio a')?.getAttribute('href')).toBe('/comecar');
  });
});
