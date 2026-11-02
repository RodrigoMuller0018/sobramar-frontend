/**
 * Água da ilha. A profundidade é calculada pela mesma fórmula do terreno, H(1 - ρ²), então a espuma
 * segue a costa exata sem precisar de textura.
 */
export const AGUA_VERTEX = `
  uniform float uT, uY;
  varying vec3 vP;
  varying vec3 vW;
  void main() {
    vec3 p = position;
    vP = p;
    p.y += uY + (sin(p.x * 3.1 + uT * 1.2) + cos(p.z * 3.7 - uT)) * .005;
    vec4 w = modelMatrix * vec4(p, 1.);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

export const AGUA_FRAGMENT = `
  uniform float uT, uY, uH, uR, uQ;
  uniform vec4 uA, uP;
  uniform vec3 uIlhota, uSolDir;
  varying vec3 vP;
  varying vec3 vW;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float ruido(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
  }
  float ondas(vec2 q) {
    float v = ruido(q * 3.1 + vec2(uT * .16, uT * .11)) * .62;
    if (uQ > .5) v += ruido(q * 7.3 + vec2(-uT * .23, uT * .19)) * .28;
    if (uQ > 1.5) v += ruido(q * 17. + vec2(uT * .31, -uT * .27)) * .1;
    return v;
  }
  float raio(float t) {
    return uR * (1. + uA.x * sin(2. * t + uP.x) + uA.y * sin(3. * t + uP.y) + uA.z * sin(5. * t + uP.z) + uA.w * sin(7. * t + uP.w));
  }
  void main() {
    vec2 q = vP.xz;
    float rho = length(q) / raio(atan(q.y, q.x));
    float chao = max(-.9, uH * (1. - rho * rho));
    float prof = uY - chao;
    if (prof < -.001) discard;

    float e = .035;
    float h0 = ondas(q);
    vec3 N = normalize(vec3((h0 - ondas(q + vec2(e, 0.))) / e * .1, 1., (h0 - ondas(q + vec2(0., e))) / e * .1));
    vec3 V = normalize(cameraPosition - vW);
    float fres = pow(1. - max(dot(N, V), 0.), 3.5);
    float spec = pow(max(dot(N, normalize(uSolDir + V)), 0.), 140.);

    vec3 cor = mix(vec3(.3, .8, .72), vec3(.018, .2, .33), smoothstep(.05, .85, prof));
    cor += vec3(.3, .45, .4) * pow(1. - abs(h0 * 2. - 1.), 7.) * (1. - smoothstep(.02, .5, prof));
    cor = mix(cor, vec3(.55, .74, .88), fres * .75) + vec3(1., .93, .78) * spec * 1.6;

    float borda = 1. - smoothstep(0., .022 + .04 * h0, prof);
    float frente = sin(prof * 42. - uT * 1.7 + h0 * 7.) * .5 + .5;
    float banda = smoothstep(.76, .98, frente) * (1. - smoothstep(.015, .15, prof)) * smoothstep(.22, .55, h0);
    float bordaI = 0.;
    if (uIlhota.z > 0.) {
      float dI = length(q - uIlhota.xy) - uIlhota.z;
      bordaI = 1. - smoothstep(.0, .028 + .035 * h0, abs(dI));
    }
    float espuma = clamp(borda + banda * .75 + bordaI * .9, 0., 1.);
    cor = mix(cor, vec3(.96, .98, .97), espuma);

    gl_FragColor = vec4(cor, max(mix(.2, .9, smoothstep(0., 1.2, prof)), espuma));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
