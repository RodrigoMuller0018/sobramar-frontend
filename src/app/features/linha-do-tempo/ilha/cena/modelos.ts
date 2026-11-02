import * as THREE from 'three';

/*
 * Modelos gerados por código. Cada um funde suas peças em uma só geometria com cor por vértice, para
 * gastar uma só chamada de desenho. Todas as geometrias são guardadas e reaproveitadas entre os meses.
 */
export type Peca = [THREE.BufferGeometry, THREE.Color];

const COR = (hex: number): THREE.Color => new THREE.Color(hex);

export const PAL = {
  parede: COR(0xf2e6cf),
  pedra: COR(0x9b968a),
  telha: COR(0xb1502f),
  telha2: COR(0x98432a),
  madeira: COR(0x86603d),
  madeira2: COR(0x6e4e31),
  porta: COR(0x2c5a70),
  branco: COR(0xf7f4ea),
  vidro: COR(0x9cc9d8),
  magenta: COR(0xa80f72),
  cobre: COR(0x6f9a8a),
  ferro: COR(0x27323a),
  folha: COR(0x5f8a45),
  folha2: COR(0x7fa24f),
  folha3: COR(0x466f3c),
  tronco: COR(0x6b4d33),
  flor: COR(0xd9558a),
  flor2: COR(0xf1c64b),
  toldoA: COR(0xe2ae3f),
  toldoB: COR(0xf7f1df),
  boia: COR(0xd34b2a),
  areia: COR(0xe6d39b),
  rocha: COR(0x8a8a82),
  rocha2: COR(0x6f7069),
  latao: COR(0xb99a4e),
  base: COR(0x1a2c3a),
};

const M4 = new THREE.Matrix4();
const QT = new THREE.Quaternion();
const EUL = new THREE.Euler();

export function T<G extends THREE.BufferGeometry>(
  g: G,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = sx,
  sz = sx,
): G {
  M4.compose(
    new THREE.Vector3(x, y, z),
    QT.setFromEuler(EUL.set(rx, ry, rz)),
    new THREE.Vector3(sx, sy, sz),
  );
  g.applyMatrix4(M4);
  return g;
}

const caixa = (w: number, h: number, d: number): THREE.BufferGeometry =>
  new THREE.BoxGeometry(w, h, d);
const cil = (a: number, b: number, h: number, n = 12): THREE.BufferGeometry =>
  new THREE.CylinderGeometry(a, b, h, n);
const esf = (r: number, d = 1): THREE.BufferGeometry => new THREE.IcosahedronGeometry(r, d);
const perfil = (pontos: readonly (readonly [number, number])[]): THREE.Vector2[] =>
  pontos.map(([a, b]) => new THREE.Vector2(a, b));

function caixaR(w: number, h: number, d: number, b = 0.012): THREE.BufferGeometry {
  const s = new THREE.Shape();
  const x = w / 2 - b;
  const y = h / 2 - b;
  s.moveTo(-x, -y);
  s.lineTo(x, -y);
  s.lineTo(x, y);
  s.lineTo(-x, y);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: d - 2 * b,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 2,
    steps: 1,
  });
  g.translate(0, 0, -(d - 2 * b) / 2);
  return g;
}

function empena(w: number, hp: number, hc: number, d: number): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, hp);
  s.lineTo(0, hc);
  s.lineTo(-w / 2, hp);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  return g;
}

export function fundir(pecas: readonly Peca[]): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const cor: number[] = [];
  pecas.forEach(([g, c]) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (!n.attributes['normal']) {
      n.computeVertexNormals();
    }
    const p = n.attributes['position'];
    const m = n.attributes['normal'];
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(m.getX(i), m.getY(i), m.getZ(i));
      cor.push(c.r, c.g, c.b);
    }
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
  return out;
}

function vento(
  material: THREE.MeshStandardMaterial,
  tempo: THREE.IUniform<number>,
  trecho: string,
): THREE.MeshStandardMaterial {
  material.onBeforeCompile = (s) => {
    s.uniforms['uT'] = tempo;
    s.vertexShader =
      'uniform float uT;\n' +
      s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n${trecho}`);
  };
  return material;
}

function janela(P: Peca[], x: number, y: number, z: number, ry: number, venezianas: boolean): void {
  const parte = (g: THREE.BufferGeometry): THREE.BufferGeometry => T(g, x, y, z, 0, ry);
  P.push([parte(caixa(0.115, 0.135, 0.012)), PAL.branco]);
  P.push([parte(T(caixa(0.09, 0.11, 0.014), 0, 0, 0.002)), PAL.vidro]);
  P.push([parte(T(caixa(0.007, 0.11, 0.016), 0, 0, 0.003)), PAL.branco]);
  P.push([parte(T(caixa(0.09, 0.007, 0.016), 0, 0, 0.003)), PAL.branco]);
  if (venezianas) {
    [-1, 1].forEach((s) =>
      P.push([parte(T(caixaR(0.042, 0.135, 0.012, 0.003), s * 0.083, 0, 0.002)), PAL.porta]),
    );
    P.push([parte(T(caixaR(0.135, 0.022, 0.04, 0.004), 0, -0.08, 0.016)), PAL.madeira2]);
    for (let i = -2; i <= 2; i++) {
      P.push([parte(T(esf(0.016, 0), i * 0.026, -0.062, 0.018)), i % 2 ? PAL.flor : PAL.flor2]);
    }
  }
}

function pecasDaCasa(): Peca[] {
  const P: Peca[] = [];
  P.push([T(caixaR(0.8, 0.07, 0.66, 0.015), 0, 0.03, 0), PAL.pedra]);
  P.push([T(empena(0.64, 0.36, 0.58, 0.5), 0, 0.06, 0), PAL.parede]);
  const ang = Math.atan2(0.22, 0.32);
  [-1, 1].forEach((s) => {
    P.push([T(caixaR(0.46, 0.028, 0.6, 0.008), s * 0.165, 0.535, 0, 0, 0, -s * ang), PAL.telha2]);
    for (let i = 0; i < 6; i++) {
      const f = (i + 0.5) / 6;
      P.push([
        T(cil(0.0135, 0.0135, 0.6, 6), s * (0.015 + f * 0.34), 0.66 - f * 0.235, 0, Math.PI / 2),
        i % 2 ? PAL.telha : PAL.telha2,
      ]);
    }
  });
  P.push([T(cil(0.02, 0.02, 0.62, 8), 0, 0.665, 0, Math.PI / 2), PAL.telha2]);
  P.push([T(caixaR(0.09, 0.24, 0.09, 0.006), 0.17, 0.64, -0.1), PAL.pedra]);
  P.push([T(caixaR(0.12, 0.022, 0.12, 0.005), 0.17, 0.765, -0.1), PAL.rocha2]);
  P.push([T(caixa(0.16, 0.265, 0.014), 0, 0.19, 0.25), PAL.branco]);
  P.push([T(caixaR(0.122, 0.235, 0.018, 0.004), 0, 0.18, 0.254), PAL.porta]);
  P.push([T(esf(0.009, 1), 0.04, 0.17, 0.267), PAL.latao]);
  P.push([T(caixaR(0.22, 0.03, 0.09, 0.006), 0, 0.075, 0.3), PAL.pedra]);
  P.push([T(cil(0.04, 0.04, 0.012, 16), 0, 0.5, 0.252, Math.PI / 2), PAL.branco]);
  P.push([T(cil(0.03, 0.03, 0.014, 16), 0, 0.5, 0.254, Math.PI / 2), PAL.vidro]);
  janela(P, -0.205, 0.27, 0.252, 0, true);
  janela(P, 0.205, 0.27, 0.252, 0, true);
  janela(P, 0.322, 0.26, 0.09, Math.PI / 2, false);
  janela(P, 0.322, 0.26, -0.11, Math.PI / 2, false);
  janela(P, -0.322, 0.26, 0, -Math.PI / 2, false);
  [
    [-0.36, 0.34, 0.075],
    [-0.28, 0.37, 0.05],
    [0.33, 0.33, 0.07],
    [0.42, 0.21, 0.06],
    [-0.42, -0.1, 0.075],
    [0.4, -0.2, 0.065],
  ].forEach(([x, z, r], i) =>
    P.push([T(esf(r, 1), x, r * 0.75, z, 0, i, 0, 1, 0.82, 1), i % 2 ? PAL.folha : PAL.folha3]),
  );
  for (let i = 0; i < 4; i++) {
    P.push([T(cil(0.045, 0.05, 0.012, 7), 0.01 * (i % 2), 0.02, 0.38 + i * 0.1), PAL.pedra]);
  }
  return P;
}

function pecasDoFarol(): Peca[] {
  const P: Peca[] = [];
  P.push([
    new THREE.LatheGeometry(
      perfil([
        [0, 0],
        [0.27, 0],
        [0.28, 0.03],
        [0.24, 0.07],
        [0.21, 0.09],
        [0, 0.09],
      ]),
      20,
    ),
    PAL.pedra,
  ]);
  const faixas = 7;
  const curva = (f: number): number => 0.105 + 0.085 * Math.pow(1 - f, 1.35);
  for (let i = 0; i < faixas; i++) {
    const a = i / faixas;
    const b = (i + 1) / faixas;
    P.push([
      T(cil(curva(b), curva(a), 0.82 / faixas, 24), 0, 0.09 + (0.82 * (a + b)) / 2, 0),
      i % 2 ? PAL.magenta : PAL.branco,
    ]);
  }
  P.push([T(cil(0.155, 0.11, 0.035, 24), 0, 0.925, 0), PAL.ferro]);
  P.push([T(cil(0.16, 0.16, 0.012, 24), 0, 0.948, 0), PAL.ferro]);
  P.push([T(new THREE.TorusGeometry(0.15, 0.0055, 6, 28), 0, 1.02, 0, Math.PI / 2), PAL.ferro]);
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * Math.PI * 2;
    P.push([
      T(cil(0.004, 0.004, 0.07, 4), Math.cos(t) * 0.15, 0.985, Math.sin(t) * 0.15),
      PAL.ferro,
    ]);
  }
  for (let i = 0; i < 6; i++) {
    const t = (i / 6) * Math.PI * 2;
    P.push([
      T(cil(0.006, 0.006, 0.16, 4), Math.cos(t) * 0.094, 1.03, Math.sin(t) * 0.094),
      PAL.ferro,
    ]);
  }
  P.push([T(cil(0.11, 0.1, 0.018, 18), 0, 1.115, 0), PAL.ferro]);
  P.push([
    T(
      new THREE.SphereGeometry(0.105, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      0,
      1.12,
      0,
      0,
      0,
      0,
      1,
      0.85,
      1,
    ),
    PAL.cobre,
  ]);
  P.push([T(esf(0.017, 1), 0, 1.225, 0), PAL.latao]);
  P.push([T(cil(0.003, 0.003, 0.08, 4), 0, 1.27, 0), PAL.latao]);
  P.push([T(caixaR(0.09, 0.15, 0.02, 0.004), 0, 0.165, 0.178), PAL.porta]);
  P.push([T(caixaR(0.13, 0.025, 0.09, 0.005), 0, 0.095, 0.21), PAL.pedra]);
  [
    [0.45, 0.13],
    [0.65, 0.125],
    [0.3, 0.155],
  ].forEach(([y, r], i) => {
    const t = 1.1 + i * 2.1;
    P.push([T(caixa(0.045, 0.06, 0.012), Math.sin(t) * r, y, Math.cos(t) * r, 0, t), PAL.ferro]);
  });
  return P;
}

function pecasDoPoste(): Peca[] {
  const curva = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0.03, 0),
    new THREE.Vector3(0, 0.82, 0),
    new THREE.Vector3(0.15, 0.72, 0),
  );
  return [
    [new THREE.TubeGeometry(curva, 14, 0.011, 6), PAL.ferro],
    [T(cil(0.03, 0.045, 0.06, 10), 0, 0.03, 0), PAL.ferro],
    [T(cil(0.012, 0.055, 0.035, 10), 0.15, 0.71, 0), PAL.ferro],
  ];
}

function pecasDaEscola(): Peca[] {
  const P: Peca[] = [];
  P.push([T(caixaR(0.92, 0.06, 0.52, 0.012), 0, 0.03, 0), PAL.pedra]);
  P.push([T(empena(0.42, 0.34, 0.5, 0.8), 0, 0.05, 0, 0, Math.PI / 2), PAL.parede]);
  const ang = Math.atan2(0.16, 0.21);
  [-1, 1].forEach((s) =>
    P.push([T(caixaR(0.9, 0.026, 0.31, 0.007), 0, 0.475, s * 0.11, s * ang), PAL.porta]),
  );
  [-0.26, 0, 0.26].forEach((x, i) => janela(P, x, 0.25, 0.212, 0, i !== 1));
  P.push([T(caixaR(0.14, 0.22, 0.016, 0.004), 0, 0.18, 0.218), PAL.madeira2]);
  P.push([T(caixaR(0.16, 0.19, 0.16, 0.006), 0.3, 0.6, 0), PAL.parede]);
  P.push([T(new THREE.ConeGeometry(0.135, 0.13, 4), 0.3, 0.76, 0, 0, Math.PI / 4), PAL.porta]);
  P.push([T(cil(0.03, 0.03, 0.01, 14), 0.3, 0.61, 0.083, Math.PI / 2), PAL.branco]);
  P.push([T(cil(0.005, 0.007, 0.42, 6), -0.34, 0.68, 0.06), PAL.ferro]);
  P.push([T(esf(0.01, 1), -0.34, 0.895, 0.06), PAL.latao]);
  return P;
}

function pecasDaBarraca(): Peca[] {
  const P: Peca[] = [];
  [
    [-0.2, -0.16],
    [0.2, -0.16],
    [-0.2, 0.16],
    [0.2, 0.16],
  ].forEach(([x, z]) => P.push([T(cil(0.009, 0.011, 0.34, 6), x, 0.17, z), PAL.madeira]));
  P.push([T(caixaR(0.44, 0.16, 0.14, 0.008), 0, 0.09, 0.14), PAL.madeira2]);
  P.push([T(caixaR(0.48, 0.02, 0.18, 0.006), 0, 0.175, 0.14), PAL.madeira]);
  for (let i = 0; i < 8; i++) {
    const x = -0.245 + i * 0.07;
    const c = i % 2 ? PAL.toldoA : PAL.toldoB;
    P.push([T(caixa(0.07, 0.01, 0.46), x, 0.38, 0, 0.26), c]);
    P.push([T(cil(0.035, 0.035, 0.012, 12), x, 0.32, 0.225, Math.PI / 2), c]);
  }
  [-0.1, 0, 0.1].forEach((x, i) =>
    P.push([T(esf(0.022, 1), x, 0.205, 0.14), i === 1 ? PAL.flor : PAL.flor2]),
  );
  return P;
}

function geoPalmeira(): THREE.BufferGeometry {
  const curva = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.015, 0.2, 0),
    new THREE.Vector3(0.07, 0.4, 0),
  );
  const P: Peca[] = [[new THREE.TubeGeometry(curva, 10, 0.015, 6), PAL.tronco]];
  for (let f = 0; f < 8; f++) {
    const pl = new THREE.PlaneGeometry(0.07, 0.3, 2, 7);
    const p = pl.attributes['position'];
    for (let i = 0; i < p.count; i++) {
      const v = (p.getY(i) + 0.15) / 0.3;
      const larg = Math.sin(Math.min(1, v * 1.05) * Math.PI) * 0.9 + 0.1;
      p.setXYZ(
        i,
        p.getX(i) * larg,
        v * 0.27 * (1 - v * 0.2),
        0.07 * Math.sin(v * 1.2) - v * v * 0.16,
      );
    }
    pl.computeVertexNormals();
    pl.rotateX(Math.PI / 2 - 0.15);
    pl.rotateY((f / 8) * Math.PI * 2 + (f % 2) * 0.15);
    pl.translate(0.07, 0.4, 0);
    P.push([pl, f % 2 ? PAL.folha : PAL.folha2]);
  }
  P.push([T(esf(0.017, 0), 0.08, 0.385, 0.012), PAL.madeira2]);
  P.push([T(esf(0.017, 0), 0.058, 0.385, -0.012), PAL.madeira2]);
  return fundir(P);
}

function geoRocha(): THREE.BufferGeometry {
  const g = esf(0.1, 1);
  const p = g.attributes['position'];
  for (let i = 0; i < p.count; i++) {
    const k = 0.78 + 0.34 * Math.abs(Math.sin(p.getX(i) * 31 + p.getZ(i) * 17 + p.getY(i) * 23));
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.65, p.getZ(i) * k);
  }
  return fundir([[g, PAL.rocha]]);
}

function pecasDaBoia(): Peca[] {
  const P: Peca[] = [
    [
      new THREE.LatheGeometry(
        perfil([
          [0, -0.06],
          [0.1, -0.05],
          [0.125, 0],
          [0.115, 0.035],
          [0.05, 0.05],
          [0, 0.05],
        ]),
        16,
      ),
      PAL.boia,
    ],
    [T(new THREE.TorusGeometry(0.118, 0.012, 6, 18), 0, 0.012, 0, Math.PI / 2), PAL.branco],
    [T(cil(0.03, 0.03, 0.008, 10), 0, 0.2, 0), PAL.ferro],
  ];
  for (let i = 0; i < 4; i++) {
    const t = (i / 4) * Math.PI * 2 + 0.7;
    P.push([
      T(
        cil(0.005, 0.007, 0.17, 4),
        Math.cos(t) * 0.045,
        0.125,
        Math.sin(t) * 0.045,
        Math.sin(t) * 0.25,
        0,
        -Math.cos(t) * 0.25,
      ),
      PAL.ferro,
    ]);
  }
  return P;
}

function pecasDoTrapiche(): Peca[] {
  const P: Peca[] = [];
  for (let i = 0; i < 11; i++) {
    P.push([
      T(
        caixaR(0.28, 0.018, 0.06, 0.004),
        (((i * 7) % 3) - 1) * 0.004,
        0.06,
        i * 0.072,
        0,
        (((i * 5) % 3) - 1) * 0.012,
      ),
      i % 3 ? PAL.madeira : PAL.madeira2,
    ]);
  }
  [-0.13, 0.13].forEach((x) => {
    P.push([T(caixa(0.02, 0.016, 0.78), x, 0.045, 0.36), PAL.madeira2]);
    [0.02, 0.38, 0.72].forEach((z) => {
      P.push([T(cil(0.016, 0.02, 0.22, 7), x, 0, z), PAL.tronco]);
      P.push([
        T(new THREE.TorusGeometry(0.019, 0.004, 5, 10), x, 0.05, z, Math.PI / 2),
        PAL.toldoB,
      ]);
    });
  });
  P.push([T(caixaR(0.08, 0.05, 0.06, 0.006), 0.07, 0.095, 0.56), PAL.madeira2]);
  P.push([T(cil(0.026, 0.026, 0.07, 10), -0.08, 0.105, 0.64), PAL.tronco]);
  return P;
}

function pecasDoCasco(): Peca[] {
  const P: Peca[] = [];
  const c = new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const p = c.attributes['position'];
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i);
    const afina = z > 0 ? 1 - z * z * 0.72 : 1 - z * z * 0.18;
    p.setXYZ(i, p.getX(i) * 0.11 * afina, p.getY(i) * 0.075, z * 0.29);
  }
  c.computeVertexNormals();
  P.push([c, PAL.branco]);
  P.push([
    T(new THREE.TorusGeometry(1, 0.016, 6, 28), 0, 0, 0, Math.PI / 2, 0, 0, 0.105, 0.285, 1),
    PAL.magenta,
  ]);
  P.push([T(cil(1, 1, 0.012, 22), 0, 0.004, 0, 0, 0, 0, 0.088, 1, 0.235), PAL.madeira]);
  P.push([T(caixaR(0.09, 0.05, 0.1, 0.008), 0, 0.03, -0.05), PAL.branco]);
  P.push([T(cil(0.0055, 0.008, 0.46, 6), 0, 0.23, 0.04), PAL.madeira2]);
  P.push([T(cil(0.0045, 0.0045, 0.2, 5), 0, 0.09, -0.06, Math.PI / 2), PAL.madeira2]);
  return P;
}

function geoVela(): THREE.BufferGeometry {
  const pl = new THREE.PlaneGeometry(1, 1, 10, 8);
  const p = pl.attributes['position'];
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) + 0.5;
    const v = p.getY(i) + 0.5;
    const larg = 0.2 * (1 - v) ** 0.9;
    p.setXYZ(i, u * larg, 0.1 + v * 0.36, Math.sin(u * Math.PI) * 0.03 * (1 - v));
  }
  pl.computeVertexNormals();
  return fundir([[pl, PAL.magenta]]);
}

function geoNuvem(semente: number): THREE.BufferGeometry {
  const P: Peca[] = [];
  for (let i = 0; i < 7; i++) {
    const a = i - 3;
    P.push([
      T(
        esf(0.34 - Math.abs(a) * 0.055, 2),
        a * 0.28,
        0.02 * ((i * 3) % 4),
        ((((i + semente) * 5) % 3) - 1) * 0.1,
      ),
      PAL.branco,
    ]);
  }
  return fundir(P);
}

function geoAsa(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, -0.018);
  s.quadraticCurveTo(0.08, -0.035, 0.15, -0.012);
  s.quadraticCurveTo(0.07, 0.015, 0, 0.02);
  s.closePath();
  return fundir([[T(new THREE.ShapeGeometry(s, 6), 0, 0, 0, Math.PI / 2), PAL.branco]]);
}

function geoFeixe(): THREE.BufferGeometry {
  const cone = new THREE.ConeGeometry(0.42, 3, 18, 6, true);
  cone.rotateZ(Math.PI / 2);
  cone.translate(1.5, 0, 0);
  cone.rotateZ(Math.PI);
  const p = cone.attributes['position'];
  const cor: number[] = [];
  for (let i = 0; i < p.count; i++) {
    const f = 0.024 * Math.max(0, 1 - Math.abs(p.getX(i)) / 3);
    cor.push(f, f * 0.86, f * 0.52);
  }
  cone.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
  return cone;
}

export interface Ave extends THREE.Group {
  asaDireita: THREE.Mesh;
  asaEsquerda: THREE.Mesh;
}

/** Reúne geometrias e materiais compartilhados por todos os meses. */
export class Oficina {
  readonly material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.72,
    metalness: 0.02,
    envMapIntensity: 0.65,
  });
  readonly luzAcesa = new THREE.MeshStandardMaterial({
    color: 0xffdc82,
    emissive: 0xffb534,
    emissiveIntensity: 1.5,
    roughness: 0.3,
  });
  readonly luzApagada = new THREE.MeshStandardMaterial({ color: 0x6d777e, roughness: 0.4 });
  readonly luzBoia = new THREE.MeshStandardMaterial({
    color: 0xffd9c2,
    emissive: 0xff6a3c,
    emissiveIntensity: 1.2,
  });
  readonly arvore: THREE.MeshStandardMaterial;
  readonly tecido: THREE.MeshStandardMaterial;
  readonly feixeMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  readonly nuvemMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    envMapIntensity: 1.1,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  private readonly geometrias = new Map<string, THREE.BufferGeometry>();

  constructor(tempo: THREE.IUniform<number>) {
    this.arvore = vento(
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.85,
        envMapIntensity: 0.5,
        side: THREE.DoubleSide,
      }),
      tempo,
      `#ifdef USE_INSTANCING
       float fase = instanceMatrix[3][0] * 3. + instanceMatrix[3][2] * 2.;
       transformed.x += sin(uT * 1.4 + fase) * position.y * position.y * .11;
       transformed.z += cos(uT * 1.1 + fase) * position.y * position.y * .07;
       #endif`,
    );
    this.tecido = vento(
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.75,
        side: THREE.DoubleSide,
      }),
      tempo,
      'transformed.z += sin(position.x * 24. + position.y * 11. - uT * 4.) * .012 * clamp(position.x * 7., 0., 1.);',
    );
  }

  geometria(nome: string, criar: () => THREE.BufferGeometry): THREE.BufferGeometry {
    let g = this.geometrias.get(nome);
    if (!g) {
      g = criar();
      g.userData['fixa'] = true;
      this.geometrias.set(nome, g);
    }
    return g;
  }

  ehMaterialFixo(material: THREE.Material): boolean {
    return [
      this.material,
      this.luzAcesa,
      this.luzApagada,
      this.luzBoia,
      this.arvore,
      this.tecido,
      this.feixeMaterial,
      this.nuvemMaterial,
    ].includes(material as THREE.MeshStandardMaterial);
  }

  private modelo(nome: string, pecas: () => Peca[]): THREE.Mesh {
    const m = new THREE.Mesh(
      this.geometria(nome, () => fundir(pecas())),
      this.material,
    );
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  casa(): THREE.Mesh {
    return this.modelo('casa', pecasDaCasa);
  }

  farol(): THREE.Group {
    const g = new THREE.Group();
    g.add(this.modelo('farol', pecasDoFarol));
    const lanterna = new THREE.Mesh(
      this.geometria('lanterna', () => cil(0.085, 0.085, 0.15, 14)),
      this.luzAcesa,
    );
    lanterna.position.y = 1.03;
    g.add(lanterna);
    return g;
  }

  poste(aceso: boolean): THREE.Group {
    const g = new THREE.Group();
    g.add(this.modelo('poste', pecasDoPoste));
    const lampada = new THREE.Mesh(
      this.geometria('lampada', () => esf(0.026, 2)),
      aceso ? this.luzAcesa : this.luzApagada,
    );
    lampada.position.set(0.15, 0.675, 0);
    g.add(lampada);
    return g;
  }

  escola(): THREE.Group {
    const g = new THREE.Group();
    g.add(this.modelo('escola', pecasDaEscola));
    const bandeira = new THREE.Mesh(
      this.geometria('bandeira', () =>
        fundir([[T(new THREE.PlaneGeometry(0.15, 0.09, 10, 3), 0.075, 0, 0), PAL.toldoA]]),
      ),
      this.tecido,
    );
    bandeira.position.set(-0.34, 0.83, 0.06);
    bandeira.castShadow = true;
    g.add(bandeira);
    return g;
  }

  barraca(): THREE.Mesh {
    return this.modelo('barraca', pecasDaBarraca);
  }

  boia(): THREE.Group {
    const g = new THREE.Group();
    g.add(this.modelo('boia', pecasDaBoia));
    const lampada = new THREE.Mesh(
      this.geometria('lampadaBoia', () => esf(0.02, 1)),
      this.luzBoia,
    );
    lampada.position.y = 0.222;
    g.add(lampada);
    return g;
  }

  trapiche(): THREE.Group {
    const g = new THREE.Group();
    g.add(this.modelo('trapiche', pecasDoTrapiche));
    return g;
  }

  barco(): THREE.Group {
    const g = new THREE.Group();
    const casco = this.modelo('casco', pecasDoCasco);
    casco.castShadow = false;
    g.add(casco);
    const vela = new THREE.Mesh(this.geometria('vela', geoVela), this.tecido);
    vela.rotation.y = Math.PI / 2;
    vela.position.z = 0.03;
    g.add(vela);
    return g;
  }

  nuvem(semente: number): THREE.Mesh {
    return new THREE.Mesh(
      this.geometria(`nuvem${semente}`, () => geoNuvem(semente)),
      this.nuvemMaterial,
    );
  }

  ave(): Ave {
    const g = new THREE.Group() as Ave;
    const asa = this.geometria('asa', geoAsa);
    g.asaDireita = new THREE.Mesh(asa, this.arvore);
    g.asaEsquerda = new THREE.Mesh(asa, this.arvore);
    g.asaEsquerda.scale.x = -1;
    const corpo = new THREE.Mesh(
      this.geometria('corpoAve', () =>
        fundir([[T(esf(1, 1), 0, 0, 0, 0, 0, 0, 0.014, 0.014, 0.05), PAL.branco]]),
      ),
      this.material,
    );
    g.add(g.asaDireita, g.asaEsquerda, corpo);
    return g;
  }

  feixe(): THREE.Mesh {
    return new THREE.Mesh(this.geometria('feixe', geoFeixe), this.feixeMaterial);
  }

  base(): THREE.Mesh {
    const m = new THREE.Mesh(
      this.geometria('base', () =>
        fundir([
          [
            new THREE.LatheGeometry(
              perfil([
                [0, -1.22],
                [5.72, -1.22],
                [5.82, -1.17],
                [5.82, -1.03],
                [5.74, -0.98],
                [5.58, -0.965],
                [5.58, -0.9],
                [0, -0.9],
              ]),
              96,
            ),
            PAL.base,
          ],
          [T(new THREE.TorusGeometry(5.8, 0.022, 8, 120), 0, -1.1, 0, Math.PI / 2), PAL.latao],
          [T(new THREE.TorusGeometry(5.68, 0.012, 6, 120), 0, -0.98, 0, Math.PI / 2), PAL.latao],
        ]),
      ),
      this.material,
    );
    m.receiveShadow = true;
    return m;
  }

  pinheiro(): THREE.BufferGeometry {
    return this.geometria('pinheiro', () =>
      fundir([
        [T(cil(0.016, 0.03, 0.14, 7), 0, 0.07, 0), PAL.tronco],
        [T(new THREE.ConeGeometry(0.145, 0.2, 9, 1), 0, 0.2, 0), PAL.folha3],
        [T(new THREE.ConeGeometry(0.115, 0.18, 9, 1), 0, 0.3, 0, 0, 0.4), PAL.folha],
        [T(new THREE.ConeGeometry(0.08, 0.16, 8, 1), 0, 0.4, 0, 0, 0.8), PAL.folha2],
      ]),
    );
  }

  copa(): THREE.BufferGeometry {
    return this.geometria('copa', () =>
      fundir([
        [T(cil(0.018, 0.032, 0.17, 7), 0, 0.085, 0), PAL.tronco],
        [T(esf(0.115, 1), 0, 0.25, 0), PAL.folha],
        [T(esf(0.085, 1), 0.08, 0.2, 0.03), PAL.folha3],
        [T(esf(0.09, 1), -0.075, 0.21, -0.03), PAL.folha2],
        [T(esf(0.075, 1), 0.015, 0.33, 0.03), PAL.folha2],
        [T(esf(0.065, 1), -0.02, 0.2, 0.08), PAL.folha],
      ]),
    );
  }

  palmeira(): THREE.BufferGeometry {
    return this.geometria('palmeira', geoPalmeira);
  }

  rocha(): THREE.BufferGeometry {
    return this.geometria('rocha', geoRocha);
  }

  tufo(): THREE.BufferGeometry {
    return this.geometria('tufo', () =>
      fundir([
        [T(new THREE.ConeGeometry(0.014, 0.075, 4), 0, 0.037, 0, 0.1, 0, 0.12), PAL.folha2],
        [T(new THREE.ConeGeometry(0.012, 0.06, 4), 0.016, 0.03, 0.006, -0.1, 0, -0.25), PAL.folha],
        [
          T(new THREE.ConeGeometry(0.012, 0.055, 4), -0.016, 0.027, -0.006, 0.15, 0, 0.3),
          PAL.folha3,
        ],
      ]),
    );
  }

  flor(): THREE.BufferGeometry {
    return this.geometria('flor', () =>
      fundir([
        [T(cil(0.002, 0.002, 0.05, 3), 0, 0.025, 0), PAL.folha],
        [T(esf(0.014, 0), 0, 0.055, 0), PAL.flor],
      ]),
    );
  }

  ilhota(raio: number): THREE.Mesh {
    const m = new THREE.Mesh(
      fundir([
        [
          new THREE.LatheGeometry(
            perfil([
              [raio * 1.08, -0.3],
              [raio, -0.04],
              [raio * 0.85, 0.05],
              [raio * 0.65, 0.18],
              [raio * 0.35, 0.28],
              [0, 0.3],
            ]),
            28,
          ),
          PAL.areia,
        ],
        [
          T(
            new THREE.SphereGeometry(raio * 0.68, 22, 8, 0, 6.283, 0, 1.15),
            0,
            -0.02,
            0,
            0,
            0,
            0,
            1,
            0.56,
            1,
          ),
          PAL.folha2,
        ],
      ]),
      this.material,
    );
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  prancha(): THREE.BufferGeometry {
    return this.geometria('prancha', () =>
      fundir([[caixaR(0.16, 0.014, 0.05, 0.004), PAL.madeira]]),
    );
  }
}
