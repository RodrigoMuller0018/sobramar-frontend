import { ComponentFixture, TestBed } from '@angular/core/testing';
import { violacoesDeAcessibilidade } from '../../../../../testing/acessibilidade';
import { TarefaForm, validarTitulo } from './tarefa-form';

describe('validarTitulo', () => {
  it.each(['', '   '])('deve exigir título (%j)', (titulo) => {
    expect(validarTitulo(titulo)).toBe('Informe o título da tarefa.');
  });

  it('deve aceitar exatamente 200 caracteres e recusar 201', () => {
    expect(validarTitulo('a'.repeat(200))).toBeNull();
    expect(validarTitulo('a'.repeat(201))).toBe('Use no máximo 200 caracteres.');
  });
});

describe('TarefaForm', () => {
  let fixture: ComponentFixture<TarefaForm>;
  let elemento: HTMLElement;
  let emitidos: string[];

  beforeEach(async () => {
    fixture = TestBed.createComponent(TarefaForm);
    elemento = fixture.nativeElement;
    emitidos = [];
    fixture.componentInstance.criar.subscribe((titulo) => emitidos.push(titulo));
    await fixture.whenStable();
  });

  const campo = () => elemento.querySelector('input') as HTMLInputElement;
  const mensagemErro = () => elemento.querySelector('#titulo-erro')?.textContent?.trim();

  function digitar(texto: string): void {
    campo().value = texto;
    campo().dispatchEvent(new Event('input'));
  }

  async function enviar(): Promise<void> {
    elemento.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('deve emitir o título sem espaços nas pontas', async () => {
    digitar('  Estudar signals  ');
    await enviar();

    expect(emitidos).toEqual(['Estudar signals']);
    expect(mensagemErro()).toBeUndefined();
  });

  it('deve mostrar o erro no campo e não emitir quando o título for inválido', async () => {
    await enviar();

    expect(emitidos).toEqual([]);
    expect(mensagemErro()).toBe('Informe o título da tarefa.');
    expect(campo().getAttribute('aria-invalid')).toBe('true');
    expect(campo().getAttribute('aria-describedby')).toBe('titulo-ajuda titulo-erro');
  });

  it('deve não mostrar erro antes da primeira tentativa de envio', async () => {
    digitar('');
    await fixture.whenStable();

    expect(mensagemErro()).toBeUndefined();
    expect(campo().hasAttribute('aria-invalid')).toBe(false);
  });

  it('deve exibir o erro vindo do servidor', async () => {
    fixture.componentRef.setInput('erro', 'Use no máximo 200 caracteres.');
    await fixture.whenStable();

    expect(mensagemErro()).toBe('Use no máximo 200 caracteres.');
  });

  it('deve desabilitar o botão enquanto envia', async () => {
    fixture.componentRef.setInput('enviando', true);
    await fixture.whenStable();

    expect(elemento.querySelector('button')?.disabled).toBe(true);
  });

  it('deve limpar o campo e o erro', async () => {
    await enviar();
    digitar('Algo');
    fixture.componentInstance.limpar();
    await fixture.whenStable();

    expect(campo().value).toBe('');
    expect(mensagemErro()).toBeUndefined();
  });

  it('deve não ter violações de acessibilidade, inclusive com erro', async () => {
    expect(await violacoesDeAcessibilidade(elemento)).toEqual([]);

    await enviar();
    expect(await violacoesDeAcessibilidade(elemento)).toEqual([]);
  });
});
