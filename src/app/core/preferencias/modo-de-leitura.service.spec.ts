import { TestBed } from '@angular/core/testing';
import { ModoDeLeituraService } from './modo-de-leitura.service';

describe('ModoDeLeituraService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve começar sem escolha e ler como lista', () => {
    const servico = TestBed.inject(ModoDeLeituraService);

    expect(servico.escolhido()).toBeNull();
    expect(servico.modo()).toBe('lista');
  });

  it('deve guardar a escolha só neste navegador', () => {
    const servico = TestBed.inject(ModoDeLeituraService);

    servico.escolher('cena');

    expect(servico.modo()).toBe('cena');
    expect(localStorage.getItem('sobramar.modo-de-leitura')).toBe('cena');
  });

  it('deve alternar entre lista e cena', () => {
    const servico = TestBed.inject(ModoDeLeituraService);

    servico.alternar();
    expect(servico.modo()).toBe('cena');
    servico.alternar();
    expect(servico.modo()).toBe('lista');
  });

  it('deve ignorar um valor estranho guardado', () => {
    localStorage.setItem('sobramar.modo-de-leitura', 'outro');

    expect(TestBed.inject(ModoDeLeituraService).escolhido()).toBeNull();
  });
});
