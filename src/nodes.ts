import Yoga, { Node as YgNode } from 'yoga-layout';

import { Style } from './styles';
import { traceRoundedRect } from './canvas';
import { Rect } from './utils';
import { measureText } from './typography';

interface LayoutResult {
  bounds: Rect;
  content: Rect;
}

type ContainerNode = BoxNode;

let nextNodeId = 0;

export abstract class Node<ChildNode extends Node = any> {
  readonly id = nextNodeId++;

  style: Style = new Style(this);

  protected layout?: LayoutResult;
  yoga?: YgNode;

  parent: ContainerNode | null = null;
  children: ChildNode[] = [];

  add(node: ChildNode) {
    this.children.push(node);
    Reflect.set(node, 'parent', this);
    return this;
  }

  recompute(width: number | 'auto', height: number | 'auto') {
    this.style.width = width;
    this.style.height = height;
    this.style.margin = 0;

    this.beforeRecompute();

    this.yoga!.calculateLayout(width, height, Yoga.DIRECTION_LTR);
    this.didRecompute();

    this.afterRecompute();
    return true;
  }

  beforeRecompute() {
    if (this.yoga) return;
    this.yoga = Yoga.Node.create();
    this.style.writeToLayoutNode(this.yoga, this);

    for (const c of this.children) {
      c.beforeRecompute();
      this.yoga.insertChild(c.yoga!, this.yoga.getChildCount());
    }
  }

  didRecompute() {
    if (!this.yoga) return;

    let parentX = this.parent?.layout!.content.x ?? 0;
    let parentY = this.parent?.layout!.content.y ?? 0;

    const bounds = new Rect(
      this.yoga.getComputedLeft() - parentX,
      this.yoga.getComputedTop() - parentY,
      this.yoga.getComputedWidth(),
      this.yoga.getComputedHeight()
    );

    const paddingT = this.yoga.getComputedPadding(Yoga.EDGE_TOP);
    const paddingR = this.yoga.getComputedPadding(Yoga.EDGE_RIGHT);
    const paddingB = this.yoga.getComputedPadding(Yoga.EDGE_BOTTOM);
    const paddingL = this.yoga.getComputedPadding(Yoga.EDGE_LEFT);

    const borderT = this.yoga.getComputedBorder(Yoga.EDGE_TOP);
    const borderR = this.yoga.getComputedBorder(Yoga.EDGE_RIGHT);
    const borderB = this.yoga.getComputedBorder(Yoga.EDGE_BOTTOM);
    const borderL = this.yoga.getComputedBorder(Yoga.EDGE_LEFT);

    const gapT = paddingT + borderT;
    const gapR = paddingR + borderR;
    const gapB = paddingB + borderB;
    const gapL = paddingL + borderL;

    const content = new Rect(
      gapL,
      gapT,
      bounds.width - gapL - gapR,
      bounds.height - gapT - gapB
    );

    this.layout = { bounds, content };

    for (const c of this.children) c.didRecompute();
  }

  afterRecompute() {
    this.yoga?.free();
    this.yoga = undefined;
    for (const c of this.children) c.afterRecompute();
  }

  static drawBox(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    style: Style
  ) {
    ctx.beginPath();
    traceRoundedRect(ctx, w, h, style.borderRadius);
    ctx.closePath();

    if (style.bg) {
      ctx.fillStyle = style.bg;
      ctx.fill();
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { x, y, width, height } = this.layout!.bounds;

    ctx.save();

    ctx.translate(x, y);

    Node.drawBox(ctx, width, height, this.style);

    const { x: contentX, y: contentY } = this.layout!.content;
    ctx.translate(contentX, contentY);
    this.children.forEach((child) => child.draw(ctx));

    ctx.restore();
  }
}

export class BoxNode extends Node<BoxNode | TextNode> {}

export class TextNode extends Node<never> {
  constructor(public text: string) {
    super();
  }

  private textOptionsForWidth(maxWidth?: number) {
    return {
      font: 'normal',
      fontSize: this.style.fontSize,
      lineHeight: this.style.lineHeight,
      maxWidth,
    };
  }

  measure(maxWidth: number | undefined) {
    return measureText(this.text, this.textOptionsForWidth(maxWidth), maxWidth);
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);

    const { bounds, content } = this.layout!;

    const { paths } = this.measure(content.width);

    ctx.translate(bounds.x, bounds.y);

    ctx.translate(content.x, content.y);

    for (let { path, x, y } of paths) {
      ctx.translate(x, y);
      path.fill = this.style.color;
      path.draw(ctx);
      ctx.translate(-x, -y);
    }

    ctx.translate(-bounds.x, -bounds.y);
    ctx.translate(-content.x, -content.y);
  }

  beforeRecompute(): void {
    super.beforeRecompute();
    this.yoga!.setMeasureFunc((w, wMode, h, hMode) => {
      let maxWidth: number | undefined = undefined;
      if (wMode !== Yoga.MEASURE_MODE_UNDEFINED) maxWidth = w;
      return this.measure(maxWidth).bounds;
    });
  }
}
