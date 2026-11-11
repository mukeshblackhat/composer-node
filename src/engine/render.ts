import { createCanvasEnv } from './env';
import { layerTypeOf } from './layers';
import type { Frame, InputSet, Layer, LoadedImage, Preset, RenderEnv, Warning } from './types';

export type LaidOutLayer = {
  layer: Layer;
  resolved: unknown | null;
  contentBox: Frame | null;
};

export type Layout = { items: LaidOutLayer[]; warnings: Warning[] };

export type RenderResult = Layout & { canvas: HTMLCanvasElement };

/** Step 1: turn a preset and its inputs into numbers. No drawing. */
export function layoutPreset(preset: Preset, inputs: InputSet, env: RenderEnv): Layout {
  const items: LaidOutLayer[] = [];
  const warnings: Warning[] = [];

  for (const layer of preset.layers) {
    if (!layer.visible) continue;
    const result = layerTypeOf(layer).layout(layer, inputs[layer.slot], env);
    items.push({ layer, resolved: result.resolved, contentBox: result.contentBox });
    for (const code of result.warnings) {
      warnings.push({ layerId: layer.id, slot: layer.slot, code });
    }
  }
  return { items, warnings };
}

/** Step 2: draw what step 1 decided, bottom layer first. */
export function paintLayout(
  ctx: CanvasRenderingContext2D,
  preset: Preset,
  layout: Layout,
  env: RenderEnv,
): void {
  const { width, height, background } = preset.artboard;
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  for (const item of layout.items) {
    if (item.resolved === null) continue;
    ctx.save();
    layerTypeOf(item.layer).paint(ctx, item.layer, item.resolved, env);
    ctx.restore();
  }
}

// Reused for every render into a target. It is filled and copied out in one
// go, so nothing ever sees it half done.
let scratch: HTMLCanvasElement | null = null;

/**
 * The one way to make pixels. The preview, the PNG export and the batch run
 * all call this. Pass a canvas to draw into it, or leave it out to get a
 * new one. The canvas is always exactly the artboard size.
 *
 * Painting always happens on a canvas that is not on the page, and the
 * result is then copied into the target. A canvas on the page inherits CSS
 * such as font smoothing, which changes how its text is drawn; painting
 * there would make the preview differ from the export.
 */
export function render(
  preset: Preset,
  inputs: InputSet,
  images: (id: string) => LoadedImage | undefined,
  target?: HTMLCanvasElement,
): RenderResult {
  const { width, height } = preset.artboard;
  const canvas = target ? (scratch ??= document.createElement('canvas')) : document.createElement('canvas');
  // Setting the size also resets every bit of context state.
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('This browser cannot create a 2D canvas.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fontKerning = 'normal';

  const env = createCanvasEnv(ctx, images);
  const layout = layoutPreset(preset, inputs, env);
  paintLayout(ctx, preset, layout, env);
  if (!target) return { canvas, ...layout };

  target.width = width;
  target.height = height;
  const out = target.getContext('2d', { willReadFrequently: true });
  if (!out) throw new Error('This browser cannot create a 2D canvas.');
  // Same size, no scaling: every pixel is copied as it is.
  out.globalCompositeOperation = 'copy';
  out.drawImage(canvas, 0, 0);
  return { canvas: target, ...layout };
}
