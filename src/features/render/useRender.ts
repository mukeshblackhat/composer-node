import { useEffect, useLayoutEffect, useState, useSyncExternalStore, type RefObject } from 'react';
import { imageLinks } from '../../assets/links';
import { assetsVersion, ensureImages, getImage, remoteInfo, subscribeAssets } from '../../assets/loader';
import { hashCanvas, render, type InputSet, type Layout, type Preset } from '../../engine';

/**
 * Render a preset into a canvas whenever the preset or the inputs change.
 * The canvas keeps the full artboard size; CSS decides how big it looks.
 * With `hash` on, the pixel hash follows shortly after each render.
 *
 * Images from links are loaded first. While one is on its way, `pending` is
 * true and no hash is given, so a half-finished picture never gets one.
 */
export function useRender(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  preset: Preset,
  inputs: InputSet,
  options: { hash?: boolean } = {},
): { layout: Layout | null; hash: string; pending: boolean } {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [hash, setHash] = useState('');

  // Changes whenever a link starts or finishes loading, which re-renders.
  const assets = useSyncExternalStore(subscribeAssets, assetsVersion);
  const links = imageLinks(preset, inputs);
  const linkKey = links.join('\n');
  const pending = links.some((link) => {
    const status = remoteInfo(link)?.status;
    return status !== 'ready' && status !== 'failed';
  });

  useEffect(() => {
    void ensureImages(linkKey ? linkKey.split('\n') : []);
  }, [linkKey]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { items, warnings } = render(preset, inputs, getImage, canvas);
    setLayout({ items, warnings });
    setHash('');
  }, [canvasRef, preset, inputs, assets]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!options.hash || !canvas || pending) return;
    let live = true;
    // Wait for edits to settle; hashing a 1080 px canvas on every drag step is wasted work.
    const timer = setTimeout(() => {
      hashCanvas(canvas).then((h) => live && setHash(h));
    }, 150);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [canvasRef, preset, inputs, options.hash, assets, pending]);

  return { layout, hash, pending };
}
