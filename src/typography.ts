import openType, { Font } from 'opentype.js';

import { Rect } from './utils';

export const fonts = await loadFonts({
  normal: 'open-sans-variable.ttf',
});

type FontPath = `${string}.ttf`;

export async function loadFonts<T extends Record<string, FontPath>>(
  options: T
) {
  const fontMap: Record<string, Font> = {};

  for (let [key, path] of Object.entries(options)) {
    // If running in node, alias path into the test assets for now
    if (typeof window === 'undefined') {
      path = `test/public/${path}`;
    }

    const font = await openType.load(path);
    fontMap[key] = font;
  }

  return fontMap;
}

interface TextOptions {
  font: keyof typeof fonts;
  fontSize: number;
  lineHeight: number;
}

type OffsetPath = {
  path: openType.Path;
  x: number;
  y: number;
};

interface Result {
  bounds: Rect;
  paths: OffsetPath[];
}

const wordCache = new Map<string, Result>();
export const usedWords = new Set<string>();

function hashWordKey(text: string, { font, fontSize }: TextOptions) {
  return `${text}-${font}-${fontSize}`;
}

function measureWord(text: string, options: TextOptions): Result {
  const key = hashWordKey(text, options);
  usedWords.add(key);

  if (wordCache.has(key)) return wordCache.get(key)!;

  const { font, fontSize } = options;

  const path = fonts[font].getPath(text, 0, 0, fontSize);
  const rect = Rect.fromCorners(path.getBoundingBox());
  const result = {
    bounds: rect,
    paths: [{ path, x: -rect.x, y: -rect.y }],
  };

  wordCache.set(key, result);

  return result;
}

export function measureText(
  text: string,
  options: TextOptions,
  maxWidth: number | undefined
): Result {
  if (text === '') return { bounds: new Rect(0, 0, 0, 0), paths: [] };

  const { fontSize, lineHeight } = options;

  if (maxWidth === undefined) return measureWord(text, options);

  const words = text.split(' ');

  let bounds: Rect | undefined;
  let paths: OffsetPath[] = [];

  let lastResult: Result | undefined;
  let currentLine = '';
  let currentY = 0;

  const addLine = (text: string) => {
    let { bounds: rect, paths: subPaths } = measureWord(text, options);
    rect = rect.shift(0, currentY);
    bounds = bounds ? bounds.combine(rect) : rect;

    for (const { path, x, y } of subPaths)
      paths.push({ path, x, y: y + currentY });

    currentY += fontSize * lineHeight;
  };

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    lastResult = measureWord(testLine, options);
    if (lastResult.bounds.width > maxWidth) {
      addLine(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  addLine(currentLine);

  if (bounds == undefined) throw new Error('Bounds is undefined');
  const result = { bounds, paths };
  return result;
}
