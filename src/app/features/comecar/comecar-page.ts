import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, concatMap, finalize, from, last, map, of, switchMap } from 'rxjs';
import { ErroApi } from '../../core/http/erro-api';
import { NotificacaoService } from '../../core/notificacao/notificacao.service';
import { competenciaAtual } from '../linha-do-tempo/dominio/competencia';
import { CadastroApi } from './data/cadastro-api';
import { Carne, Origens, compromissosDoCarne } from './dominio/plano-do-carne';
import { paraCentavos } from './dominio/reais';

const DIA = [Validators.required, Validators.min(1), Validators.max(31)];
const NOME_DA_CARTEIRA = 'Conta principal';

/**
 * "Montar meu carnê": o mínimo para a sobra aparecer, em três minutos. Renda e dia do pagamento, o cartão com
 * fechamento e vencimento, as contas fixas e as parcelas em andamento. Tudo vira chamadas às rotas de cadastro
 * que já existem; a sobra fica a lápis até a fatura bater com o banco.
 */
@Component({
  selector: 'app-comecar-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './comecar-page.html',
  styleUrl: './comecar-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComecarPage {
  private readonly api = inject(CadastroApi);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificacao = inject(NotificacaoService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly formulario = this.fb.group({
    renda: this.fb.group({
      valor: ['', Validators.required],
      dia: [5, DIA],
    }),
    cartao: this.fb.group({
      tem: [false],
      nome: ['Cartão', Validators.required],
      fechamento: [25, DIA],
      vencimento: [5, DIA],
    }),
    contas: this.fb.array([this.novaConta('Aluguel')]),
    parcelas: this.fb.array([this.novaParcela()]),
  });

  protected get contas() {
    return this.formulario.controls.contas;
  }

  protected get parcelas() {
    return this.formulario.controls.parcelas;
  }

  protected adicionarConta(): void {
    this.contas.push(this.novaConta(''));
  }

  protected removerConta(indice: number): void {
    this.contas.removeAt(indice);
  }

  protected adicionarParcela(): void {
    this.parcelas.push(this.novaParcela());
  }

  protected removerParcela(indice: number): void {
    this.parcelas.removeAt(indice);
  }

  protected montar(): void {
    const carne = this.lerCarne();
    if (!carne) {
      return;
    }
    this.enviando.set(true);
    this.erro.set(null);
    this.criarOrigens(carne)
      .pipe(
        switchMap((origens) => this.criarCompromissos(carne, origens)),
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notificacao.sucesso(
            'Seu carnê está montado. A sobra fica a lápis até bater com a fatura do banco.',
          );
          void this.router.navigate(['/mes', competenciaAtual()]);
        },
        error: (erro: ErroApi) => this.erro.set(erro.mensagem),
      });
  }

  private novaConta(descricao: string) {
    return this.fb.group({
      descricao: [descricao, Validators.required],
      valor: ['', Validators.required],
      dia: [10, DIA],
      estimada: [false],
    });
  }

  private novaParcela() {
    return this.fb.group({
      descricao: ['', Validators.required],
      valorParcela: ['', Validators.required],
      atual: [1, [Validators.required, Validators.min(1)]],
      total: [12, [Validators.required, Validators.min(1), Validators.max(120)]],
      noCartao: [true],
      dia: [10, DIA],
    });
  }

  /** Lê o formulário em centavos. Qualquer valor ilegível para tudo, com a mensagem no topo. */
  private lerCarne(): Carne | null {
    if (this.formulario.invalid) {
      this.erro.set('Preencha os campos marcados antes de montar o carnê.');
      return null;
    }
    const { renda, cartao, contas, parcelas } = this.formulario.getRawValue();
    const valores = [
      renda.valor,
      ...contas.map((c) => c.valor),
      ...parcelas.map((p) => p.valorParcela),
    ];
    const centavos = valores.map(paraCentavos);
    if (centavos.some((valor) => valor === null)) {
      this.erro.set('Escreva os valores em reais, como 1.500,00.');
      return null;
    }
    const [rendaCentavos, ...resto] = centavos as number[];
    const contasCentavos = resto.slice(0, contas.length);
    const parcelasCentavos = resto.slice(contas.length);
    return {
      renda: { valorCentavos: rendaCentavos, diaPagamento: renda.dia },
      cartao: cartao.tem
        ? { nome: cartao.nome, diaFechamento: cartao.fechamento, diaVencimento: cartao.vencimento }
        : null,
      contas: contas.map((conta, i) => ({
        descricao: conta.descricao,
        valorCentavos: contasCentavos[i],
        dia: conta.dia,
        estimada: conta.estimada,
      })),
      parcelas: parcelas.map((parcela, i) => ({
        descricao: parcela.descricao,
        valorParcelaCentavos: parcelasCentavos[i],
        parcelaAtual: Math.min(parcela.atual, parcela.total),
        totalParcelas: parcela.total,
        noCartao: parcela.noCartao,
        diaVencimento: parcela.dia,
      })),
    };
  }

  private criarOrigens(carne: Carne): Observable<Origens> {
    return this.api
      .criarCarteira(NOME_DA_CARTEIRA)
      .pipe(
        switchMap((carteira) =>
          carne.cartao
            ? this.api
                .criarCartao(carne.cartao)
                .pipe(map((cartao) => ({ carteiraId: carteira.id, cartaoId: cartao.id })))
            : of({ carteiraId: carteira.id, cartaoId: null }),
        ),
      );
  }

  /** Um compromisso por vez, na ordem: se um falhar, os anteriores ficam e a pessoa corrige o resto. */
  private criarCompromissos(carne: Carne, origens: Origens): Observable<unknown> {
    const pedidos = compromissosDoCarne(carne, competenciaAtual(), origens);
    return from(pedidos).pipe(
      concatMap((pedido) => this.api.criarCompromisso(pedido)),
      last(),
    );
  }
}
