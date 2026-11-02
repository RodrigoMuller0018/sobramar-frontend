import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Rascunho coerente com o que o app coleta na Entrega A (item 1 do checklist de Conformidade Web e
 * LGPD). A etapa A9 revisa o texto, e a abertura ao público exige revisão profissional.
 */
@Component({
  selector: 'app-privacidade',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Política de privacidade</h1>
    <p class="aviso-modelo">
      Rascunho para uso pessoal. Ainda não foi revisado por um profissional.
    </p>

    <h2>Quais dados coletamos</h2>
    <p>
      O e-mail da conta e o que você cadastra: receitas, compromissos, carteiras, cartões,
      categorias e apelidos de pessoas. Não pedimos CPF nem senha de banco, e não usamos analytics.
    </p>

    <h2>Cookies e armazenamento</h2>
    <p>
      Usamos só os cookies necessários para manter a sessão e proteger os envios. Duas preferências
      suas (esconder valores e ver sem 3D) ficam neste navegador.
    </p>

    <h2>Para que usamos</h2>
    <p>Para calcular quanto sobra em cada mês. Os dados não são vendidos nem compartilhados.</p>

    <h2>Por quanto tempo guardamos</h2>
    <p>Enquanto a conta existir. A exclusão da conta chega na próxima etapa do projeto.</p>

    <h2>Seus direitos (LGPD)</h2>
    <p>
      Você pode pedir acesso, correção ou exclusão dos seus dados pelo canal de contato do projeto.
    </p>
  `,
})
export class Privacidade {}
