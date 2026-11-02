import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MesProjetado } from '../data/projecao.model';
import { abreviacaoDoMes, nomeDoMes } from '../dominio/competencia';
import { Valor } from './valor';

const ALTURA = 200;
const LARGURA_MES = 56;
const MARGEM_BARRA = 10;
const RODAPE = 28;

/** Visão secundária: a terra de cada mês lado a lado, com a mesma escala. */
@Component({
  selector: 'app-visao-ano',
  imports: [RouterLink, Valor],
  templateUrl: './visao-ano.html',
  styleUrl: './visao-ano.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisaoAno {
  readonly meses = input.required<readonly MesProjetado[]>();

  protected readonly largura = computed(() => this.meses().length * LARGURA_MES);
  protected readonly alturaTotal = ALTURA + RODAPE;
  protected readonly barras = computed(() => {
    const meses = this.meses();
    const escala = ALTURA / Math.max(1, ...meses.map((mes) => mes.receitasCentavos));
    return meses.map((mes, indice) => {
      const altura = mes.receitasCentavos * escala;
      const agua = Math.min(altura, Math.max(0, mes.compromissosCentavos * escala));
      return {
        mes,
        nome: nomeDoMes(mes.competencia),
        abreviacao: abreviacaoDoMes(mes.competencia),
        x: indice * LARGURA_MES + MARGEM_BARRA,
        centro: indice * LARGURA_MES + LARGURA_MES / 2,
        larguraBarra: LARGURA_MES - 2 * MARGEM_BARRA,
        yTerra: ALTURA - altura,
        alturaTerra: altura,
        yAgua: ALTURA - agua,
        alturaAgua: agua,
        rotuloY: ALTURA + 18,
      };
    });
  });
}
