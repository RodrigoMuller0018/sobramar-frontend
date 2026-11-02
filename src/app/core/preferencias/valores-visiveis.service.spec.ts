import { TestBed } from '@angular/core/testing';
import { ValoresVisiveisService } from './valores-visiveis.service';

describe('ValoresVisiveisService', () => {
  beforeEach(() => localStorage.clear());

  it('deve começar com os valores visíveis, alternar e lembrar', () => {
    const servico = TestBed.inject(ValoresVisiveisService);
    expect(servico.ocultos()).toBe(false);

    servico.alternar();

    expect(servico.ocultos()).toBe(true);
    expect(localStorage.getItem('sobramar.valores-ocultos')).toBe('true');
  });

  it('deve funcionar quando o navegador recusar o armazenamento', () => {
    const recusa = () => {
      throw new Error('bloqueado');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(recusa);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(recusa);

    const servico = TestBed.inject(ValoresVisiveisService);
    servico.alternar();

    expect(servico.ocultos()).toBe(true);
    vi.restoreAllMocks();
  });
});
