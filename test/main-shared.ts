import { BoxNode, TextNode } from '../src/nodes';
import { StyleData } from '../src/styles';
import { repeat, shuffle } from '../src/utils';
import { loremIpsum } from 'lorem-ipsum';

const box = (props: Partial<StyleData>, children?: (BoxNode | TextNode)[]) => {
  const node = new BoxNode();
  node.style.apply(props);
  children?.forEach((child) => node.add(child));
  return node;
};

const text = (props: Partial<StyleData>, text: string) => {
  const node = new TextNode(text);
  node.style.apply(props);
  return node;
};

const lorem = () => loremIpsum({ count: 5, units: 'words' });

// --- example starts here ---

const pageStyle: Partial<StyleData> = {
  padding: 32, gap: 32, bg: '#001', color: '#fff'
};

const containerStyle: Partial<StyleData> = {
  dir: 'row', wrap: true, gap: 8,
  justifyContent: 'space-between', alignItems: 'center',
};

const numberStyle: Partial<StyleData> = {
  bg: '#f9ca2433', color: '#f9ca24', 
  justifyContent: 'center', alignItems: 'center',
  fontSize: 32, width: 50, aspectRatio: 1, borderRadius: 25,
};

const loremStyle: Partial<StyleData> = {
  bg: '#fff2', fontSize: 16, padding: 16, width: 200,
};

const innerContent = () => {
  const items = repeat(10, (i) => [
    box(numberStyle, [text({ fontSize: 32 }, i.toString())]),
    text(loremStyle, lorem())
  ])
  return shuffle(items.flat());
};

export const scene = () => {
  return box(pageStyle, [
    text({ fontSize: 32 }, 'Hi, this is boxes!'),
    text({ fontSize: 16 }, `An experimental canvas renderer for "web-ish" node trees. Here's a bunch of shuffled items in a wrapping flex container:`),
    box(containerStyle, innerContent()),
  ]);
};
