export function traceRoundedRect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number
) {
  if (radius == 0) {
    ctx.rect(0, 0, width, height);
    return;
  }

  if (radius == width / 2) {
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    return;
  }

  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.quadraticCurveTo(width, 0, width, radius);
  ctx.lineTo(width, height - radius);
  ctx.quadraticCurveTo(width, height, width - radius, height);
  ctx.lineTo(radius, height);
  ctx.quadraticCurveTo(0, height, 0, height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
}
