// Text layout. Pure maths: the caller passes in how to measure a string, so
// this file never touches a canvas and can be tested in Node.

/** Width of `text` when set at `size` pixels. */
export type MeasureAt = (text: string, size: number) => number;

export type FitTextOptions = {
  size: number;
  minSize: number;
  maxLines: number;
  /** Multiple of the font size. */
  lineHeight: number;
};

export type FittedText = {
  size: number;
  /** Line height in whole pixels. */
  linePx: number;
  lines: string[];
  shrunk: boolean;
  truncated: boolean;
};

const ELLIPSIS = '…';

export function linePixels(size: number, lineHeight: number): number {
  return Math.round(size * lineHeight);
}

/**
 * Greedy word wrap. A line break in the text always starts a new line. A
 * single word that is wider than `maxWidth` gets a line of its own and is
 * never split.
 */
export function wrapLines(text: string, maxWidth: number, measure: (t: string) => number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measure(candidate) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Cut characters off the end until the text plus an ellipsis fits. */
export function ellipsize(text: string, maxWidth: number, measure: (t: string) => number): string {
  let cut = text.trimEnd();
  while (cut.length > 0 && measure(cut + ELLIPSIS) > maxWidth) {
    cut = cut.slice(0, -1).trimEnd();
  }
  return cut + ELLIPSIS;
}

/**
 * Fit text into a box. The steps are fixed, so the result is always the same:
 *
 * 1. Wrap at the requested size. If it fits, done.
 * 2. Otherwise shrink 1 px at a time, down to `minSize`.
 * 3. If it still does not fit at `minSize`, keep the lines that fit, end the
 *    last one with an ellipsis, and cut any line that is too wide.
 */
export function fitText(
  text: string,
  box: { w: number; h: number },
  options: FitTextOptions,
  measureAt: MeasureAt,
): FittedText {
  const start = Math.round(options.size);
  const min = Math.max(1, Math.min(start, Math.round(options.minSize)));

  for (let size = start; size >= min; size--) {
    const measure = (t: string) => measureAt(t, size);
    const linePx = linePixels(size, options.lineHeight);
    const lines = wrapLines(text, box.w, measure);
    const fits =
      lines.length <= options.maxLines &&
      lines.length * linePx <= box.h &&
      lines.every((line) => measure(line) <= box.w);
    if (fits) {
      return { size, linePx, lines, shrunk: size < start, truncated: false };
    }
  }

  const measure = (t: string) => measureAt(t, min);
  const linePx = linePixels(min, options.lineHeight);
  const all = wrapLines(text, box.w, measure);
  const room = Math.max(1, Math.min(options.maxLines, Math.floor(box.h / linePx)));
  const lines = all.slice(0, room).map((line) => (measure(line) > box.w ? ellipsize(line, box.w, measure) : line));
  const last = lines.length - 1;
  if (all.length > room && !lines[last].endsWith(ELLIPSIS)) {
    lines[last] = ellipsize(lines[last], box.w, measure);
  }
  return { size: min, linePx, lines, shrunk: min < start, truncated: true };
}
