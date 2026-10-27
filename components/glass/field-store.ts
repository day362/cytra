/**
 * Shared, framework-free state between the DOM and the WebGL cytoplasm field.
 *
 * Components register the element that should act as a refracting lens and
 * emit ripples / pulses; the canvas reads this store every animation frame.
 * Kept outside React state on purpose: these values change at 60fps and must
 * never trigger re-renders.
 */

export type Ripple = { x: number; y: number; born: number };

type FieldState = {
  lens: HTMLElement | null;
  ripples: Ripple[];
  pulseAt: number;
  /** 0 = hero (full presence), 1 = calm (reading surfaces). */
  calm: number;
};

const MAX_RIPPLES = 4;

export const field: FieldState = {
  lens: null,
  ripples: [],
  pulseAt: -Infinity,
  calm: 0,
};

export function setLens(el: HTMLElement | null) {
  field.lens = el;
}

/** Releases the lens only if `el` still owns it (avoids races between mounts). */
export function releaseLens(el: HTMLElement | null) {
  if (field.lens === el) field.lens = null;
}

/** Client (CSS px) coordinates. */
export function emitRipple(x: number, y: number) {
  field.ripples.push({ x, y, born: performance.now() });
  if (field.ripples.length > MAX_RIPPLES) field.ripples.shift();
}

/** A soft contraction of the whole field, used when a message is sent. */
export function emitPulse() {
  field.pulseAt = performance.now();
}

export function setCalm(value: number) {
  field.calm = Math.min(1, Math.max(0, value));
}
