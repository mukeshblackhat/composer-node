import { fontString } from './layers/text';
import type { LoadedImage, RenderEnv, TextStyle } from './types';

/**
 * The browser RenderEnv. It measures text with the same kind of 2D context
 * that paints it, so layout and paint always agree.
 */
export function createCanvasEnv(
  ctx: CanvasRenderingContext2D,
  images: (id: string) => LoadedImage | undefined,
): RenderEnv {
  const apply = (style: TextStyle) => {
    ctx.font = fontString(style);
    ctx.letterSpacing = `${style.letterSpacing}px`;
  };

  return {
    measure(text, style) {
      if (!text) return 0;
      apply(style);
      // Canvas adds letter spacing after every letter, the last one too.
      // Take the trailing one off so centred text is truly centred.
      return ctx.measureText(text).width - style.letterSpacing;
    },
    metrics(style) {
      apply(style);
      const m = ctx.measureText('');
      return { ascent: m.fontBoundingBoxAscent, descent: m.fontBoundingBoxDescent };
    },
    image: images,
  };
}

/** False in browsers where canvas letter spacing does nothing. */
export function supportsLetterSpacing(): boolean {
  return 'letterSpacing' in CanvasRenderingContext2D.prototype;
}
