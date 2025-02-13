import Yoga, { Node as YgNode } from 'yoga-layout';
import { toEntries } from './utils';
import { Node } from './nodes';

const testUnits = (v: string, unit: string) => {
  return new RegExp(`^\\d+(\\.\\d+)?(${unit})$`).test(v);
};

const fail = Symbol();

type Parser<T> = (v: any) => T | typeof fail;

const unit =
  <T extends string>(unit: T): Parser<`${number}${T}`> =>
  (v: any) => {
    if (typeof v === 'string' && testUnits(v, unit)) {
      return v as `${number}${T}`;
    }
    return fail;
  };

const union =
  <T extends readonly Parser<any>[]>(
    parsers: T
  ): Parser<ReturnType<T[number]>> =>
  (v: any) => {
    for (const parser of parsers) {
      const result = parser(v);
      if (result !== fail) return result as ReturnType<T[number]>;
    }
    return fail;
  };

const literal =
  <T>(value: T): Parser<T> =>
  (v: any) =>
    v === value ? v : fail;

const subTypes = {
  hexColor: union([
    (v: any) =>
      typeof v === 'string' && /^#[0-9a-f]{3,4}$/i.test(v) ? v : fail,

    (v: any) =>
      typeof v === 'string' && /^#[0-9a-f]{6,8}$/i.test(v) ? v : fail,
  ]),

  unitless: (v: any) => (typeof v === 'number' ? v : fail),
};

const types = {
  unitless: subTypes.unitless,

  bool: (v: any) => (typeof v === 'boolean' ? v : fail),

  percent: unit('%'),

  lengthPercent: union([subTypes.unitless, unit('%')]),

  lengthOptional: union([subTypes.unitless, unit('%'), literal(null)]),

  lengthAuto: union([subTypes.unitless, unit('%'), literal(<const>'auto')]),

  color: union([subTypes.hexColor, literal(<const>'transparent')]),

  flow: union([literal(<const>'row'), literal(<const>'column')]),

  align: union([
    literal(<const>'start'),
    literal(<const>'end'),
    literal(<const>'center'),
    literal(<const>'stretch'),
  ]),

  justify: union([
    literal(<const>'start'),
    literal(<const>'end'),
    literal(<const>'center'),
    literal(<const>'space-between'),
    literal(<const>'space-around'),
    literal(<const>'space-evenly'),
  ]),
};

type Type = keyof typeof types;
type TypeValue<T extends Type> = Exclude<
  ReturnType<(typeof types)[T]>,
  typeof fail
>;

export class StyleProp<T extends Type> {
  isInherited = false;

  layoutCallback?: (layout: YgNode, value: TypeValue<T>) => any;

  constructor(public readonly type: T, public readonly value: TypeValue<T>) {}

  inherit() {
    this.isInherited = true;
    return this;
  }

  layout(fn?: (typeof this)['layoutCallback']) {
    if (!fn) fn = () => {};
    this.layoutCallback = fn;
    return this;
  }
}

const props = <const>{
  color: new StyleProp('color', '#000000').inherit(),

  bg: new StyleProp('color', 'transparent'),

  width: new StyleProp('lengthAuto', 'auto').layout((y, v) => {
    y.setWidth(v);
  }),

  height: new StyleProp('lengthAuto', 'auto').layout((y, v) => {
    y.setHeight(v);
  }),

  minWidth: new StyleProp('lengthOptional', null).layout((y, v) => {
    y.setMinWidth(v ?? undefined);
  }),

  minHeight: new StyleProp('lengthOptional', null).layout((y, v) => {
    y.setMinHeight(v ?? undefined);
  }),

  maxWidth: new StyleProp('lengthOptional', null).layout((y, v) => {
    y.setMaxWidth(v ?? undefined);
  }),

  maxHeight: new StyleProp('lengthOptional', null).layout((y, v) =>
    y.setMaxWidth(v ?? undefined)
  ),

  fontSize: new StyleProp('unitless', 16).inherit().layout(),

  lineHeight: new StyleProp('unitless', 1.5).inherit().layout(),

  wrap: new StyleProp('bool', false).layout((y, v) => {
    y.setFlexWrap(v ? Yoga.WRAP_WRAP : Yoga.WRAP_NO_WRAP);
  }),

  alignItems: new StyleProp('align', 'start').layout((y, v) => {
    if (v == 'start') y.setAlignItems(Yoga.ALIGN_FLEX_START);
    if (v == 'end') y.setAlignItems(Yoga.ALIGN_FLEX_END);
    if (v == 'center') y.setAlignItems(Yoga.ALIGN_CENTER);
    if (v == 'stretch') y.setAlignItems(Yoga.ALIGN_STRETCH);
  }),

  alignContent: new StyleProp('align', 'start').layout((y, v) => {
    if (v == 'start') y.setAlignContent(Yoga.ALIGN_FLEX_START);
    if (v == 'end') y.setAlignContent(Yoga.ALIGN_FLEX_END);
    if (v == 'center') y.setAlignContent(Yoga.ALIGN_CENTER);
    if (v == 'stretch') y.setAlignContent(Yoga.ALIGN_STRETCH);
  }),

  justifyContent: new StyleProp('justify', 'start').layout((y, v) => {
    if (v == 'start') y.setJustifyContent(Yoga.JUSTIFY_FLEX_START);
    if (v == 'end') y.setJustifyContent(Yoga.JUSTIFY_FLEX_END);
    if (v == 'center') y.setJustifyContent(Yoga.JUSTIFY_CENTER);
    if (v == 'space-between') y.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN);
    if (v == 'space-around') y.setJustifyContent(Yoga.JUSTIFY_SPACE_AROUND);
    if (v == 'space-evenly') y.setJustifyContent(Yoga.JUSTIFY_SPACE_EVENLY);
  }),

  dir: new StyleProp('flow', 'column').layout((y, v) => {
    if (v == 'row') y.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
    else y.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN);
  }),

  shrink: new StyleProp('unitless', 0).layout((y, v) => {
    y.setFlexShrink(v);
  }),

  grow: new StyleProp('unitless', 0).layout((y, v) => {
    y.setFlexGrow(v);
  }),

  gap: new StyleProp('lengthPercent', 0).layout((y, v) => {
    y.setGap(Yoga.GUTTER_ALL, v);
  }),

  borderColor: new StyleProp('color', 'transparent'),

  borderRadius: new StyleProp('unitless', 0),

  borderWidth: new StyleProp('unitless', 0).layout((y, v) => {
    y.setBorder(Yoga.EDGE_ALL, v);
  }),

  hide: new StyleProp('bool', false).layout((y, v) => {
    y.setDisplay(v ? Yoga.DISPLAY_NONE : Yoga.DISPLAY_FLEX);
  }),

  opacity: new StyleProp('unitless', 1),

  padding: new StyleProp('lengthPercent', 0).layout((y, v) => {
    y.setPadding(Yoga.EDGE_ALL, v);
  }),

  margin: new StyleProp('lengthAuto', 0).layout((y, v) => {
    y.setMargin(Yoga.EDGE_ALL, v);
  }),

  aspectRatio: new StyleProp('unitless', 0).layout((y, v) => {
    y.setAspectRatio(v);
  }),
};

export type StylePropName = keyof typeof props;

type PropType<T extends StylePropName> = (typeof props)[T]['type'];

export type StyleData = {
  [K in StylePropName]: TypeValue<PropType<K>>;
};

class OwnedStyle {
  private stored!: StyleData;

  constructor(private owner: Node<any>) {
    this.stored = {} as StyleData;
    for (const [name, prop] of toEntries(props)) {
      Object.defineProperty(this, name, {
        get: () => this.get(name),
        set: (v: any) => this.set(name, v),
        enumerable: true,
      });
    }
  }

  writeToLayoutNode(yoga: YgNode, from: Node<any>) {
    for (const [prop] of toEntries(props)) {
      // @ts-ignore
      props[prop].layoutCallback?.(yoga, this.get(prop));
    }
  }

  set<T extends StylePropName>(prop: T, to: TypeValue<PropType<T>>) {
    const parser = types[props[prop].type];
    const result = parser(to);

    if (result === fail) throw new Error(`Invalid value for ${prop}: ${to}`);

    Reflect.set(this.stored, prop, result);
  }

  apply(style: Partial<StyleData>) {
    Object.assign(this, style);
  }

  get<T extends StylePropName>(prop: T) {
    let found = Reflect.get(this.stored, prop);
    if (found !== undefined) return found;
    if (this.owner.parent && props[prop].isInherited) {
      return this.owner.parent.style.get(prop);
    }
    return props[prop].value;
  }
}

// TODO: This is gross but makes the types nice, has to be a better way...

export const Style: new (owner: Node<any>) => OwnedStyle & StyleData =
  OwnedStyle as any;
export type Style = InstanceType<typeof Style>;
