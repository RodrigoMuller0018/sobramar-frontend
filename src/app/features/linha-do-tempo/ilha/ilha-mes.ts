import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ValoresVisiveisService } from '../../../core/preferencias/valores-visiveis.service';
import { emReais } from '../components/valor';
import { DadosDaIlha, IdDoLugar } from '../dominio/ilha-do-mes';
import { CRIAR_MOTOR, MotorDaIlha } from './motor-da-ilha';

const CHAVE_SEM_3D = 'sobramar.sem-3d';

function prefereSem3d(): boolean {
  try {
    return localStorage.getItem(CHAVE_SEM_3D) === 'true';
  } catch {
    return false;
  }
}

/**
 * A cena é um reforço: os números ficam em texto, fora dela. O canvas é escondido dos leitores de
 * tela, e cada lugar da ilha é um botão de verdade, com o valor no nome.
 */
@Component({
  selector: 'app-ilha-mes',
  templateUrl: './ilha-mes.html',
  styleUrl: './ilha-mes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IlhaMes {
  private readonly criarMotor = inject(CRIAR_MOTOR);
  private readonly ocultos = inject(ValoresVisiveisService).ocultos;
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('cena');
  private readonly palco = viewChild.required<ElementRef<HTMLElement>>('palco');
  private readonly camada = viewChild.required<ElementRef<HTMLElement>>('camada');
  private readonly ficha = viewChild<ElementRef<HTMLElement>>('ficha');
  private readonly motor = signal<MotorDaIlha | null>(null);
  private ultimaCompetencia: string | null = null;

  readonly dados = input.required<DadosDaIlha>();
  readonly selecionado = input<IdDoLugar | null>(null);
  readonly selecionar = output<IdDoLugar | null>();
  readonly deslizar = output<-1 | 1>();

  protected readonly usar3d = signal(!prefereSem3d());
  protected readonly falhou = signal(false);
  protected readonly semCena = computed(() => !this.usar3d() || this.falhou());
  protected readonly pontos = computed(() =>
    this.dados().lugares.map((lugar) => ({
      ...lugar,
      rotulo: `${lugar.nome}: ${this.ocultos() ? 'valor oculto' : emReais(lugar.totalCentavos)}`,
    })),
  );
  protected readonly fichaAtual = computed(() =>
    this.pontos().find((ponto) => ponto.id === this.selecionado()),
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => void this.iniciar());
    effect(() => {
      const motor = this.motor();
      const dados = this.dados();
      if (motor) {
        motor.mostrar(dados, this.direcaoPara(dados.competencia));
      }
    });
    effect(() => this.motor()?.selecionar(this.selecionado()));
    effect(() => this.motor()?.pausar(!this.usar3d()));
    destroyRef.onDestroy(() => this.motor()?.destruir());
  }

  protected alternar(): void {
    const novo = !this.usar3d();
    this.usar3d.set(novo);
    try {
      localStorage.setItem(CHAVE_SEM_3D, String(!novo));
    } catch {
      // Navegador sem armazenamento: a preferência vale só nesta visita.
    }
    if (novo && !this.motor()) {
      void this.iniciar();
    }
  }

  protected tocar(id: IdDoLugar): void {
    this.selecionar.emit(this.selecionado() === id ? null : id);
  }

  private async iniciar(): Promise<void> {
    if (!this.usar3d()) {
      return;
    }
    try {
      const motor = await this.criarMotor(this.canvas().nativeElement, this.palco().nativeElement, {
        posicionar: (id, x, y) => this.posicionar(id, x, y),
        deslizar: (direcao) => this.deslizar.emit(direcao),
        falhou: () => this.falhou.set(true),
      });
      this.motor.set(motor);
    } catch {
      this.falhou.set(true);
    }
  }

  private direcaoPara(competencia: string): -1 | 0 | 1 {
    const anterior = this.ultimaCompetencia;
    this.ultimaCompetencia = competencia;
    if (anterior === null || anterior === competencia) {
      return 0;
    }
    return competencia > anterior ? 1 : -1;
  }

  /** Roda a cada quadro, por isso escreve direto no DOM, sem passar pela detecção de mudanças. */
  private posicionar(id: IdDoLugar, x: number, y: number): void {
    const botao = this.camada().nativeElement.querySelector<HTMLElement>(`[data-lugar="${id}"]`);
    if (botao) {
      botao.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    }
    if (id === this.selecionado()) {
      const ficha = this.ficha()?.nativeElement;
      if (ficha) {
        ficha.style.transform = `translate(calc(${x.toFixed(1)}px - 50%),calc(${y.toFixed(1)}px - 3.25rem))`;
      }
    }
  }
}
