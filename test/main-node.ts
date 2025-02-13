import fs from 'node:fs';
import { createCanvas } from 'canvas';

import { scene } from './main-shared';

const ratio = 1.25;

const canvas = createCanvas(800, 800);
const ctx = canvas.getContext('2d')!;

const root = scene();

root.recompute(canvas.width / ratio, canvas.height / ratio);
ctx.scale(ratio, ratio);
root.draw(ctx as any);

const out = fs.createWriteStream('docs/test-images/out.png');
canvas.createPNGStream().pipe(out);
