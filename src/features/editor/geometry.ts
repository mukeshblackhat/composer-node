// Pure maths for dragging layers in the editor. All values are artboard
// pixels; the overlay converts from screen pixels before calling these.

import type { Frame } from '../../engine';

export type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
export const HANDLES: HandleId[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

/** Guide lines to draw while snapped, in artboard pixels. */
export type Guides = { x: number[]; y: number[] };

type Artboard = { width: number; height: number };

const MIN_SIZE = 8;

export function moveFrame(f: Frame, dx: number, dy: number): Frame {
  return { ...f, x: f.x + Math.round(dx), y: f.y + Math.round(dy) };
}

/**
 * Drag one handle. The opposite side stays put, and the frame never gets
 * smaller than MIN_SIZE, so it can not be flipped inside out.
 */
export function resizeFrame(f: Frame, handle: HandleId, dx: number, dy: number): Frame {
  const rx = Math.round(dx);
  const ry = Math.round(dy);
  let { x, y, w, h } = f;
  if (handle.includes('e')) w = Math.max(MIN_SIZE, f.w + rx);
  if (handle.includes('w')) {
    w = Math.max(MIN_SIZE, f.w - rx);
    x = f.x + f.w - w;
  }
  if (handle.includes('s')) h = Math.max(MIN_SIZE, f.h + ry);
  if (handle.includes('n')) {
    h = Math.max(MIN_SIZE, f.h - ry);
    y = f.y + f.h - h;
  }
  return { x, y, w, h };
}

/** The artboard's edges and centre lines: what layers snap to. */
function targets(size: number): number[] {
  return [0, Math.round(size / 2), size];
}

/** The target closest to any of `points`, if one is within `threshold`. */
function nearest(points: number[], lines: number[], threshold: number): { shift: number; line: number } | null {
  let best: { shift: number; line: number } | null = null;
  for (const p of points) {
    for (const line of lines) {
      const shift = line - p;
      if (Math.abs(shift) <= threshold && (!best || Math.abs(shift) < Math.abs(best.shift))) {
        best = { shift, line };
      }
    }
  }
  return best;
}

/** Snap a moved frame's edges or centre to the artboard's edges or centre. */
export function snapMove(f: Frame, artboard: Artboard, threshold: number): { frame: Frame; guides: Guides } {
  const sx = nearest([f.x, f.x + f.w / 2, f.x + f.w], targets(artboard.width), threshold);
  const sy = nearest([f.y, f.y + f.h / 2, f.y + f.h], targets(artboard.height), threshold);
  return {
    frame: { ...f, x: Math.round(f.x + (sx?.shift ?? 0)), y: Math.round(f.y + (sy?.shift ?? 0)) },
    guides: { x: sx ? [sx.line] : [], y: sy ? [sy.line] : [] },
  };
}

/** Snap only the edges that the handle moves. */
export function snapResize(f: Frame, handle: HandleId, artboard: Artboard, threshold: number): { frame: Frame; guides: Guides } {
  let { x, y, w, h } = f;
  const guides: Guides = { x: [], y: [] };

  if (handle.includes('e')) {
    const s = nearest([x + w], targets(artboard.width), threshold);
    if (s && w + s.shift >= MIN_SIZE) {
      w += s.shift;
      guides.x.push(s.line);
    }
  } else if (handle.includes('w')) {
    const s = nearest([x], targets(artboard.width), threshold);
    if (s && w - s.shift >= MIN_SIZE) {
      x += s.shift;
      w -= s.shift;
      guides.x.push(s.line);
    }
  }
  if (handle.includes('s')) {
    const s = nearest([y + h], targets(artboard.height), threshold);
    if (s && h + s.shift >= MIN_SIZE) {
      h += s.shift;
      guides.y.push(s.line);
    }
  } else if (handle.includes('n')) {
    const s = nearest([y], targets(artboard.height), threshold);
    if (s && h - s.shift >= MIN_SIZE) {
      y += s.shift;
      h -= s.shift;
      guides.y.push(s.line);
    }
  }
  return { frame: { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }, guides };
}

export const CURSORS: Record<HandleId, string> = {
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
};

/** Where each handle sits on the frame, as a fraction of its width and height. */
export const HANDLE_SPOT: Record<HandleId, { x: number; y: number }> = {
  nw: { x: 0, y: 0 },
  n: { x: 0.5, y: 0 },
  ne: { x: 1, y: 0 },
  e: { x: 1, y: 0.5 },
  se: { x: 1, y: 1 },
  s: { x: 0.5, y: 1 },
  sw: { x: 0, y: 1 },
  w: { x: 0, y: 0.5 },
};
