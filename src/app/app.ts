import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessaoService } from './core/autenticacao/sessao.service';
import { NotificacaoService } from './core/notificacao/notificacao.service';
import { ModoDeLeituraService } from './core/preferencias/modo-de-leitura.service';
import { ValoresVisiveisService } from './core/preferencias/valores-visiveis.service';

/** Shell da aplicação: navegação, região de avisos, conteúdo e rodapé com os links legais. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly notificacaoService = inject(NotificacaoService);
  private readonly sessao = inject(SessaoService);
  private readonly router = inject(Router);
  private readonly valores = inject(ValoresVisiveisService);
  private readonly modos = inject(ModoDeLeituraService);
  private readonly conteudo = viewChild.required<ElementRef<HTMLElement>>('conteudo');

  protected readonly notificacao = this.notificacaoService.atual;
  protected readonly usuario = this.sessao.usuario;
  protected readonly ocultos = this.valores.ocultos;
  protected readonly modo = computed(() => this.modos.escolhido() ?? 'lista');

  /** Com o router, `href="#conteudo"` recarregaria a raiz; então o foco é movido à mão. */
  protected pularParaConteudo(evento: Event): void {
    evento.preventDefault();
    this.conteudo().nativeElement.focus();
  }

  protected fecharAviso(): void {
    this.notificacaoService.limpar();
  }

  protected alternarValores(): void {
    this.valores.alternar();
  }

  protected alternarModo(): void {
    this.modos.alternar();
  }

  protected sair(): void {
    this.sessao.sair().subscribe({
      next: () => void this.router.navigateByUrl('/entrar'),
      error: () => void this.router.navigateByUrl('/entrar'),
    });
  }
}
