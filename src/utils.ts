export const tryNumber = (s: string) => {
  const n = +s;
  return isNaN(n) ? s : n;
};

type Tuple = readonly any[];

type StaticEntries = (readonly [keyof any, unknown])[];

export const fromEntries = <const E extends StaticEntries>(entries: E) =>
  Object.fromEntries(entries) as { [I in E[number] as I[0]]: I[1] };

export const toEntries = <O extends Object>(o: O) =>
  Object.entries(o) as { [K in keyof O]: [K, O[K]] }[keyof O][];

export const repeat = <T>(n: number, fn: (i: number) => T) =>
  Array.from({ length: n }, (_, i) => fn(i));

export const shuffle = <T>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export interface EdgeValues<T> {
  top: T;
  right: T;
  bottom: T;
  left: T;
}

export type CornerRect = { x1: number; y1: number; x2: number; y2: number };

export class Rect {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {}

  static fromCorners({ x1, y1, x2, y2 }: CornerRect) {
    return new Rect(x1, y1, x2 - x1, y2 - y1);
  }

  shift(x: number, y: number) {
    return new Rect(this.x + x, this.y + y, this.width, this.height);
  }

  combine(other: Rect) {
    const x = Math.min(this.x, other.x);
    const y = Math.min(this.y, other.y);
    const width = Math.max(this.x + this.width, other.x + other.width) - x;
    const height = Math.max(this.y + this.height, other.y + other.height) - y;
    return new Rect(x, y, width, height);
  }

  gaps(inner: Rect) {
    return {
      top: inner.y - this.y,
      right: this.x + this.width - inner.x - inner.width,
      bottom: this.y + this.height - inner.y - inner.height,
      left: inner.x - this.x,
    };
  }

  withGaps(gaps: EdgeValues<number>) {
    return new Rect(
      this.x,
      this.y,
      this.width - gaps.left - gaps.right,
      this.height - gaps.top - gaps.bottom
    );
  }
}
