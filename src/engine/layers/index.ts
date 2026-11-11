import type { Layer } from '../types';
import { imageLayer } from './image';
import type { LayerType } from './layerType';
import { textLayer } from './text';

export type { LayerType, LayoutResult } from './layerType';

/**
 * Every layer type the engine knows. To add one, write its file, add its
 * type to the `Layer` union and add it here.
 */
const registry: { [K in Layer['type']]: LayerType<Extract<Layer, { type: K }>, never> } = {
  image: imageLayer as never,
  text: textLayer as never,
};

export function layerTypeOf(layer: Layer): LayerType {
  return registry[layer.type] as unknown as LayerType;
}

export const layerTypes = Object.values(registry) as unknown as LayerType[];
