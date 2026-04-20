export type DisplayMood = 'idle' | 'thinking' | 'happy' | 'reminding';

type LottieColor = [number, number, number, number];

interface LottieAnimation {
  readonly v: string;
  readonly fr: number;
  readonly ip: number;
  readonly op: number;
  readonly w: number;
  readonly h: number;
  readonly nm: string;
  readonly ddd: number;
  readonly assets: readonly unknown[];
  readonly layers: readonly Record<string, unknown>[];
}

function createPetAnimation(
  mood: DisplayMood,
  ringColor: LottieColor,
  coreColor: LottieColor,
  spinEnd: number,
  pulseScale: number,
): LottieAnimation {
  return {
    v: '5.9.4',
    fr: 30,
    ip: 0,
    op: 120,
    w: 256,
    h: 256,
    nm: `pet-${mood}`,
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'ring',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: {
            a: 1,
            k: [{ t: 0, s: [0] }, { t: 120, s: [spinEnd] }],
          },
          p: { a: 0, k: [128, 128, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 1,
            k: [{ t: 0, s: [100, 100, 100] }, { t: 60, s: [pulseScale, pulseScale, 100] }, { t: 120, s: [100, 100, 100] }],
          },
        },
        shapes: [
          { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [168, 168] }, nm: 'ring-path' },
          { ty: 'st', c: { a: 0, k: ringColor }, o: { a: 0, k: 100 }, w: { a: 0, k: 10 }, lc: 2, lj: 2, nm: 'ring-stroke' },
          {
            ty: 'tr',
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
            nm: 'ring-transform',
          },
        ],
        ip: 0,
        op: 120,
        st: 0,
        bm: 0,
      },
      {
        ddd: 0,
        ind: 2,
        ty: 4,
        nm: 'core',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: {
            a: 1,
            k: [{ t: 0, s: [128, 132, 0] }, { t: 60, s: [128, 120, 0] }, { t: 120, s: [128, 132, 0] }],
          },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 1,
            k: [{ t: 0, s: [100, 100, 100] }, { t: 40, s: [116, 116, 100] }, { t: 80, s: [100, 100, 100] }, { t: 120, s: [108, 108, 100] }],
          },
        },
        shapes: [
          { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [74, 74] }, nm: 'core-path' },
          { ty: 'fl', c: { a: 0, k: coreColor }, o: { a: 0, k: 100 }, r: 1, nm: 'core-fill' },
          {
            ty: 'tr',
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
            nm: 'core-transform',
          },
        ],
        ip: 0,
        op: 120,
        st: 0,
        bm: 0,
      },
    ],
  };
}

export const petLottieByMood: Record<DisplayMood, LottieAnimation> = {
  idle: createPetAnimation('idle', [0.76, 0.57, 0.31, 1], [0.98, 0.82, 0.58, 1], 120, 104),
  thinking: createPetAnimation('thinking', [0.33, 0.62, 0.95, 1], [0.65, 0.83, 1, 1], 300, 112),
  happy: createPetAnimation('happy', [0.25, 0.76, 0.44, 1], [0.62, 0.95, 0.7, 1], 180, 118),
  reminding: createPetAnimation('reminding', [0.98, 0.56, 0.19, 1], [1, 0.78, 0.45, 1], 220, 115),
};
