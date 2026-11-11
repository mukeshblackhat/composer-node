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

// Images from links. They are fetched and decoded before `render()` runs and
// kept in the same cache under the link itself, so `render()` never waits
// and never touches the network.

export type RemoteInfo = {
  status: 'loading' | 'ready' | 'failed';
  /** Why the link failed, in words a user can act on. */
  reason?: string;
  /** SHA-256 of the fetched bytes: which image this link gave this time. */
  sha256?: string;
};

const LINK_TIMEOUT_MS = 30_000;

const remote = new Map<string, RemoteInfo>();
const remoteLoads = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();
let version = 0;

function changed(): void {
  version++;
  listeners.forEach((listener) => listener());
}

/** For `useSyncExternalStore`: tells React when a link starts or settles. */
export function subscribeAssets(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function assetsVersion(): number {
  return version;
}

export function remoteInfo(url: string): RemoteInfo | undefined {
  return remote.get(url);
}

const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');

/**
 * Fetch with CORS, not with an <img> tag. A host that does not allow
 * cross-origin reads fails here, so it can never taint the canvas and block
 * the PNG export or the pixel hash. It also gives the bytes to hash.
 */
async function fetchRemote(url: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(url, { mode: 'cors', credentials: 'omit', signal: AbortSignal.timeout(LINK_TIMEOUT_MS) });
  } catch {
    throw new Error('Could not fetch the link. It may be down, or its host may not allow other sites to read it.');
  }
  if (!response.ok) throw new Error(`The link returned ${response.status}.`);
  const type = response.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error('The link is not an image.');

  const bytes = await response.arrayBuffer();
  const objectUrl = URL.createObjectURL(new Blob([bytes], { type }));
  const element = new Image();
  element.src = objectUrl;
  try {
    await element.decode();
  } catch {
    throw new Error('The image could not be decoded.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
  if (!element.naturalWidth || !element.naturalHeight) throw new Error('The image has no size.');

  const sha256 = hex(await crypto.subtle.digest('SHA-256', bytes));
  images.set(url, { source: element, width: element.naturalWidth, height: element.naturalHeight });
  remote.set(url, { status: 'ready', sha256 });
}

/**
 * Load one link. Never rejects: a failed link is recorded with its reason
 * and renders as a missing asset. Each link is fetched once per page load,
 * so every render in a session sees the same image.
 */
export function loadRemoteImage(url: string): Promise<void> {
  let load = remoteLoads.get(url);
  if (!load) {
    remote.set(url, { status: 'loading' });
    load = fetchRemote(url)
      .catch((e: Error) => {
        remote.set(url, { status: 'failed', reason: e.message });
      })
      .then(changed);
    remoteLoads.set(url, load);
    changed();
  }
  return load;
}

/** Forget a failed link and fetch it again. */
export function retryRemoteImage(url: string): Promise<void> {
  if (remote.get(url)?.status === 'failed') remoteLoads.delete(url);
  return loadRemoteImage(url);
}

/** Call before `render()` with the links it will need. Resolves when all have settled. */
export function ensureImages(links: string[]): Promise<void> {
  return Promise.all(links.map(loadRemoteImage)).then(() => undefined);
}

let loading: Promise<void> | null = null;

/** Call before the first render. Later calls share the first load. */
export function loadAssets(): Promise<void> {
  loading ??= Promise.all([loadFonts(), loadImages()]).then(() => undefined);
  return loading;
}
