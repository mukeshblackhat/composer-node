/**
 * SHA-256 of a canvas's raw pixels, as hex. The size goes into the hash
 * too, so two canvases match only if they are the same size and every pixel
 * is equal. Hashing pixels, not PNG bytes, keeps the PNG encoder out of it.
 */
export async function hashCanvas(canvas: HTMLCanvasElement): Promise<string> {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('This browser cannot read the canvas.');
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const bytes = new Uint8Array(8 + data.length);
  new DataView(bytes.buffer).setUint32(0, canvas.width);
  new DataView(bytes.buffer).setUint32(4, canvas.height);
  bytes.set(data, 8);

  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed.'))), 'image/png');
  });
}
