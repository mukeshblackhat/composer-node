import type { Frame } from './types';

export type Size = { width: number; height: number };

/** Arguments for the nine-argument form of `drawImage`. */
export type ImagePlacement = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
};

/**
 * Place an image in a frame without stretching it.
 *
 * - `contain` shows the whole image inside the frame. Empty space is split
 *   by the anchor (0 = start, 0.5 = centre, 1 = end).
 * - `cover` fills the frame and crops the overflow. The anchor picks which
 *   part of the image stays visible.
 */
export function fitImage(
  src: Size,
  frame: Frame,
  mode: 'contain' | 'cover',
  anchor: { x: number; y: number },
): ImagePlacement {
  if (mode === 'contain') {
    const scale = Math.min(frame.w / src.width, frame.h / src.height);
    const dw = Math.round(src.width * scale);
    const dh = Math.round(src.height * scale);
    return {
      sx: 0,
      sy: 0,
      sw: src.width,
      sh: src.height,
      dx: frame.x + Math.round((frame.w - dw) * anchor.x),
      dy: frame.y + Math.round((frame.h - dh) * anchor.y),
      dw,
      dh,
    };
  }

  const scale = Math.max(frame.w / src.width, frame.h / src.height);
  const sw = frame.w / scale;
  const sh = frame.h / scale;
  return {
    sx: (src.width - sw) * anchor.x,
    sy: (src.height - sh) * anchor.y,
    sw,
    sh,
    dx: frame.x,
    dy: frame.y,
    dw: frame.w,
    dh: frame.h,
  };
}
