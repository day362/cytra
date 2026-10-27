/**
 * GLSL for the cytoplasm field (GLSL ES 1.00, runs on WebGL1 and WebGL2).
 *
 * The scene is a few soft "cells" drifting on a pale slide, with phase-contrast
 * style membranes. A rounded rectangle (the hero composer) is rendered as a
 * thick glass lens: samples inside it are bent near the bevel, split slightly
 * per channel (dispersion), frosted, and lit along the rim. Pointer clicks add
 * expanding refractive ripples.
 */

export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec2  uRes;        // drawing buffer size, px
uniform float uScale;      // drawing buffer px per CSS px
uniform float uTime;       // seconds, already slowed
uniform vec2  uPointer;    // buffer px, y-up
uniform float uDark;       // 0 light .. 1 dark
uniform float uCalm;       // 0 hero .. 1 calm
uniform float uPulse;      // 0..1, decays after a send
uniform vec4  uLens;       // center.xy, half-size.xy (buffer px, y-up)
uniform float uLensR;      // corner radius, buffer px
uniform float uLensOn;     // 0..1
uniform vec3  uRipples[4]; // x, y (buffer px, y-up), age in seconds (<0 = off)

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Aspect-corrected scene space: y spans roughly -0.5..0.5.
vec2 toScene(vec2 px) {
  return (px - 0.5 * uRes) / uRes.y;
}

vec3 palette(int i, float dark) {
  vec3 l; vec3 d;
  if (i == 0)      { l = vec3(0.60, 0.86, 0.83); d = vec3(0.06, 0.42, 0.40); } // chlorophyll teal
  else if (i == 1) { l = vec3(0.70, 0.81, 0.96); d = vec3(0.10, 0.22, 0.52); } // cold aqua blue
  else if (i == 2) { l = vec3(0.84, 0.80, 0.96); d = vec3(0.28, 0.17, 0.50); } // stain lilac
  else if (i == 3) { l = vec3(0.98, 0.89, 0.85); d = vec3(0.40, 0.20, 0.24); } // warm pearl
  else             { l = vec3(0.74, 0.92, 0.82); d = vec3(0.08, 0.36, 0.26); } // mint
  return mix(l, d, dark);
}

vec2 cellCenter(int i, float t) {
  if (i == 0) return vec2(-0.42, 0.12) + 0.10 * vec2(sin(t * 0.71), cos(t * 0.53));
  if (i == 1) return vec2(0.46, -0.10) + 0.12 * vec2(cos(t * 0.47 + 1.3), sin(t * 0.61));
  if (i == 2) return vec2(0.10, 0.33) + 0.09 * vec2(sin(t * 0.39 + 2.1), cos(t * 0.67 + 0.4));
  if (i == 3) return vec2(-0.12, -0.34) + 0.11 * vec2(cos(t * 0.58 + 0.7), sin(t * 0.43 + 2.6));
  return vec2(0.78, 0.30) + 0.08 * vec2(sin(t * 0.52 + 4.0), cos(t * 0.36 + 1.1));
}

float cellRadius(int i) {
  if (i == 0) return 0.30;
  if (i == 1) return 0.34;
  if (i == 2) return 0.22;
  if (i == 3) return 0.26;
  return 0.20;
}

vec3 scene(vec2 q) {
  float t = uTime;
  float calm = uCalm;
  vec2 pointer = toScene(uPointer);

  // Organic, slowly breathing domain warp.
  vec2 w = vec2(fbm(q * 2.2 + vec2(t * 0.05, -t * 0.03)),
                fbm(q * 2.2 + vec2(5.2 - t * 0.04, 1.7 + t * 0.02))) - 0.5;
  vec2 qw = q + w * 0.12;

  float density = 0.0;
  vec3 tint = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    vec2 c = cellCenter(i, t);
    // Cells lean gently toward the pointer.
    vec2 toP = pointer - c;
    c += toP * 0.07 * exp(-dot(toP, toP) * 2.5);
    // A send pulse draws everything a touch inward.
    c *= 1.0 - 0.06 * uPulse;
    float r = cellRadius(i) * (1.0 + 0.05 * sin(t * 0.8 + float(i) * 1.7)) * (1.0 + 0.1 * uPulse);
    vec2 d = qw - c;
    float g = exp(-dot(d, d) / (r * r));
    density += g;
    tint += g * palette(i, uDark);
  }
  tint /= max(density, 1e-3);
  float body = 1.0 - exp(-density * 1.25);

  // Phase-contrast membrane: a thin bright halo where density crosses a threshold.
  float membrane = exp(-pow((body - 0.5) / 0.035, 2.0));
  // Vesicles: small bright specks living inside cells.
  float specks = smoothstep(0.72, 0.8, fbm(qw * 14.0 + t * 0.03)) * body;

  vec3 bg = mix(vec3(0.957, 0.969, 0.973), vec3(0.065, 0.08, 0.095), uDark);
  float amount = mix(0.7, 0.36, calm) * mix(1.0, 0.8, uDark);
  vec3 col = mix(bg, tint, body * amount);

  vec3 halo = mix(vec3(1.0), tint * 1.35 + 0.03, uDark);
  col = mix(col, halo, membrane * mix(0.3, 0.14, calm) * mix(1.0, 0.32, uDark));
  col += specks * mix(0.035, 0.05, uDark);

  // Soft light following the pointer.
  vec2 lp = q - pointer;
  col += exp(-dot(lp, lp) / 0.035) * mix(0.025, 0.04, uDark) * (1.0 - calm * 0.6);

  // Gentle vignette keeps edges calm.
  vec2 v = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - dot(v, v) * mix(0.08, 0.35, uDark);
  return col;
}

vec2 rippleOffset(vec2 px, out float glow) {
  vec2 offset = vec2(0.0);
  glow = 0.0;
  for (int i = 0; i < 4; i++) {
    vec3 r = uRipples[i];
    if (r.z < 0.0) continue;
    float life = clamp(r.z / 1.6, 0.0, 1.0);
    vec2 d = px - r.xy;
    float dist = length(d);
    float radius = r.z * 520.0 * uScale;
    float width = 46.0 * uScale;
    float ring = exp(-pow((dist - radius) / width, 2.0)) * (1.0 - life) * (1.0 - life);
    offset += (d / max(dist, 1.0)) * ring * 14.0 * uScale;
    glow += ring;
  }
  return offset;
}

void main() {
  vec2 px = gl_FragCoord.xy;
  float glow;
  vec2 rip = rippleOffset(px, glow);
  vec2 samplePx = px - rip;

  vec3 col;
  vec2 lp = px - uLens.xy;
  float d = sdRoundBox(lp, uLens.zw, uLensR);

  if (uLensOn > 0.001 && d < 0.0) {
    // Inside the glass: bend samples near the bevel, magnify slightly overall.
    float bevel = 30.0 * uScale;
    float e = 1.0 - clamp(-d / bevel, 0.0, 1.0);
    e = e * e;
    float h = 1.0;
    vec2 n = normalize(vec2(
      sdRoundBox(lp + vec2(h, 0.0), uLens.zw, uLensR) - sdRoundBox(lp - vec2(h, 0.0), uLens.zw, uLensR),
      sdRoundBox(lp + vec2(0.0, h), uLens.zw, uLensR) - sdRoundBox(lp - vec2(0.0, h), uLens.zw, uLensR)) + 1e-5);

    vec2 base = uLens.xy + (samplePx - uLens.xy) * 0.93;
    vec2 bend = -n * e * 26.0 * uScale * uLensOn;
    vec2 split = -n * e * 3.5 * uScale * uLensOn;

    vec3 refr;
    refr.r = scene(toScene(base + bend + split)).r;
    refr.g = scene(toScene(base + bend)).g;
    refr.b = scene(toScene(base + bend - split)).b;

    vec3 outside = scene(toScene(samplePx));
    vec3 frostTarget = mix(vec3(1.0), vec3(0.16, 0.18, 0.21), uDark);
    vec3 glass = mix(refr, frostTarget, mix(0.42, 0.28, uDark));
    // Rim light from above, faint shade below.
    float rim = smoothstep(bevel * 0.55, 0.0, -d);
    glass += rim * max(n.y, 0.0) * mix(0.12, 0.08, uDark);
    glass -= rim * max(-n.y, 0.0) * mix(0.025, 0.04, uDark);
    col = mix(outside, glass, uLensOn);
  } else {
    col = scene(toScene(samplePx));
    if (uLensOn > 0.001) {
      // Contact shadow beneath the glass.
      float ds = sdRoundBox(lp + vec2(0.0, 16.0 * uScale), uLens.zw, uLensR);
      float shadow = exp(-max(ds, 0.0) / (34.0 * uScale));
      col *= 1.0 - shadow * mix(0.07, 0.3, uDark) * uLensOn;
    }
  }

  col += glow * mix(0.03, 0.05, uDark);

  // Dither to avoid banding in the soft gradients.
  col += (hash(px + fract(uTime)) - 0.5) / 255.0 * 1.5;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
