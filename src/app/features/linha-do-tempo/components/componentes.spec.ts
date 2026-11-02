import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { violacoesDeAcessibilidade } from '../../../../testing/acessibilidade';
import { ValoresVisiveisService } from '../../../core/preferencias/valores-visiveis.service';
import { Filtros } from '../data/projecao.model';
import { item, MAIO } from '../testing/exemplo';
import { CalendarioMeses } from './calendario-meses';
import { FiltrosProjecao } from './filtros-projecao';
import { ResumoMes } from './resumo-mes';
import { emReais } from './valor';
import { VisaoAno } from './visao-ano';

describe('emReais', () => {
  it.each([
    [268010, 'R$ 2.680,10'],
    [5, 'R$ 0,05'],
    [100000000, 'R$ 1.000.000,00'],
    [-131990, '−R$ 1.319,90'],
  ])('deve formatar %i como %s', (centavos, esperado) => {
    expect(emReais(centavos)).toBe(esperado);
  });
});

describe('ResumoMes', () => {
  async function renderizar(mes = MAIO) {
    const fixture = TestBed.createComponent(ResumoMes);
    fixture.componentRef.setInput('mes', mes);
    await fixture.whenStable();
    return fixture;
  }

  beforeEach(() => localStorage.clear());

  it('deve mostrar os totais vindos da API, sem recalcular', async () => {
    const elemento: HTMLElement = (await renderizar()).nativeElement;

    expect(elemento.querySelector('.resumo')?.textContent).toContain('R$ 2.680,10');
    expect(elemento.querySelector('.resumo')?.textContent).toContain('Sobra');
    expect(elemento.querySelectorAll('tbody tr')).toHaveLength(MAIO.itens.length);
    expect(elemento.textContent).toContain('4 de 36');
    expect(elemento.textContent).toContain('Cartão azul');
    expect(elemento.textContent).toContain('O vale fica fora da sobra');
    expect(elemento.textContent).toContain('valores estimados');
  });

  it('deve dizer quanto falta quando a sobra for negativa, sem sinal de alarme', async () => {
    const elemento: HTMLElement = (
      await renderizar({ ...MAIO, sobraCentavos: -131990, contemEstimativa: false })
    ).nativeElement;

    expect(elemento.querySelector('dt.total')?.textContent).toBe('Falta');
    expect(elemento.querySelector('dd.total')?.textContent).toContain('R$ 1.319,90');
    expect(elemento.querySelector('dd.total')?.textContent).not.toContain('−');
    expect(elemento.textContent).not.toContain('valores estimados');
  });

  it('deve descrever a situação de cada item', async () => {
    const elemento: HTMLElement = (
      await renderizar({
        ...MAIO,
        itens: [
          item({ compromissoId: 'a', ignorada: true }),
          item({ compromissoId: 'b', situacao: 'REALIZADO' }),
          item({ compromissoId: 'c', certeza: 'ESTIMADO' }),
          item({ compromissoId: null, numeroOcorrencia: null }),
        ],
      })
    ).nativeElement;

    const situacoes = Array.from(elemento.querySelectorAll('tbody tr td:nth-child(4)')).map(
      (td) => td.textContent,
    );
    expect(situacoes).toEqual(['Ignorado', 'Realizado', 'Estimado', 'Previsto']);
  });

  it('deve destacar as linhas do lugar escolhido na ilha', async () => {
    const fixture = await renderizar();
    fixture.componentRef.setInput('destaque', 'cartao');
    await fixture.whenStable();
    const elemento: HTMLElement = fixture.nativeElement;

    expect(elemento.querySelectorAll('tr.destacada')).toHaveLength(3);
  });

  it('deve esconder todos os valores quando o olho estiver fechado', async () => {
    TestBed.inject(ValoresVisiveisService).alternar();
    const elemento: HTMLElement = (await renderizar()).nativeElement;

    expect(elemento.textContent).not.toContain('2.680,10');
    expect(elemento.textContent).toContain('••••');
    TestBed.inject(ValoresVisiveisService).alternar();
  });

  it('deve avisar quando o mês estiver vazio e não ter violações de acessibilidade', async () => {
    const elemento: HTMLElement = (await renderizar({ ...MAIO, itens: [], faturas: [], vale: [] }))
      .nativeElement;

    expect(elemento.textContent).toContain('Nada neste mês.');
    expect(await violacoesDeAcessibilidade(elemento)).toEqual([]);
  });
});

describe('CalendarioMeses', () => {
  it('deve marcar o mês atual e levar a cada mês', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(CalendarioMeses);
    fixture.componentRef.setInput('meses', [MAIO, { ...MAIO, competencia: '2027-06' }]);
    fixture.componentRef.setInput('atual', '2027-06');
    await fixture.whenStable();
    const elemento: HTMLElement = fixture.nativeElement;
    const links = elemento.querySelectorAll('a');

    expect(links[0].getAttribute('href')).toBe('/mes/2027-05');
    expect(links[0].getAttribute('aria-current')).toBeNull();
    expect(links[1].getAttribute('aria-current')).toBe('page');
    expect(links[1].getAttribute('aria-label')).toBe('Junho de 2027');
    expect(await violacoesDeAcessibilidade(elemento)).toEqual([]);
  });
});

describe('FiltrosProjecao', () => {
  it('deve emitir o filtro escolhido e limpar ao voltar para Todas', async () => {
    const fixture = TestBed.createComponent(FiltrosProjecao);
    fixture.componentRef.setInput('filtros', { pessoaId: null, categoriaId: 'c' });
    fixture.componentRef.setInput('pessoas', [{ id: 'p', nome: 'Ana' }]);
    fixture.componentRef.setInput('categorias', [{ id: 'c', nome: 'Moradia' }]);
    await fixture.whenStable();
    const emitidos: Filtros[] = [];
    fixture.componentInstance.mudou.subscribe((f) => emitidos.push(f));
    const elemento: HTMLElement = fixture.nativeElement;

    const pessoa = elemento.querySelector('#filtro-pessoa') as HTMLSelectElement;
    pessoa.value = 'p';
    pessoa.dispatchEvent(new Event('change'));
    const categoria = elemento.querySelector('#filtro-categoria') as HTMLSelectElement;
    categoria.value = '';
    categoria.dispatchEvent(new Event('change'));

    expect(emitidos).toEqual([
      { pessoaId: 'p', categoriaId: 'c' },
      { pessoaId: null, categoriaId: null },
    ]);
    expect(await violacoesDeAcessibilidade(elemento)).toEqual([]);
  });

  it('deve esconder o filtro sem opções', async () => {
    const fixture = TestBed.createComponent(FiltrosProjecao);
    fixture.componentRef.setInput('filtros', { pessoaId: null, categoriaId: null });
    fixture.componentRef.setInput('pessoas', []);
    fixture.componentRef.setInput('categorias', []);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('select')).toBeNull();
  });
});

describe('VisaoAno', () => {
  it('deve desenhar na mesma escala e oferecer a tabela equivalente', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(VisaoAno);
    fixture.componentRef.setInput('meses', [
      MAIO,
      { ...MAIO, competencia: '2027-06', receitasCentavos: 1000000, compromissosCentavos: 2000000 },
    ]);
    await fixture.whenStable();
    const elemento: HTMLElement = fixture.nativeElement;
    const alturas = (classe: string) =>
      Array.from(elemento.querySelectorAll(`rect.${classe}`)).map((r) =>
        Number(r.getAttribute('height')),
      );

    expect(alturas('terra')).toEqual([100, 200]);
    // A água nunca passa do topo da terra, mesmo com compromissos acima da receita.
    expect(alturas('agua')).toEqual([46.398, 200]);
    expect(elemento.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(elemento.querySelector('tbody a')?.getAttribute('href')).toBe('/mes/2027-05');
    expect(await violacoesDeAcessibilidade(elemento)).toEqual([]);
  });
});
