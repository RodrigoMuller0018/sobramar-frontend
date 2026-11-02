import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ItemProjetado, MesProjetado } from '../data/projecao.model';
import { dataCurta } from '../dominio/competencia';
import { IdDoLugar, lugarDoItem } from '../dominio/ilha-do-mes';
import { Valor } from './valor';

/** A leitura exata do mês: funciona sem a cena, sem animação e só com teclado. */
@Component({
  selector: 'app-resumo-mes',
  imports: [Valor],
  templateUrl: './resumo-mes.html',
  styleUrl: './resumo-mes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumoMes {
  readonly mes = input.required<MesProjetado>();
  readonly destaque = input<IdDoLugar | null>(null);

  protected readonly sobra = computed(() => this.mes().sobraCentavos);
  protected readonly linhas = computed(() =>
    this.mes().itens.map((item, indice) => ({
      item,
      chave: `${item.compromissoId ?? 'avulso'}-${item.numeroOcorrencia ?? indice}`,
      parcela: textoDaParcela(item),
      vencimento: dataCurta(item.vencimento),
      situacao: textoDaSituacao(item),
      destacada: !item.ignorada && lugarDoItem(item) === this.destaque(),
    })),
  );
  protected readonly faturas = computed(() =>
    this.mes().faturas.map((fatura) => ({ ...fatura, data: dataCurta(fatura.vencimento) })),
  );
}

function textoDaParcela(item: ItemProjetado): string {
  return item.totalOcorrencias ? `${item.numeroOcorrencia} de ${item.totalOcorrencias}` : '';
}

function textoDaSituacao(item: ItemProjetado): string {
  if (item.ignorada) {
    return 'Ignorado';
  }
  if (item.situacao === 'REALIZADO') {
    return 'Realizado';
  }
  return item.certeza === 'ESTIMADO' ? 'Estimado' : 'Previsto';
}
