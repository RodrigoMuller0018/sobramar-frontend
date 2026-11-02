import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Modelo de política de privacidade (item 1 do checklist de Conformidade Web e LGPD).
 * Ajuste ao que o projeto realmente coleta antes de publicar.
 */
@Component({
  selector: 'app-privacidade',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Política de privacidade</h1>
    <p class="aviso-modelo">
      Texto-modelo. Revise antes de publicar e, se o projeto tiver usuários reais, valide com um
      profissional.
    </p>

    <h2>Quais dados coletamos</h2>
    <p>
      Só o título das tarefas que você cadastra. Não pedimos nome, e-mail, CPF ou qualquer outro
      dado pessoal, e não usamos cookies de rastreamento ou analytics.
    </p>

    <h2>Para que usamos</h2>
    <p>Para listar e organizar suas tarefas. Os dados não são vendidos nem compartilhados.</p>

    <h2>Por quanto tempo guardamos</h2>
    <p>Enquanto a tarefa existir. Você pode pedir a exclusão a qualquer momento.</p>

    <h2>Seus direitos (LGPD)</h2>
    <p>
      Você pode pedir acesso, correção ou exclusão dos seus dados pelo canal de contato do projeto.
    </p>
  `,
})
export class Privacidade {}
