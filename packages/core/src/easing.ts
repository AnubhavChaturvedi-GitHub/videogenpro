// Deterministic easing functions. p is always normalized 0..1.
export type EasingName =
  | 'linear'
  | 'easeIn' | 'easeOut' | 'easeInOut'
  | 'easeOutBack' | 'easeOutExpo' | 'easeOutCubic' | 'easeInOutCubic'
  | 'easeInExpo' | 'easeInCubic' | 'easeInOutBack' | 'easeOutQuint' | 'easeInOutQuint' | 'easeInOutExpo';

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const EASINGS: Record<EasingName, (p: number) => number> = {
  linear: (p) => p,
  easeIn: (p) => p * p,
  easeOut: (p) => 1 - (1 - p) * (1 - p),
  easeInOut: (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
  easeOutCubic: (p) => 1 - Math.pow(1 - p, 3),
  easeInOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  easeOutExpo: (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
  easeOutBack: (p) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
  },
  easeInCubic: (p) => p * p * p,
  easeInExpo: (p) => (p <= 0 ? 0 : Math.pow(2, 10 * p - 10)),
  easeInOutExpo: (p) =>
    p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2,
  easeOutQuint: (p) => 1 - Math.pow(1 - p, 5),
  easeInOutQuint: (p) => (p < 0.5 ? 16 * p * p * p * p * p : 1 - Math.pow(-2 * p + 2, 5) / 2),
  easeInOutBack: (p) => {
    const c1 = 1.70158, c2 = c1 * 1.525;
    return p < 0.5
      ? (Math.pow(2 * p, 2) * ((c2 + 1) * 2 * p - c2)) / 2
      : (Math.pow(2 * p - 2, 2) * ((c2 + 1) * (p * 2 - 2) + c2) + 2) / 2;
  },
};

export const ease = (name: EasingName | undefined, p: number): number =>
  (EASINGS[name ?? 'linear'] ?? EASINGS.linear)(clamp01(p));
