import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { getImage } from '../../assets/loader';
import { hashCanvas, render, type InputSet, type Layout, type Preset } from '../../engine';

/**
 * Render a preset into a canvas whenever the preset or the inputs change.
 * The canvas keeps the full artboard size; CSS decides how big it looks.
 * With `hash` on, the pixel hash follows shortly after each render.
 */
export function useRender(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  preset: Preset,
  inputs: InputSet,
  options: { hash?: boolean } = {},
): { layout: Layout | null; hash: string } {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [hash, setHash] = useState('');

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { items, warnings } = render(preset, inputs, getImage, canvas);
    setLayout({ items, warnings });
    setHash('');
  }, [canvasRef, preset, inputs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!options.hash || !canvas) return;
    let live = true;
    // Wait for edits to settle; hashing a 1080 px canvas on every drag step is wasted work.
    const timer = setTimeout(() => {
      hashCanvas(canvas).then((h) => live && setHash(h));
    }, 150);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [canvasRef, preset, inputs, options.hash]);

  return { layout, hash };
}
