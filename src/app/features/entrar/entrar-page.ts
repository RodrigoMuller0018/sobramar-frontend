import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { AutenticacaoApi } from '../../core/autenticacao/autenticacao-api';
import { SessaoService } from '../../core/autenticacao/sessao.service';
import { ErroApi } from '../../core/http/erro-api';

/** Login em duas etapas: e-mail e senha, depois o código do segundo fator, se estiver ativo. */
@Component({
  selector: 'app-entrar-page',
  imports: [ReactiveFormsModule],
  templateUrl: './entrar-page.html',
  styleUrl: './entrar-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntrarPage {
  private readonly api = inject(AutenticacaoApi);
  private readonly sessao = inject(SessaoService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly etapa = signal<'credenciais' | 'codigo'>('credenciais');
  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly credenciais = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    senha: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  protected readonly segundoFator = new FormGroup({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
  });

  protected entrar(): void {
    if (this.credenciais.invalid) {
      this.erro.set('Informe um e-mail válido e a senha.');
      return;
    }
    const { email, senha } = this.credenciais.getRawValue();
    this.enviar(this.api.entrar(email, senha), ({ segundoFatorObrigatorio }) => {
      this.credenciais.controls.senha.reset();
      if (segundoFatorObrigatorio) {
        this.etapa.set('codigo');
      } else {
        this.abrirSessao();
      }
    });
  }

  protected confirmar(): void {
    if (this.segundoFator.invalid) {
      this.erro.set('O código tem 6 números.');
      return;
    }
    const { codigo } = this.segundoFator.getRawValue();
    this.enviar(this.api.confirmarSegundoFator(codigo), () => this.abrirSessao());
  }

  private enviar<T>(chamada: Observable<T>, sucesso: (resposta: T) => void): void {
    this.enviando.set(true);
    this.erro.set(null);
    chamada
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: sucesso, error: (erro: ErroApi) => this.erro.set(erro.mensagem) });
  }

  private abrirSessao(): void {
    this.sessao
      .verificar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.router.navigateByUrl('/'));
  }
}
