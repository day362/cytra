"use client";

import { useEffect, useRef } from "react";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./cytoplasm-shader";
import { emitRipple, field } from "./field-store";

/** Fraction of device resolution we render at. The field is soft by nature. */
const RENDER_SCALE = 0.5;
const MAX_DPR = 1.5;
const RIPPLE_LIFE_S = 1.6;
const PULSE_LIFE_MS = 1400;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("createShader failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

/** Arbitrary point in the animation where the cells sit in a pleasing layout. */
const BASE_TIME = 18;

function isDarkTheme(systemDark: MediaQueryList) {
  const forced = document.documentElement.dataset.theme;
  if (forced === "dark") return true;
  if (forced === "light") return false;
  return systemDark.matches;
}

/**
 * Full-viewport WebGL background. Falls back silently to the CSS gradient on
 * <body> when WebGL is unavailable or the context is lost.
 */
export function CytoplasmCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const root = document.documentElement;

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    let program: WebGLProgram;
    try {
      const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      const p = gl.createProgram();
      if (!p) return;
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.warn("[cytoplasm] link failed", gl.getProgramInfoLog(p));
        return;
      }
      program = p;
    } catch (err) {
      console.warn("[cytoplasm]", err);
      return;
    }

    gl.useProgram(program);
    // One oversized triangle covers the viewport.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(program, "uRes"),
      scale: gl.getUniformLocation(program, "uScale"),
      time: gl.getUniformLocation(program, "uTime"),
      pointer: gl.getUniformLocation(program, "uPointer"),
      dark: gl.getUniformLocation(program, "uDark"),
      calm: gl.getUniformLocation(program, "uCalm"),
      pulse: gl.getUniformLocation(program, "uPulse"),
      lens: gl.getUniformLocation(program, "uLens"),
      lensR: gl.getUniformLocation(program, "uLensR"),
      lensOn: gl.getUniformLocation(program, "uLensOn"),
      ripples: gl.getUniformLocation(program, "uRipples"),
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

    let cssW = 0;
    let cssH = 0;
    let scale = 1;
    const resize = () => {
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      scale = dpr * RENDER_SCALE;
      canvas.width = Math.max(1, Math.round(cssW * scale));
      canvas.height = Math.max(1, Math.round(cssH * scale));
      scale = canvas.width / cssW;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    // Smoothed state.
    const pointer = { x: cssW * 0.5, y: cssH * 0.45, tx: cssW * 0.5, ty: cssH * 0.45 };
    let dark = isDarkTheme(darkQuery) ? 1 : 0;
    let calm = field.calm;
    let lensOn = 0;
    const lens = { cx: 0, cy: 0, hw: 0, hh: 0, r: 0 };
    let lensSeeded = false;

    const onPointerMove = (e: PointerEvent) => {
      pointer.tx = e.clientX;
      pointer.ty = e.clientY;
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!reducedMotion.matches) emitRipple(e.clientX, e.clientY);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("resize", resize);

    const ripples = new Float32Array(12);
    const start = performance.now();
    let lastSignature = "";
    let raf = 0;
    let running = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const reduce = reducedMotion.matches;
      const k = reduce ? 1 : 0.08;

      pointer.x += (pointer.tx - pointer.x) * k;
      pointer.y += (pointer.ty - pointer.y) * k;
      dark += ((isDarkTheme(darkQuery) ? 1 : 0) - dark) * (reduce ? 1 : 0.06);
      calm += (field.calm - calm) * (reduce ? 1 : 0.05);

      const el = field.lens;
      let lensTarget = 0;
      if (el && el.isConnected) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.bottom > 0 && rect.top < cssH) {
          lensTarget = 1;
          const radius = Number(el.dataset.lensRadius ?? 24);
          const next = {
            cx: (rect.left + rect.width / 2) * scale,
            cy: (cssH - (rect.top + rect.height / 2)) * scale,
            hw: (rect.width / 2) * scale,
            hh: (rect.height / 2) * scale,
            r: Math.min(radius * scale, (Math.min(rect.width, rect.height) / 2) * scale),
          };
          // The DOM already animates the composer; follow it exactly.
          Object.assign(lens, next);
          lensSeeded = true;
        }
      }
      lensOn += (lensTarget - lensOn) * (reduce ? 1 : 0.12);

      const t = reduce ? BASE_TIME : BASE_TIME + ((now - start) / 1000) * 0.55;

      // With reduced motion the field is a still image: redraw only on change.
      if (reduce) {
        const signature = `${canvas.width}|${lens.cx | 0}|${lens.cy | 0}|${lens.hw | 0}|${lens.hh | 0}|${lensOn.toFixed(2)}|${dark.toFixed(2)}|${calm.toFixed(2)}`;
        if (signature === lastSignature) return;
        lastSignature = signature;
      }

      const pulseAge = now - field.pulseAt;
      const pulse = reduce || pulseAge > PULSE_LIFE_MS ? 0 : Math.sin((pulseAge / PULSE_LIFE_MS) * Math.PI);

      for (let i = 0; i < 4; i++) {
        const r = field.ripples[i];
        const age = r ? (now - r.born) / 1000 : -1;
        if (r && age <= RIPPLE_LIFE_S && !reduce) {
          ripples[i * 3] = r.x * scale;
          ripples[i * 3 + 1] = (cssH - r.y) * scale;
          ripples[i * 3 + 2] = age;
        } else {
          ripples[i * 3 + 2] = -1;
        }
      }
      field.ripples = field.ripples.filter((r) => (now - r.born) / 1000 <= RIPPLE_LIFE_S);

      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.scale, scale);
      gl.uniform1f(u.time, t);
      gl.uniform2f(u.pointer, pointer.x * scale, (cssH - pointer.y) * scale);
      gl.uniform1f(u.dark, dark);
      gl.uniform1f(u.calm, calm);
      gl.uniform1f(u.pulse, pulse);
      gl.uniform4f(u.lens, lens.cx, lens.cy, lens.hw, lens.hh);
      gl.uniform1f(u.lensR, lens.r);
      gl.uniform1f(u.lensOn, lensSeeded ? lensOn : 0);
      gl.uniform3fv(u.ripples, ripples);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const play = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVisibility);

    const onLost = (e: Event) => {
      e.preventDefault();
      pause();
      root.dataset.gl = "off";
    };
    canvas.addEventListener("webglcontextlost", onLost);

    root.dataset.gl = "on";
    canvas.dataset.ready = "true";
    play();

    return () => {
      pause();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      delete root.dataset.gl;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-0 transition-opacity duration-1000 data-[ready=true]:opacity-100"
    />
  );
}
