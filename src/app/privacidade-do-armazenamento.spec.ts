import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ModoDeLeituraService } from './core/preferencias/modo-de-leitura.service';
import { ValoresVisiveisService } from './core/preferencias/valores-visiveis.service';
import { ProjecaoApi } from './features/linha-do-tempo/data/projecao-api';
import { CRIAR_MOTOR } from './features/linha-do-tempo/ilha/motor-da-ilha';
import { LinhaDoTempoStore } from './features/linha-do-tempo/linha-do-tempo.store';
import { MesPage } from './features/linha-do-tempo/pages/mes-page';
import { MAIO } from './features/linha-do-tempo/testing/exemplo';

/**
 * Dado financeiro nunca fica no navegador: o que vai para o armazenamento são só preferências. Este teste
 * abre o mês com a família fictícia, mexe nas preferências e falha se achar qualquer centavo guardado, ou se
 * algo tiver aberto o IndexedDB ou o Cache Storage.
 */
describe('privacidade do armazenamento', () => {
  const api = { projetar: vi.fn(), pessoas: vi.fn(), categorias: vi.fn() };
  const motor = { mostrar: vi.fn(), selecionar: vi.fn(), pausar: vi.fn(), destruir: vi.fn() };
  const VALORES_DO_MES = ['268010', '2.680,10', '500000', '5.000,00', '231990', '53990', '150000'];

  function tudoGuardado(): string {
    const entradas: string[] = [];
    for (const deposito of [localStorage, sessionStorage]) {
      for (let i = 0; i < deposito.length; i++) {
        const chave = deposito.key(i) ?? '';
        entradas.push(`${chave}=${deposito.getItem(chave) ?? ''}`);
      }
    }
    return entradas.join('\n');
  }

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    api.projetar.mockReturnValue(of({ atualizadoEm: '2027-05-10T12:00:00Z', meses: [MAIO] }));
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

  it('não deve deixar nenhum centavo no navegador depois de ver o mês', async () => {
    const abrirIndexedDb =
      'indexedDB' in globalThis && globalThis.indexedDB
        ? vi.spyOn(globalThis.indexedDB, 'open')
        : null;
    const abrirCache = 'caches' in globalThis ? vi.spyOn(globalThis.caches, 'open') : null;

    const fixture = TestBed.createComponent(MesPage);
    fixture.componentRef.setInput('competencia', '2027-05');
    await fixture.whenStable();
    TestBed.inject(ValoresVisiveisService).alternar();
    TestBed.inject(ModoDeLeituraService).escolher('cena');
    await fixture.whenStable();

    const guardado = tudoGuardado();
    expect(guardado).toContain('sobramar.');
    for (const valor of VALORES_DO_MES) {
      expect(guardado).not.toContain(valor);
    }
    expect(guardado).not.toMatch(/\d{3,}/);
    expect(abrirIndexedDb?.mock.calls ?? []).toHaveLength(0);
    expect(abrirCache?.mock.calls ?? []).toHaveLength(0);
  });
});
