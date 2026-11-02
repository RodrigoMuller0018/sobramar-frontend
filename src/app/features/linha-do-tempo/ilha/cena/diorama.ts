import * as THREE from 'three';
import { DadosDaIlha, IdDoLugar, nivelDaMare } from '../../dominio/ilha-do-mes';
import { AGUA_FRAGMENT, AGUA_VERTEX } from './agua';
import { Oficina } from './modelos';

export const ALTURA_DA_ILHA = 1.25;
export const RAIO_MESA = 5.5;
export const ESCALA = 1.32;
const RAIO_MAXIMO = 3.15;
const RAIO_MINIMO = 0.6;
const RAIO_MAXIMO_DO_VALE = 1.05;
const FREQUENCIAS = [2, 3, 5, 7];
const ANGULO = {
  casa: 5.05,
  farol: 1.5,
  poste: 4.2,
  escola: 2.85,
  barraca: 0.35,
  pier: 0.92,
  boias: [3.55, 4.5, 2.45, 5.75, 3.05, 0.1],
  vale: -0.55,
};

const FAIXAS = {
  fundo: new THREE.Color(0xb9a875),
  areia: new THREE.Color(0xeeddaa),
  areiaMolhada: new THREE.Color(0xcbb987),
  grama1: new THREE.Color(0x86a95c),
  grama2: new THREE.Color(0x6f9a4e),
  grama3: new THREE.Color(0x9db569),
  topo: new THREE.Color(0xa9a488),
};

interface Forma {
  readonly raio: (t: number) => number;
  readonly amplitudes: readonly number[];
  readonly fases: readonly number[];
  readonly normalizacao: number;
}

function sementeDa(competencia: string): number {
  const [ano, mes] = competencia.split('-').map(Number);
  return ano * 12 + mes;
}

/** O contorno é normalizado para área π: com isso, a área da ilha depende só do raio. */
function formaDaIlha(semente: number): Forma {
  let s = semente * 9301 + 49297;
  const aleatorio = (): number => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const amplitudes = FREQUENCIAS.map((_, i) => (0.11 / (i + 1)) * (0.5 + aleatorio()));
  const fases = FREQUENCIAS.map(() => aleatorio() * 6.283);
  const bruto = (t: number): number =>
    1 + FREQUENCIAS.reduce((v, f, i) => v + amplitudes[i] * Math.sin(f * t + fases[i]), 0);
  let area = 0;
  for (let i = 0; i < 720; i++) {
    area += 0.5 * bruto((i / 720) * 2 * Math.PI) ** 2 * ((2 * Math.PI) / 720);
  }
  const normalizacao = Math.sqrt(Math.PI / area);
  return { raio: (t) => normalizacao * bruto(t), amplitudes, fases, normalizacao };
}

function ruido2(x: number, y: number): number {
  const h = (a: number, b: number): number => {
    const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const i = Math.floor(x);
  const j = Math.floor(y);
  let f = x - i;
  let g = y - j;
  f = f * f * (3 - 2 * f);
  g = g * g * (3 - 2 * g);
  return (
    (h(i, j) * (1 - f) + h(i + 1, j) * f) * (1 - g) +
    (h(i, j + 1) * (1 - f) + h(i + 1, j + 1) * f) * g
  );
}

function corDoTerreno(c: THREE.Color, x: number, y: number, z: number, semente: number): void {
  const n1 = ruido2(x * 2.3 + semente, z * 2.3);
  const n2 = ruido2(x * 7.1, z * 7.1 + semente);
  if (y < 0) {
    c.copy(FAIXAS.fundo).lerp(FAIXAS.areiaMolhada, 0.5 * n1);
    return;
  }
  const rel = y / ALTURA_DA_ILHA;
  c.copy(FAIXAS.grama2)
    .lerp(FAIXAS.grama1, n1)
    .lerp(FAIXAS.grama3, n2 * 0.55);
  c.lerp(FAIXAS.areia, 1 - THREE.MathUtils.smoothstep(rel + (n1 - 0.5) * 0.05, 0.05, 0.13));
  c.lerp(FAIXAS.topo, THREE.MathUtils.smoothstep(rel + (n2 - 0.5) * 0.12, 0.84, 0.97) * 0.8);
}

function altura(rho: number): number {
  return Math.max(-0.9, ALTURA_DA_ILHA * (1 - rho * rho));
}

/** Em toda parte a altura é H(1 - ρ²). O detalhe vem só da cor, para não mudar a área seca. */
function geometriaDoTerreno(
  raioEm: (t: number) => number,
  semente: number,
  simples: boolean,
): THREE.BufferGeometry {
  const NR = simples ? 34 : 52;
  const NA = simples ? 128 : 208;
  const rhoMax = Math.sqrt(1 + 0.9 / ALTURA_DA_ILHA);
  const pos: number[] = [];
  const cor: number[] = [];
  const c = new THREE.Color();
  for (let j = 0; j <= NR; j++) {
    const rho = (j / NR) * rhoMax;
    for (let i = 0; i < NA; i++) {
      const t = (i / NA) * Math.PI * 2;
      const x = Math.cos(t) * raioEm(t) * rho;
      const z = Math.sin(t) * raioEm(t) * rho;
      const y = altura(rho);
      pos.push(x, y, z);
      corDoTerreno(c, x, y, z, semente);
      cor.push(c.r, c.g, c.b);
    }
  }
  const indices: number[] = [];
  for (let j = 0; j < NR; j++) {
    for (let i = 0; i < NA; i++) {
      const a = j * NA + i;
      const b = j * NA + ((i + 1) % NA);
      const d = (j + 1) * NA + i;
      const e = (j + 1) * NA + ((i + 1) % NA);
      indices.push(a, d, b, b, d, e);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function materialDoTerreno(nivelY: THREE.IUniform<number>): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    envMapIntensity: 0.45,
    side: THREE.DoubleSide,
  });
  material.onBeforeCompile = (s) => {
    s.uniforms['uNivelY'] = nivelY;
    s.uniforms['uH'] = { value: ALTURA_DA_ILHA };
    s.vertexShader =
      'varying float vAlt;\n' +
      s.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvAlt = position.y;',
      );
    s.fragmentShader =
      'varying float vAlt; uniform float uNivelY, uH;\n' +
      s.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float molhado = 1. - smoothstep(.0, .055, vAlt - uNivelY);
         diffuseColor.rgb *= mix(1., .68, molhado);
         float qp = fract(max(vAlt, 0.) / (uH * .25) + .5);
         float isolinha = (1. - smoothstep(.0, .022, abs(qp - .5))) * step(.02, vAlt);
         diffuseColor.rgb *= 1. - isolinha * .2;`,
      );
  };
  return material;
}

function etiqueta(texto: string): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 192;
  c.height = 84;
  const x = c.getContext('2d');
  if (x) {
    x.fillStyle = 'rgba(11,26,38,.86)';
    x.beginPath();
    x.roundRect(2, 2, 188, 80, 16);
    x.fill();
    x.fillStyle = '#ffffff';
    x.font = '500 46px "IBM Plex Mono", monospace';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(texto, 96, 44);
  }
  const mapa = new THREE.CanvasTexture(c);
  mapa.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: mapa, depthWrite: false, toneMapped: false }),
  );
  s.scale.set(0.34, 0.15, 1);
  s.position.y = 0.42;
  return s;
}

interface Entrada {
  readonly objeto: THREE.Object3D;
  readonly atraso: number;
}

interface Fumaca {
  readonly sprite: THREE.Sprite;
  readonly fase: number;
  readonly base: THREE.Vector3;
}

/** Tudo de um mês: terreno, água, construções, boias e o vale. */
export class Diorama {
  readonly grupo = new THREE.Group();
  readonly pontos = new Map<IdDoLugar, THREE.Object3D>();
  readonly ancoraBarco = new THREE.Object3D();
  readonly anguloDoPier = ANGULO.pier;
  readonly nascimento = performance.now();
  readonly feixe: THREE.Mesh;
  nivel = 0;
  velocidade = 0;
  entradas: Entrada[] = [];

  private readonly formaDoMes: Forma;
  private readonly raio: number;
  private readonly corpo: THREE.Mesh;
  private readonly aguaY: THREE.IUniform<number> = { value: 0 };
  private readonly nivelY: THREE.IUniform<number> = { value: 0 };
  private readonly flutuantes: THREE.Object3D[] = [];
  private readonly trapiche: THREE.Group;
  private readonly fumaca: Fumaca[] = [];
  private atualizarPonte: ((y: number) => void) | null = null;
  private ultimaPonte = -9;

  constructor(
    private readonly oficina: Oficina,
    private readonly dados: DadosDaIlha,
    tempo: THREE.IUniform<number>,
    qualidade: THREE.IUniform<number>,
    private readonly simples: boolean,
    private readonly reduzido: boolean,
    private readonly texFumaca: THREE.Texture,
  ) {
    const semente = sementeDa(dados.competencia);
    this.formaDoMes = formaDaIlha(semente);
    this.raio = this.calcularRaio();
    this.grupo.add(oficina.base());

    this.corpo = new THREE.Mesh(
      new THREE.CylinderGeometry(RAIO_MESA, RAIO_MESA, 1, 96, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x1c6b8c,
        roughness: 0.25,
        transparent: true,
        opacity: 0.6,
        envMapIntensity: 1.4,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.corpo.renderOrder = 1;
    this.grupo.add(this.corpo);
    this.grupo.add(this.marcasDaEscala());

    const terreno = new THREE.Mesh(
      geometriaDoTerreno(this.raioEm, semente, simples),
      materialDoTerreno(this.nivelY),
    );
    terreno.castShadow = true;
    terreno.receiveShadow = true;
    this.grupo.add(terreno);

    const { rv, cx, cz } = this.posicaoDoVale();
    this.adicionarAgua(tempo, qualidade, rv, cx, cz);

    const casa = oficina.casa();
    this.colocar(casa, 'contas', ANGULO.casa, 0.28, 0.25, 0.92);
    const farol = oficina.farol();
    if (this.tem('cartao')) {
      this.colocar(farol, 'cartao', ANGULO.farol, 0.5, 0, 1.42);
    } else {
      farol.visible = false;
    }
    this.feixe = oficina.feixe();
    this.feixe.position.copy(this.noChao(ANGULO.farol, 0.5));
    this.feixe.position.y += 1.03 * ESCALA;
    this.feixe.visible = false;
    this.grupo.add(this.feixe);
    if (this.tem('estimadas')) {
      this.colocar(oficina.poste(true), 'estimadas', ANGULO.poste, 0.56, 0.6, 0.86);
    }
    if (this.tem('boletos')) {
      this.colocar(oficina.escola(), 'boletos', ANGULO.escola, 0.46, 0.9, 1);
    }
    if (this.tem('avulsos')) {
      this.colocar(oficina.barraca(), 'avulsos', ANGULO.barraca, 0.5, -0.35, 0.56);
    }

    this.adicionarVegetacao(semente);
    dados.boias.forEach((boia, i) => {
      const t = ANGULO.boias[i];
      const R = this.raioEm(t) * 1.17;
      const objeto = oficina.boia();
      objeto.scale.setScalar(1.25);
      objeto.add(etiqueta(boia.rotulo));
      this.boiar(objeto, Math.cos(t) * R, Math.sin(t) * R);
    });
    if (rv > 0) {
      this.adicionarVale(rv, cx, cz);
    }

    this.trapiche = oficina.trapiche();
    this.trapiche.scale.setScalar(ESCALA);
    this.trapiche.rotation.y = Math.PI / 2 - ANGULO.pier;
    this.ancoraBarco.position.set(0.3, 0, 0.56);
    this.trapiche.add(this.ancoraBarco);
    this.grupo.add(this.trapiche);
    if (this.tem('receitas')) {
      const ancora = new THREE.Object3D();
      ancora.position.set(0, 0.5, 0.5);
      this.trapiche.add(ancora);
      this.pontos.set('receitas', ancora);
    }
    if (!reduzido) {
      this.adicionarFumaca(casa);
    }
  }

  private readonly raioEm = (t: number): number => this.formaDoMes.raio(t) * this.raio;

  private tem(id: IdDoLugar): boolean {
    return this.dados.lugares.some((lugar) => lugar.id === id);
  }

  private calcularRaio(): number {
    const { receitasCentavos, receitaDeReferenciaCentavos } = this.dados;
    if (receitasCentavos <= 0 || receitaDeReferenciaCentavos <= 0) {
      return RAIO_MINIMO;
    }
    return RAIO_MAXIMO * Math.sqrt(receitasCentavos / receitaDeReferenciaCentavos);
  }

  private posicaoDoVale(): { rv: number; cx: number; cz: number } {
    const { valeCentavos, receitaDeReferenciaCentavos } = this.dados;
    if (valeCentavos <= 0) {
      return { rv: 0, cx: 0, cz: 0 };
    }
    const proporcional =
      RAIO_MAXIMO * Math.sqrt(valeCentavos / Math.max(valeCentavos, receitaDeReferenciaCentavos));
    const rv = Math.min(RAIO_MAXIMO_DO_VALE, proporcional);
    const dist = RAIO_MESA - rv - 0.25;
    return { rv, cx: Math.cos(ANGULO.vale) * dist, cz: Math.sin(ANGULO.vale) * dist };
  }

  private marcasDaEscala(): THREE.InstancedMesh {
    const marcas = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.016, 1, 0.016),
      new THREE.MeshBasicMaterial({ color: 0xc9ad62, toneMapped: false }),
      72,
    );
    const molde = new THREE.Object3D();
    for (let i = 0; i < 72; i++) {
      const t = (i / 72) * Math.PI * 2;
      const grande = i % 6 === 0;
      molde.position.set(Math.cos(t) * 5.76, -1.06, Math.sin(t) * 5.76);
      molde.rotation.y = -t;
      molde.scale.set(grande ? 2 : 1, grande ? 0.13 : 0.07, 1);
      molde.updateMatrix();
      marcas.setMatrixAt(i, molde.matrix);
    }
    return marcas;
  }

  private adicionarAgua(
    tempo: THREE.IUniform<number>,
    qualidade: THREE.IUniform<number>,
    rv: number,
    cx: number,
    cz: number,
  ): void {
    const agua = new THREE.Mesh(
      new THREE.RingGeometry(0.001, RAIO_MESA, 96, 30).rotateX(-Math.PI / 2),
      new THREE.ShaderMaterial({
        vertexShader: AGUA_VERTEX,
        fragmentShader: AGUA_FRAGMENT,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uT: tempo,
          uQ: qualidade,
          uY: this.aguaY,
          uH: { value: ALTURA_DA_ILHA },
          uR: { value: this.raio * this.formaDoMes.normalizacao },
          uA: { value: new THREE.Vector4(...this.formaDoMes.amplitudes) },
          uP: { value: new THREE.Vector4(...this.formaDoMes.fases) },
          uIlhota: { value: new THREE.Vector3(cx, cz, rv * 0.93) },
          uSolDir: { value: new THREE.Vector3(-6, 11, 6).normalize() },
        },
      }),
    );
    agua.renderOrder = 2;
    this.grupo.add(agua);
  }

  private noChao(t: number, rho: number): THREE.Vector3 {
    const R = this.raioEm(t);
    return new THREE.Vector3(Math.cos(t) * R * rho, altura(rho), Math.sin(t) * R * rho);
  }

  private colocar(
    objeto: THREE.Object3D,
    id: IdDoLugar,
    t: number,
    rho: number,
    rotacao: number,
    alturaDoPonto: number,
  ): void {
    objeto.scale.setScalar(ESCALA);
    objeto.position.copy(this.noChao(t, rho));
    objeto.rotation.y = rotacao;
    this.grupo.add(objeto);
    this.entradas.push({ objeto, atraso: this.entradas.length * 0.07 });
    if (this.tem(id)) {
      const ancora = new THREE.Object3D();
      ancora.position.copy(objeto.position);
      ancora.position.y += alturaDoPonto * ESCALA;
      this.grupo.add(ancora);
      this.pontos.set(id, ancora);
    }
  }

  private adicionarVegetacao(semente: number): void {
    let s = semente * 7919;
    const aleatorio = (): number => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const reservados = [
      [ANGULO.casa, 0.28, 0.42],
      [ANGULO.farol, 0.5, 0.3],
      [ANGULO.poste, 0.56, 0.15],
      [ANGULO.escola, 0.46, 0.5],
      [ANGULO.barraca, 0.5, 0.3],
      [ANGULO.pier, 0.95, 0.3],
    ].map(([t, rho, raio]) => ({ ponto: this.noChao(t, rho), raio }));
    const livre = (v: THREE.Vector3): boolean =>
      reservados.every(({ ponto, raio }) => Math.hypot(ponto.x - v.x, ponto.z - v.z) > raio);
    const fator = this.raio / 2.57;
    const espalhar = (
      geo: THREE.BufferGeometry,
      qtd: number,
      faixa: [number, number],
      escala: [number, number],
      material: THREE.Material,
      sombra: boolean,
    ): void => {
      const total = Math.max(1, Math.round(qtd * fator));
      const inst = new THREE.InstancedMesh(geo, material, total);
      const d = new THREE.Object3D();
      const cor = new THREE.Color();
      let n = 0;
      for (let tentativa = 0; tentativa < total * 8 && n < total; tentativa++) {
        const v = this.noChao(
          aleatorio() * Math.PI * 2,
          faixa[0] + (faixa[1] - faixa[0]) * aleatorio(),
        );
        if (livre(v)) {
          d.position.copy(v);
          d.position.y -= 0.005;
          d.rotation.y = aleatorio() * 6.283;
          d.scale.setScalar(escala[0] + (escala[1] - escala[0]) * aleatorio());
          d.updateMatrix();
          inst.setMatrixAt(n, d.matrix);
          inst.setColorAt(n, cor.setHSL(0, 0, 0.82 + aleatorio() * 0.3));
          n++;
        }
      }
      inst.count = n;
      inst.castShadow = sombra;
      inst.receiveShadow = true;
      this.grupo.add(inst);
    };
    const { arvore, material } = this.oficina;
    espalhar(this.oficina.pinheiro(), 11, [0.2, 0.62], [1.05, 1.75], arvore, true);
    espalhar(this.oficina.copa(), 13, [0.4, 0.82], [0.95, 1.6], arvore, true);
    espalhar(this.oficina.palmeira(), 10, [0.86, 0.97], [1, 1.45], arvore, true);
    espalhar(this.oficina.rocha(), 16, [0.93, 1.08], [0.5, 1.5], material, true);
    espalhar(this.oficina.tufo(), this.simples ? 90 : 240, [0.15, 0.88], [0.8, 1.6], arvore, false);
    espalhar(this.oficina.flor(), this.simples ? 40 : 110, [0.25, 0.84], [0.8, 1.3], arvore, false);
  }

  private boiar(objeto: THREE.Object3D, x: number, z: number): void {
    objeto.position.set(x, 0, z);
    this.grupo.add(objeto);
    this.flutuantes.push(objeto);
  }

  private adicionarVale(rv: number, cx: number, cz: number): void {
    const ilhota = new THREE.Group();
    ilhota.add(this.oficina.ilhota(rv));
    const palmas = new THREE.InstancedMesh(this.oficina.palmeira(), this.oficina.arvore, 3);
    const d = new THREE.Object3D();
    [
      [0.15, 0.3, -0.1, 1.15],
      [-0.25, 0.22, 0.18, 0.9],
      [0.3, 0.14, 0.32, 0.75],
    ].forEach(([x, y, z, e], i) => {
      d.position.set(x, y - 0.02, z);
      d.rotation.y = i * 2;
      d.scale.setScalar(e);
      d.updateMatrix();
      palmas.setMatrixAt(i, d.matrix);
    });
    palmas.castShadow = true;
    ilhota.add(palmas);
    this.boiar(ilhota, cx, cz);
    const ancora = new THREE.Object3D();
    ancora.position.set(0, 0.85, 0);
    ilhota.add(ancora);
    this.pontos.set('vale', ancora);

    /* A ponte acompanha a ilhota, que sobe com a água. */
    const PRANCHAS = 18;
    const ponte = new THREE.InstancedMesh(this.oficina.prancha(), this.oficina.material, PRANCHAS);
    ponte.castShadow = true;
    this.grupo.add(ponte);
    const t = Math.atan2(cz, cx);
    const naIlhota = new THREE.Vector3(
      cx - Math.cos(t) * rv * 0.92,
      0,
      cz - Math.sin(t) * rv * 0.92,
    );
    const naCosta = this.noChao(t, 0.965);
    const molde = new THREE.Object3D();
    this.atualizarPonte = (y) => {
      const a = naIlhota.clone().setY(y + 0.05);
      const b = naCosta.clone().setY(Math.max(naCosta.y + 0.02, y) + 0.02);
      const meio = a.clone().add(b).multiplyScalar(0.5);
      meio.y = Math.max(a.y, b.y) + 0.18;
      const curva = new THREE.QuadraticBezierCurve3(a, meio, b);
      for (let i = 0; i < PRANCHAS; i++) {
        const u = i / (PRANCHAS - 1);
        molde.position.copy(curva.getPoint(u));
        molde.lookAt(molde.position.clone().add(curva.getTangent(u)));
        molde.updateMatrix();
        ponte.setMatrixAt(i, molde.matrix);
      }
      ponte.instanceMatrix.needsUpdate = true;
    };
  }

  private adicionarFumaca(casa: THREE.Object3D): void {
    const chamine = new THREE.Vector3(0.17, 0.8, -0.1)
      .multiplyScalar(ESCALA)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), casa.rotation.y)
      .add(casa.position);
    for (let i = 0; i < 6; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.texFumaca,
          transparent: true,
          depthWrite: false,
          opacity: 0,
        }),
      );
      sprite.position.copy(chamine);
      this.grupo.add(sprite);
      this.fumaca.push({ sprite, fase: i / 6, base: chamine });
    }
  }

  get nivelAlvo(): number {
    return nivelDaMare(this.dados.compromissosCentavos, this.dados.receitasCentavos);
  }

  /** A mola sobe com peso e assenta no valor exato. */
  avancarMare(dt: number): void {
    if (this.reduzido) {
      this.nivel = this.nivelAlvo;
      return;
    }
    this.velocidade += ((this.nivelAlvo - this.nivel) * 16 - this.velocidade * 6.6) * dt;
    this.nivel += this.velocidade * dt;
    if (Math.abs(this.nivelAlvo - this.nivel) < 0.0002 && Math.abs(this.velocidade) < 0.0005) {
      this.nivel = this.nivelAlvo;
      this.velocidade = 0;
    }
  }

  aplicarNivel(tempo: number): void {
    const y = ALTURA_DA_ILHA * this.nivel;
    this.corpo.scale.y = Math.max(0.01, y + 0.9);
    this.corpo.position.y = (y - 0.9) / 2;
    this.aguaY.value = y;
    this.nivelY.value = y;
    this.flutuantes.forEach((objeto, i) => this.flutuar(objeto, i, y, tempo));
    if (this.atualizarPonte && Math.abs(y - this.ultimaPonte) > 0.002) {
      this.atualizarPonte(y);
      this.ultimaPonte = y;
    }
    const costa = this.raioEm(ANGULO.pier) * Math.max(0.42, Math.sqrt(Math.max(0, 1 - this.nivel)));
    this.trapiche.position.set(
      Math.cos(ANGULO.pier) * (costa - 0.04),
      y + 0.015,
      Math.sin(ANGULO.pier) * (costa - 0.04),
    );
    this.fumaca.forEach(({ sprite, fase, base }) => {
      const u = (tempo * 0.16 + fase) % 1;
      sprite.position.set(
        base.x + Math.sin(u * 5 + fase * 6) * 0.05 + u * 0.14,
        base.y + u * 0.62,
        base.z - u * 0.05,
      );
      sprite.scale.setScalar(0.05 + u * 0.2);
      sprite.material.opacity = Math.sin(u * Math.PI) * 0.5;
    });
    this.feixe.rotation.y = -tempo * 0.5;
  }

  private flutuar(objeto: THREE.Object3D, i: number, y: number, tempo: number): void {
    if (this.reduzido) {
      objeto.position.y = y;
      return;
    }
    objeto.position.y = y + Math.sin(tempo * 1.3 + i * 1.7) * 0.013;
    objeto.rotation.x = Math.sin(tempo * 0.9 + i) * 0.03;
    objeto.rotation.z = Math.cos(tempo * 1.1 + i * 2) * 0.03;
  }

  destruir(): void {
    this.grupo.removeFromParent();
    this.grupo.traverse((objeto) => {
      const { geometry, material } = objeto as THREE.Mesh;
      if (geometry && !geometry.userData['fixa']) {
        geometry.dispose();
      }
      if (material && !this.oficina.ehMaterialFixo(material as THREE.Material)) {
        const m = material as THREE.SpriteMaterial;
        if (m.map && m.map !== this.texFumaca) {
          m.map.dispose();
        }
        m.dispose();
      }
    });
  }
}
