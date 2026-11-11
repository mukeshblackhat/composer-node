import { fitImage, type ImagePlacement } from '../fit';
import type { BlendMode, ImageLayer } from '../types';
import type { LayerType } from './layerType';

type ResolvedImage = { assetId: string; placement: ImagePlacement };

const COMPOSITE: Record<BlendMode, GlobalCompositeOperation> = {
  normal: 'source-over',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  darken: 'darken',
  lighten: 'lighten',
};

export const imageLayer: LayerType<ImageLayer, ResolvedImage> = {
  type: 'image',
  slotType: 'image',

  defaults: (base) => ({
    ...base,
    type: 'image',
    visible: true,
    opacity: 1,
    blend: 'normal',
    fit: 'contain',
    anchor: { x: 0.5, y: 0.5 },
  }),

  layout(layer, input, env) {
    if (!input) return { resolved: null, contentBox: null, warnings: ['missing-input'] };
    const image = env.image(input);
    if (!image) return { resolved: null, contentBox: null, warnings: ['missing-asset'] };

    const placement = fitImage(image, layer.frame, layer.fit, layer.anchor);
    return {
      resolved: { assetId: input, placement },
      contentBox: { x: placement.dx, y: placement.dy, w: placement.dw, h: placement.dh },
      warnings: [],
    };
  },

  paint(ctx, layer, resolved, env) {
    const image = env.image(resolved.assetId);
    if (!image) return;
    const p = resolved.placement;
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = COMPOSITE[layer.blend];
    ctx.drawImage(image.source, p.sx, p.sy, p.sw, p.sh, p.dx, p.dy, p.dw, p.dh);
  },
};
