import type { ComponentType } from 'react';
import type { Layer } from '../../../engine';
import { ImageInspector } from './ImageInspector';
import { TextInspector } from './TextInspector';

/**
 * The property panel for each layer type. It mirrors the engine's layer
 * registry; the engine stays free of React, so the UI half lives here.
 */
const inspectors: { [K in Layer['type']]: ComponentType<{ layer: Extract<Layer, { type: K }> }> } = {
  image: ImageInspector,
  text: TextInspector,
};

export function inspectorFor(layer: Layer): ComponentType<{ layer: Layer }> {
  return inspectors[layer.type] as ComponentType<{ layer: Layer }>;
}
