import type { Edge, Node } from '@xyflow/react';

/** There is always exactly one Composer node and one Output node. */
export const COMPOSER_ID = 'composer';
export const OUTPUT_ID = 'output';

export type ImageInputData = { label: string; assetId: string };
export type TextInputData = { label: string; text: string };

export type ImageInputNode = Node<ImageInputData, 'imageInput'>;
export type TextInputNode = Node<TextInputData, 'textInput'>;
export type ComposerNode = Node<Record<string, never>, 'composer'>;
export type OutputNode = Node<Record<string, never>, 'output'>;

export type InputNode = ImageInputNode | TextInputNode;
export type AppNode = InputNode | ComposerNode | OutputNode;

/** `kind` colours the wire: image, text, or the composer-to-output wire. */
export type AppEdge = Edge<{ kind: 'image' | 'text' | 'output' }>;
