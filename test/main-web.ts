import { scene } from './main-shared';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d')!;
document.body.appendChild(canvas);

const root = scene();

function draw() {
  const ratio = window.devicePixelRatio;
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  root.recompute(window.innerWidth, window.innerHeight);

  ctx.save();
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  root.draw(ctx);
  ctx.restore();
}

draw();
window.addEventListener('resize', draw);
