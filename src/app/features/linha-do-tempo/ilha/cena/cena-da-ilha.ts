import * as THREE from 'three';
import { DadosDaIlha, IdDoLugar } from '../../dominio/ilha-do-mes';
import { AoRedorDaCena, MotorDaIlha } from '../motor-da-ilha';
import { ALTURA_DA_ILHA, Diorama, ESCALA } from './diorama';
import { Ave, Oficina } from './modelos';

const SALTO = 12.4;
const DURACAO_DA_TROCA = 1050;
const QUADROS_MINIMOS = 34;
/** Abaixo disso a aba está em segundo plano, não lenta. */
const QUADROS_EM_SEGUNDO_PLANO = 5;
const ALTURA_RELATIVA = 0.62;
const AFASTAMENTO_RELATIVO = 0.78;

function ceu(): THREE.Scene {
  const cena = new THREE.Scene();
  cena.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(10, 24, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        vertexShader:
          'varying vec3 v; void main(){ v = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader:
          'varying vec3 v; void main(){ float h = normalize(v).y; vec3 c = mix(vec3(.55,.62,.6), vec3(.82,.93,1.), smoothstep(-.1,.6,h)); c += vec3(1.,.9,.72) * pow(max(dot(normalize(v), normalize(vec3(-6.,11.,6.))),0.), 24.) * 2.5; gl_FragColor = vec4(c,1.); }',
      }),
    ),
  );
  return cena;
}

function texturaDeFumaca(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  if (x) {
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(c);
}

interface Troca {
  readonly inicio: number;
  readonly direcao: number;
}

interface Arraste {
  readonly x: number;
  readonly t: number;
  readonly giro: number;
  ultimoX: number;
  ultimoT: number;
  velocidade: number;
}

/** A cena inteira. Não conhece Angular: recebe dados e devolve posições e gestos. */
export class CenaDaIlha implements MotorDaIlha {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly cena = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(26, 1, 0.1, 120);
  private readonly sol = new THREE.DirectionalLight(0xfff0d6, 2.7);
  private readonly tempo: THREE.IUniform<number> = { value: 0 };
  private readonly qualidadeUniforme: THREE.IUniform<number>;
  private readonly oficina: Oficina;
  private readonly celular = Math.min(innerWidth, innerHeight) < 700;
  private readonly reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly texFumaca = texturaDeFumaca();
  private readonly barco: THREE.Group;
  private readonly aves: Ave[];
  private readonly nuvens: { malha: THREE.Mesh; x: number }[];
  private readonly observador: ResizeObserver;
  private readonly foco = new THREE.Vector3(0, 0.1, 0);
  private readonly focoAlvo = new THREE.Vector3();
  private readonly focoBase = new THREE.Vector3(0, 0.1, 0);
  private readonly v1 = new THREE.Vector3();
  private readonly v2 = new THREE.Vector3();

  private atual: Diorama | null = null;
  private saindo: Diorama | null = null;
  private troca: Troca | null = null;
  private selecionado: IdDoLugar | null = null;
  private giro = -0.3;
  private giroAlvo = -0.3;
  private zoom = 1;
  private distancia = 21;
  private pausado = false;
  private destruido = false;
  private quadro = 0;
  private ultimoFps = performance.now();
  private anterior = performance.now();
  private quadrosBaixos = 0;
  private qualidade: number;
  private sombraSuja = 3;
  private arraste: Arraste | null = null;
  private arrasteX = 0;
  private arrasteAtual = 0;
  private paralaxeX = 0;
  private paralaxeY = 0;
  private paralaxeAtualX = 0;
  private paralaxeAtualY = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly palco: HTMLElement,
    private readonly redor: AoRedorDaCena,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.qualidade = this.celular ? 1 : 2;
    this.qualidadeUniforme = { value: this.qualidade };
    this.oficina = new Oficina(this.tempo);
    this.configurarLuz();
    this.barco = this.oficina.barco();
    this.barco.scale.setScalar(ESCALA);
    this.cena.add(this.barco);
    this.aves = [this.oficina.ave(), this.oficina.ave(), this.oficina.ave()];
    this.aves.forEach((ave) => this.cena.add(ave));
    this.nuvens = this.criarNuvens();
    this.observador = new ResizeObserver(() => this.dimensionar());
    this.observador.observe(palco);
    this.aplicarQualidade();
    canvas.addEventListener('pointerdown', this.aoApertar);
    canvas.addEventListener('pointermove', this.aoMover);
    canvas.addEventListener('pointerup', this.aoSoltar);
    canvas.addEventListener('pointercancel', this.aoCancelar);
    canvas.addEventListener('pointerleave', this.aoSair);
    canvas.addEventListener('webglcontextlost', this.aoPerderContexto);
    requestAnimationFrame(this.laco);
  }

  private configurarLuz(): void {
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.cena.environment = pmrem.fromScene(ceu(), 0.03).texture;
    pmrem.dispose();
    const tamanho = this.celular ? 1024 : 2048;
    this.sol.position.set(-6, 11, 6).normalize().multiplyScalar(18);
    this.sol.castShadow = true;
    this.sol.shadow.mapSize.set(tamanho, tamanho);
    this.sol.shadow.bias = -0.0006;
    this.sol.shadow.normalBias = 0.02;
    Object.assign(this.sol.shadow.camera, {
      left: -7,
      right: 7,
      top: 7,
      bottom: -7,
      near: 1,
      far: 40,
    });
    this.sol.shadow.camera.updateProjectionMatrix();
    this.cena.add(this.sol);
    this.cena.add(new THREE.HemisphereLight(0xdcefff, 0x6b7f6a, 0.55));
  }

  private criarNuvens(): { malha: THREE.Mesh; x: number }[] {
    return [
      [-5.8, 3.3, -5.5, 1.2],
      [5.5, 3.9, -6.5, 1.5],
      [0.8, 4.4, -8.5, 1.1],
    ].map(([x, y, z, escala], i) => {
      const malha = this.oficina.nuvem(i);
      malha.position.set(x, y, z);
      malha.scale.setScalar(escala);
      malha.renderOrder = 3;
      this.cena.add(malha);
      return { malha, x };
    });
  }

  mostrar(dados: DadosDaIlha, direcao: -1 | 0 | 1): void {
    const velho = this.atual;
    if (this.saindo) {
      this.saindo.destruir();
      this.saindo = null;
    }
    const novo = new Diorama(
      this.oficina,
      dados,
      this.tempo,
      this.qualidadeUniforme,
      this.celular,
      this.reduzido,
      this.texFumaca,
    );
    novo.nivel = velho ? velho.nivel : 0;
    novo.velocidade = velho ? velho.velocidade : 0;
    this.cena.add(novo.grupo);
    this.atual = novo;
    this.sombraSuja = 3;
    if (!velho) {
      return;
    }
    if (direcao === 0 || this.reduzido) {
      novo.entradas = [];
      velho.destruir();
      this.troca = null;
      return;
    }
    this.saindo = velho;
    this.troca = { inicio: performance.now(), direcao };
    novo.grupo.position.x = SALTO * direcao;
  }

  selecionar(id: IdDoLugar | null): void {
    this.selecionado = id;
  }

  pausar(pausado: boolean): void {
    this.pausado = pausado;
    if (!pausado) {
      this.dimensionar();
    }
  }

  destruir(): void {
    this.destruido = true;
    this.observador.disconnect();
    this.canvas.removeEventListener('pointerdown', this.aoApertar);
    this.canvas.removeEventListener('pointermove', this.aoMover);
    this.canvas.removeEventListener('pointerup', this.aoSoltar);
    this.canvas.removeEventListener('pointercancel', this.aoCancelar);
    this.canvas.removeEventListener('pointerleave', this.aoSair);
    this.canvas.removeEventListener('webglcontextlost', this.aoPerderContexto);
    this.saindo?.destruir();
    this.atual?.destruir();
    this.texFumaca.dispose();
    this.renderer.dispose();
  }

  private aplicarQualidade(): void {
    const dpr = devicePixelRatio || 1;
    const limite = [1, 1.5, 2][this.qualidade];
    this.renderer.setPixelRatio(Math.min(dpr, limite));
    this.renderer.shadowMap.enabled = this.qualidade > 0;
    this.sol.castShadow = this.qualidade > 0;
    this.qualidadeUniforme.value = this.qualidade;
    this.dimensionar();
  }

  private dimensionar(): void {
    const largura = this.palco.clientWidth;
    const altura = this.palco.clientHeight;
    if (!largura || !altura) {
      return;
    }
    this.renderer.setSize(largura, altura, false);
    this.camera.aspect = largura / altura;
    this.distancia = 21 * Math.max(1, 1.2 / this.camera.aspect);
    this.camera.updateProjectionMatrix();
    this.nuvens.forEach(({ malha }) => (malha.visible = this.camera.aspect > 1.1));
    this.sombraSuja = 3;
  }

  private readonly laco = (agora: number): void => {
    if (this.destruido) {
      return;
    }
    requestAnimationFrame(this.laco);
    const dt = Math.min(0.1, (agora - this.anterior) / 1000);
    this.anterior = agora;
    const atual = this.atual;
    if (this.pausado || document.hidden || !atual) {
      return;
    }
    const tempo = agora / 1000;
    if (!this.reduzido) {
      this.tempo.value = tempo;
    }
    this.avancarGiro(dt);
    atual.avancarMare(dt);
    atual.grupo.rotation.y = this.giro;
    atual.aplicarNivel(tempo);
    this.animarEntrada(atual, agora);
    const curva = this.avancarTroca(atual, agora, dt, tempo);
    this.moverBarco(atual, agora, curva, tempo);
    this.animarCeu(tempo);
    this.moverCamera(atual, dt, curva, tempo);
    this.posicionarPontos(atual);
    if (this.sombraSuja > 0 && this.qualidade > 0) {
      this.renderer.shadowMap.needsUpdate = true;
      this.sombraSuja--;
    }
    this.renderer.render(this.cena, this.camera);
    this.medir(agora, atual);
  };

  private avancarGiro(dt: number): void {
    const antes = this.giro;
    this.giro += (this.giroAlvo - this.giro) * (1 - Math.exp(-dt * 7));
    if (Math.abs(this.giro - antes) > 0.0004) {
      this.sombraSuja = 1;
    }
  }

  private animarEntrada(d: Diorama, agora: number): void {
    if (!d.entradas.length) {
      return;
    }
    const decorrido = (agora - d.nascimento) / 1000;
    let pendente = false;
    d.entradas.forEach(({ objeto, atraso }) => {
      const t = (decorrido - 0.1 - atraso) / 0.55;
      if (this.reduzido || t >= 1) {
        objeto.scale.setScalar(ESCALA);
        return;
      }
      pendente = true;
      const u = t - 1;
      const salto = 1 + 2.45 * u * u * u + 1.45 * u * u;
      objeto.scale.setScalar(t <= 0 ? 0.001 : Math.max(0.001, salto * ESCALA));
    });
    if (pendente) {
      this.sombraSuja = 2;
    } else {
      d.entradas = [];
    }
  }

  private avancarTroca(atual: Diorama, agora: number, dt: number, tempo: number): number {
    const troca = this.troca;
    if (!troca) {
      this.arrasteAtual += (this.arrasteX - this.arrasteAtual) * (1 - Math.exp(-dt * 16));
      atual.grupo.position.x = this.arrasteAtual;
      return 0;
    }
    const t = Math.min(1, (agora - troca.inicio) / DURACAO_DA_TROCA);
    const f = t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;
    atual.grupo.position.x = SALTO * troca.direcao * (1 - f);
    if (this.saindo) {
      this.saindo.grupo.position.x = -SALTO * troca.direcao * f;
      this.saindo.grupo.rotation.y = this.giro;
      this.saindo.aplicarNivel(tempo);
    }
    this.sombraSuja = 1;
    if (t >= 1) {
      this.troca = null;
      this.saindo?.destruir();
      this.saindo = null;
    }
    return Math.sin(f * Math.PI);
  }

  /** O barco segue o trapiche e, na troca de mês, atravessa de uma ilha à outra. */
  private moverBarco(atual: Diorama, agora: number, curva: number, tempo: number): void {
    atual.grupo.updateMatrixWorld();
    atual.ancoraBarco.getWorldPosition(this.v2);
    const rumo = this.giro + Math.PI / 2 - atual.anguloDoPier;
    if (this.troca && this.saindo) {
      this.saindo.grupo.updateMatrixWorld();
      this.saindo.ancoraBarco.getWorldPosition(this.v1);
      const t = Math.min(1, (agora - this.troca.inicio) / DURACAO_DA_TROCA);
      const f = t * t * (3 - 2 * t);
      this.barco.position.lerpVectors(this.v1, this.v2, f);
      this.barco.position.y =
        ALTURA_DA_ILHA * (this.saindo.nivel * (1 - f) + atual.nivel * f) + 0.03;
      this.barco.rotation.y = rumo + curva * this.troca.direcao * 1.1;
    } else {
      const balanco = this.reduzido ? 0 : Math.sin(tempo * 1.25) * 0.012;
      this.barco.position.copy(this.v2);
      this.barco.position.y = ALTURA_DA_ILHA * atual.nivel + 0.03 + balanco;
      this.barco.rotation.y = rumo;
    }
    this.barco.rotation.x = this.reduzido ? 0 : Math.sin(tempo * 1.05) * 0.035;
    this.barco.rotation.z = this.reduzido ? 0 : Math.cos(tempo * 0.8) * 0.05;
  }

  private animarCeu(tempo: number): void {
    if (this.reduzido) {
      return;
    }
    this.aves.forEach((ave, i) => {
      const t = tempo * 0.26 + i * 0.5;
      const r = 3.4 + i * 0.35;
      ave.position.set(
        Math.cos(t) * r,
        2.35 + i * 0.22 + Math.sin(t * 2.3) * 0.12,
        Math.sin(t) * r,
      );
      ave.rotation.y = -t;
      const batida = Math.sin(tempo * (5.5 + i * 0.5) + i) * 0.5 + 0.1;
      ave.asaDireita.rotation.z = batida;
      ave.asaEsquerda.rotation.z = -batida;
    });
    this.nuvens.forEach(({ malha, x }, i) => {
      malha.position.x = x + Math.sin(tempo * 0.035 + i * 2) * 1.5;
    });
  }

  /** Aproxima do lugar escolhido e reage de leve ao ponteiro. */
  private moverCamera(atual: Diorama, dt: number, curva: number, tempo: number): void {
    const escolhido = this.selecionado ? atual.pontos.get(this.selecionado) : undefined;
    if (escolhido) {
      escolhido.getWorldPosition(this.focoAlvo);
      this.focoAlvo.lerp(this.focoBase, 0.3);
    } else {
      this.focoAlvo.copy(this.focoBase);
    }
    const suave = 1 - Math.exp(-dt * 3.6);
    this.foco.lerp(this.focoAlvo, suave);
    this.zoom += ((escolhido ? 0.5 : 1) - this.zoom) * suave;
    const lento = 1 - Math.exp(-dt * 3);
    this.paralaxeAtualX += (this.paralaxeX - this.paralaxeAtualX) * lento;
    this.paralaxeAtualY += (this.paralaxeY - this.paralaxeAtualY) * lento;
    const dist = this.distancia * this.zoom * (1 + curva * 0.12);
    const respiro = this.reduzido ? 0 : Math.sin(tempo * 0.22) * 0.1;
    this.camera.position.set(
      this.foco.x + this.paralaxeAtualX * 1.3 + respiro,
      this.foco.y + dist * ALTURA_RELATIVA + this.paralaxeAtualY * 0.8,
      this.foco.z + dist * AFASTAMENTO_RELATIVO,
    );
    this.camera.lookAt(this.foco);
  }

  private posicionarPontos(atual: Diorama): void {
    const largura = this.palco.clientWidth;
    const altura = this.palco.clientHeight;
    atual.grupo.updateMatrixWorld();
    atual.pontos.forEach((ancora, id) => {
      ancora.getWorldPosition(this.v1);
      this.v1.project(this.camera);
      this.redor.posicionar(
        id,
        (this.v1.x * 0.5 + 0.5) * largura,
        (-this.v1.y * 0.5 + 0.5) * altura,
      );
    });
  }

  private medir(agora: number, atual: Diorama): void {
    this.quadro++;
    if (agora - this.ultimoFps <= 1000) {
      return;
    }
    const fps = (this.quadro * 1000) / (agora - this.ultimoFps);
    this.quadro = 0;
    this.ultimoFps = agora;
    atual.feixe.visible =
      atual.pontos.has('cartao') && matchMedia('(prefers-color-scheme: dark)').matches;
    const lento = fps >= QUADROS_EM_SEGUNDO_PLANO && fps < QUADROS_MINIMOS && this.qualidade > 0;
    this.quadrosBaixos = lento ? this.quadrosBaixos + 1 : 0;
    if (this.quadrosBaixos >= 2) {
      this.qualidade--;
      this.quadrosBaixos = 0;
      this.aplicarQualidade();
    }
    this.palco.dataset['quadros'] = String(Math.round(fps));
    this.palco.dataset['qualidade'] = String(this.qualidade);
  }

  private readonly aoApertar = (e: PointerEvent): void => {
    const agora = performance.now();
    this.arraste = {
      x: e.clientX,
      t: agora,
      giro: this.giroAlvo,
      ultimoX: e.clientX,
      ultimoT: agora,
      velocidade: 0,
    };
    this.canvas.setPointerCapture(e.pointerId);
  };

  private readonly aoMover = (e: PointerEvent): void => {
    const arraste = this.arraste;
    if (!arraste) {
      if (e.pointerType === 'mouse') {
        const r = this.canvas.getBoundingClientRect();
        this.paralaxeX = ((e.clientX - r.left) / r.width - 0.5) * 2;
        this.paralaxeY = ((e.clientY - r.top) / r.height - 0.5) * -2;
      }
      return;
    }
    const agora = performance.now();
    const dx = e.clientX - arraste.x;
    this.giroAlvo = arraste.giro + dx * 0.006;
    this.arrasteX = Math.max(-0.5, Math.min(0.5, dx * 0.0016));
    arraste.velocidade = (e.clientX - arraste.ultimoX) / Math.max(1, agora - arraste.ultimoT);
    arraste.ultimoX = e.clientX;
    arraste.ultimoT = agora;
  };

  private readonly aoSoltar = (e: PointerEvent): void => {
    const arraste = this.arraste;
    if (!arraste) {
      return;
    }
    const dx = e.clientX - arraste.x;
    const dt = performance.now() - arraste.t;
    this.arrasteX = 0;
    this.arraste = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) / dt > 0.55) {
      this.giroAlvo = arraste.giro;
      this.redor.deslizar(dx < 0 ? 1 : -1);
    } else {
      this.giroAlvo += arraste.velocidade * 0.22;
    }
  };

  private readonly aoCancelar = (): void => {
    this.arraste = null;
    this.arrasteX = 0;
  };

  private readonly aoSair = (): void => {
    this.paralaxeX = 0;
    this.paralaxeY = 0;
  };

  private readonly aoPerderContexto = (e: Event): void => {
    e.preventDefault();
    this.pausado = true;
    this.redor.falhou();
  };
}
