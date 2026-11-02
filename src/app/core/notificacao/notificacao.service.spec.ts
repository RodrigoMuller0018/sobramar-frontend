import { TestBed } from '@angular/core/testing';
import { NotificacaoService } from './notificacao.service';

describe('NotificacaoService', () => {
  let servico: NotificacaoService;

  beforeEach(() => {
    servico = TestBed.inject(NotificacaoService);
  });

  it('deve começar sem aviso', () => {
    expect(servico.atual()).toBeNull();
  });

  it('deve trocar o aviso atual e limpar', () => {
    servico.sucesso('Salvo.');
    expect(servico.atual()).toEqual({ tipo: 'sucesso', texto: 'Salvo.' });

    servico.erro('Falhou.');
    expect(servico.atual()).toEqual({ tipo: 'erro', texto: 'Falhou.' });

    servico.limpar();
    expect(servico.atual()).toBeNull();
  });
});
