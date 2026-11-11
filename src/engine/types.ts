// A preset is plain JSON. It describes a layout and never holds input values.

export type SlotType = 'image' | 'text';

export type Slot = {
  /** Stable key. Matches a CSV column and an InputSet key. */
  key: string;
  label: string;
  type: SlotType;
  /** Shown in the editor only. Never painted into the output. */
  placeholder?: string;
};

/** Whole artboard pixels. Never fractions, never screen pixels. */
export type Frame = { x: number; y: number; w: number; h: number };

type LayerBase = {
  id: string;
  /** Key of the slot this layer draws. */
  slot: string;
  frame: Frame;
  visible: boolean;
};

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';

export type ImageLayer = LayerBase & {
  type: 'image';
  /** 0 to 1 */
  opacity: number;
  blend: BlendMode;
  /** Images are never stretched. */
  fit: 'contain' | 'cover';
  /** 0 to 1 on each axis. Where the image sits inside the frame. */
  anchor: { x: number; y: number };
};

export type TextLayer = LayerBase & {
  type: 'text';
  family: string;
  weight: number;
  /** Font size in artboard pixels. */
  size: number;
  color: string;
  align: 'left' | 'center' | 'right';
  valign: 'top' | 'middle' | 'bottom';
  /** Multiple of the font size. */
  lineHeight: number;
  /** Artboard pixels between letters. */
  letterSpacing: number;
  /** What to do with text that is too long: shrink to minSize, then cut at maxLines. */
  overflow: { minSize: number; maxLines: number };
};

export type Layer = ImageLayer | TextLayer;

export type Preset = {
  version: 1;
  id: string;
  name: string;
  artboard: { width: number; height: number; background: string };
  /** The inputs the Composer node accepts. */
  slots: Slot[];
  /** Array order is z-order. The first layer is at the bottom. */
  layers: Layer[];
};

/** One value per slot key: the text itself, or an asset id for an image slot. */
export type InputSet = Record<string, string>;

export type WarningCode =
  | 'missing-input'
  | 'missing-asset'
  | 'text-shrunk'
  | 'text-truncated';

export type Warning = { layerId: string; slot: string; code: WarningCode };

export type TextStyle = {
  family: string;
  weight: number;
  size: number;
  letterSpacing: number;
};

export type LoadedImage = { source: CanvasImageSource; width: number; height: number };

/**
 * Everything the engine needs from the outside world. The browser version is
 * built in `env.ts`. Tests pass a fake one, so layout runs without a canvas.
 */
export type RenderEnv = {
  /** Width of one line of text, without trailing letter spacing. */
  measure(text: string, style: TextStyle): number;
  /** Distance from the baseline to the top and the bottom of the font box. */
  metrics(style: TextStyle): { ascent: number; descent: number };
  image(id: string): LoadedImage | undefined;
};
