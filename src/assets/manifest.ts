// Every font and image the app may use. Nothing is loaded from anywhere else.

export type FontAsset = { family: string; weight: number; url: string };
export type ImageAsset = { id: string; label: string; kind: 'backdrop' | 'product'; url: string };

const base = `${import.meta.env.BASE_URL}assets`;

export const fontAssets: FontAsset[] = [
  { family: 'Inter', weight: 400, url: `${base}/fonts/inter-latin-400-normal.woff2` },
  { family: 'Inter', weight: 600, url: `${base}/fonts/inter-latin-600-normal.woff2` },
  { family: 'Inter', weight: 700, url: `${base}/fonts/inter-latin-700-normal.woff2` },
  { family: 'DM Serif Display', weight: 400, url: `${base}/fonts/dm-serif-display-latin-400-normal.woff2` },
];

export const imageAssets: ImageAsset[] = [
  { id: 'backdrop-warm', label: 'Warm arch', kind: 'backdrop', url: `${base}/images/backdrop-warm.svg` },
  { id: 'backdrop-cool', label: 'Cool circle', kind: 'backdrop', url: `${base}/images/backdrop-cool.svg` },
  { id: 'backdrop-wide', label: 'Green, wide', kind: 'backdrop', url: `${base}/images/backdrop-wide.svg` },
  { id: 'product-bottle', label: 'Bottle', kind: 'product', url: `${base}/images/product-bottle.svg` },
  { id: 'product-jar', label: 'Jar', kind: 'product', url: `${base}/images/product-jar.svg` },
  { id: 'product-tube', label: 'Tube', kind: 'product', url: `${base}/images/product-tube.svg` },
  { id: 'product-box', label: 'Box', kind: 'product', url: `${base}/images/product-box.svg` },
  { id: 'product-tin', label: 'Tin', kind: 'product', url: `${base}/images/product-tin.svg` },
];

export const inputSetsUrl = `${base}/inputs.csv`;

/** The weights that exist for a family, for the weight picker. */
export function weightsOf(family: string): number[] {
  return fontAssets.filter((f) => f.family === family).map((f) => f.weight);
}

export const fontFamilies = [...new Set(fontAssets.map((f) => f.family))];
