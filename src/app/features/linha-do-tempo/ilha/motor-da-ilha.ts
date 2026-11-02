import { InjectionToken } from '@angular/core';
import { DadosDaIlha, IdDoLugar } from '../dominio/ilha-do-mes';

export interface AoRedorDaCena {
  /** Posição do ponto clicável, em pixels do palco. */
  posicionar(id: IdDoLugar, x: number, y: number): void;
  /** O gesto rápido para o lado pediu o mês anterior (-1) ou o seguinte (1). */
  deslizar(direcao: -1 | 1): void;
  /** A cena parou neste aparelho. */
  falhou(): void;
}

/** O que a tela precisa da cena. O Three.js só entra no bundle carregado por `CRIAR_MOTOR`. */
export interface MotorDaIlha {
  mostrar(dados: DadosDaIlha, direcao: -1 | 0 | 1): void;
  selecionar(id: IdDoLugar | null): void;
  pausar(pausado: boolean): void;
  destruir(): void;
}

export type CriarMotor = (
  canvas: HTMLCanvasElement,
  palco: HTMLElement,
  redor: AoRedorDaCena,
) => Promise<MotorDaIlha>;

export const CRIAR_MOTOR = new InjectionToken<CriarMotor>('CRIAR_MOTOR', {
  providedIn: 'root',
  factory: () => async (canvas, palco, redor) => {
    const { CenaDaIlha } = await import('./cena/cena-da-ilha');
    return new CenaDaIlha(canvas, palco, redor);
  },
});
