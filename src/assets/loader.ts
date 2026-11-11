import type { LoadedImage } from '../engine';
import { fontAssets, imageAssets } from './manifest';

// Decoded images are not plain data, so they live here and not in the store.
const images = new Map<string, LoadedImage>();

/** The lookup that `render()` takes. */
export function getImage(id: string): LoadedImage | undefined {
  return images.get(id);
}

/**
 * Load every bundled font and wait until each one is usable. A font that
 * fails throws, because rendering with a fallback font would silently give
 * different pixels.
 */
export async function loadFonts(): Promise<void> {
  await Promise.all(
    fontAssets.map(async (asset) => {
      const face = new FontFace(asset.family, `url(${asset.url})`, {
        weight: String(asset.weight),
        style: 'normal',
      });
      try {
        document.fonts.add(await face.load());
      } catch {
        throw new Error(`Could not load font ${asset.family} ${asset.weight}.`);
      }
    }),
  );
}

async function loadImage(id: string, url: string): Promise<void> {
  const element = new Image();
  element.src = url;
  try {
    await element.decode();
  } catch {
    throw new Error(`Could not load image ${id}.`);
  }
  images.set(id, { source: element, width: element.naturalWidth, height: element.naturalHeight });
}

export async function loadImages(): Promise<void> {
  await Promise.all(imageAssets.map((asset) => loadImage(asset.id, asset.url)));
}

let loading: Promise<void> | null = null;

/** Call before the first render. Later calls share the first load. */
export function loadAssets(): Promise<void> {
  loading ??= Promise.all([loadFonts(), loadImages()]).then(() => undefined);
  return loading;
}
