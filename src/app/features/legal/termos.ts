import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Modelo de termos de uso (item 2 do checklist). Obrigatório quando houver usuários reais. */
@Component({
  selector: 'app-termos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Termos de uso</h1>
    <p class="aviso-modelo">
      Texto-modelo. Revise antes de publicar e, se o projeto tiver usuários reais, valide com um
      profissional.
    </p>

    <h2>Uso do serviço</h2>
    <p>
      O serviço é oferecido como está, para acompanhar quanto sobra em cada mês. Ele mostra contas e
      cenários, e não recomenda investimentos nem movimenta dinheiro.
    </p>

    <h2>Responsabilidades</h2>
    <p>Você é responsável pelo conteúdo que cadastra. Para outras pessoas, use só apelidos.</p>
  `,
})
export class Termos {}
