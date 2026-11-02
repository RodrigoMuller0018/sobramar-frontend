import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NotificacaoService } from './core/notificacao/notificacao.service';

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
  private readonly conteudo = viewChild.required<ElementRef<HTMLElement>>('conteudo');

  protected readonly notificacao = this.notificacaoService.atual;

  /** Com o router, `href="#conteudo"` recarregaria a raiz; então o foco é movido à mão. */
  protected pularParaConteudo(evento: Event): void {
    evento.preventDefault();
    this.conteudo().nativeElement.focus();
  }

  protected fecharAviso(): void {
    this.notificacaoService.limpar();
  }
}
