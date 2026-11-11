import { fitText } from '../text';
import type { TextLayer, TextStyle, WarningCode } from '../types';
import type { LayerType } from './layerType';

type ResolvedLine = { text: string; x: number; baseline: number };
type ResolvedText = { style: TextStyle; lines: ResolvedLine[] };

const ALIGN = { left: 0, center: 0.5, right: 1 } as const;
const VALIGN = { top: 0, middle: 0.5, bottom: 1 } as const;

export const textLayer: LayerType<TextLayer, ResolvedText> = {
  type: 'text',
  slotType: 'text',

  defaults: (base) => ({
    ...base,
    type: 'text',
    visible: true,
    family: 'Inter',
    weight: 400,
    size: 48,
    color: '#111111',
    align: 'center',
    valign: 'middle',
    lineHeight: 1.2,
    letterSpacing: 0,
    overflow: { minSize: 24, maxLines: 3 },
  }),

  layout(layer, input, env) {
    if (!input || !input.trim()) return { resolved: null, contentBox: null, warnings: ['missing-input'] };

    const { frame } = layer;
    const styleAt = (size: number): TextStyle => ({
      family: layer.family,
      weight: layer.weight,
      size,
      letterSpacing: layer.letterSpacing,
    });

    const fitted = fitText(
      input,
      { w: frame.w, h: frame.h },
      { size: layer.size, lineHeight: layer.lineHeight, ...layer.overflow },
      (text, size) => env.measure(text, styleAt(size)),
    );

    const style = styleAt(fitted.size);
    const { ascent, descent } = env.metrics(style);
    const blockHeight = fitted.lines.length * fitted.linePx;
    const top = frame.y + Math.round((frame.h - blockHeight) * VALIGN[layer.valign]);
    // Centre the font box inside each line box, then land on a whole pixel.
    const firstBaseline = top + Math.round((fitted.linePx - (ascent + descent)) / 2 + ascent);

    let widest = 0;
    const lines = fitted.lines.map((text, i) => {
      const width = env.measure(text, style);
      widest = Math.max(widest, width);
      return {
        text,
        x: frame.x + Math.round((frame.w - width) * ALIGN[layer.align]),
        baseline: firstBaseline + i * fitted.linePx,
      };
    });

    const warnings: WarningCode[] = [];
    if (fitted.truncated) warnings.push('text-truncated');
    else if (fitted.shrunk) warnings.push('text-shrunk');

    const boxW = Math.min(frame.w, Math.ceil(widest));
    return {
      resolved: { style, lines },
      contentBox: {
        x: frame.x + Math.round((frame.w - boxW) * ALIGN[layer.align]),
        y: top,
        w: boxW,
        h: blockHeight,
      },
      warnings,
    };
  },

  paint(ctx, layer, resolved) {
    const { style } = resolved;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.font = fontString(style);
    ctx.letterSpacing = `${style.letterSpacing}px`;
    ctx.fillStyle = layer.color;
    // The engine works out x and the baseline itself, so the browser never
    // decides alignment.
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    for (const line of resolved.lines) {
      ctx.fillText(line.text, line.x, line.baseline);
    }
  },
};

/** The one place that turns a TextStyle into a CSS font string. */
export function fontString(style: TextStyle): string {
  return `${style.weight} ${style.size}px "${style.family}"`;
}
