import { zipSync } from 'fflate';
import { imageLinks } from '../../assets/links';
import { ensureImages, getImage, remoteInfo } from '../../assets/loader';
import { canvasToPng, hashCanvas, render, type InputSet, type Preset } from '../../engine';
import { useStore } from '../../store';
import type { RunResult, VerifyResult } from '../../store/runSlice';
import { downloadBlob } from '../../ui/download';

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

export function fileNameFor(preset: Preset, index: number): string {
  return `${preset.id}_set-${String(index + 1).padStart(2, '0')}.png`;
}

/** Render one PNG per input set, one after another, so the page stays responsive. */
export async function runBatch(preset: Preset, rows: InputSet[]): Promise<void> {
  const store = useStore.getState();
  store.startRun();
  for (let index = 0; index < rows.length; index++) {
    // A link that fails does not stop the run: its layer is skipped with a warning.
    await ensureImages(imageLinks(preset, rows[index]));
    const { canvas, warnings } = render(preset, rows[index], getImage);
    const [blob, hash] = await Promise.all([canvasToPng(canvas), hashCanvas(canvas)]);
    store.addResult({ index, fileName: fileNameFor(preset, index), url: URL.createObjectURL(blob), hash, warnings });
    await nextFrame();
  }
  store.finishRun(preset.id);
}

/**
 * Render every set several times on fresh canvases and count the sets whose
 * pixels came out identical every time. If a run already exists for the same
 * preset, its hashes must match too.
 */
export async function verifyBatch(preset: Preset, rows: InputSet[], earlier: RunResult[], renders = 3): Promise<VerifyResult> {
  let identical = 0;
  for (let index = 0; index < rows.length; index++) {
    const hashes = new Set<string>();
    await ensureImages(imageLinks(preset, rows[index]));
    for (let r = 0; r < renders; r++) {
      hashes.add(await hashCanvas(render(preset, rows[index], getImage).canvas));
    }
    const before = earlier.find((e) => e.index === index);
    if (before) hashes.add(before.hash);
    if (hashes.size === 1) identical++;
    await nextFrame();
  }
  return { identical, total: rows.length, renders };
}

/**
 * What each link in a set gave: the hash of its bytes, or why it failed. A
 * link can serve a different image tomorrow, and this is how to tell.
 */
function linkRecords(preset: Preset, row: InputSet): { link: string; sha256?: string; error?: string }[] {
  return imageLinks(preset, row).map((link) => {
    const info = remoteInfo(link);
    return info?.status === 'ready' ? { link, sha256: info.sha256 } : { link, error: info?.reason ?? 'Not loaded.' };
  });
}

/**
 * One zip with every PNG, the preset that made them, and a run file that
 * lists each set's inputs, hash and warnings. The fixed date keeps the zip
 * itself the same from run to run.
 */
export async function downloadZip(preset: Preset, rows: InputSet[], results: RunResult[]): Promise<void> {
  const fixed = { level: 0 as const, mtime: new Date('2000-01-01T00:00:00Z') };
  const files: Record<string, [Uint8Array, typeof fixed]> = {};
  for (const result of results) {
    const bytes = new Uint8Array(await (await fetch(result.url)).arrayBuffer());
    files[result.fileName] = [bytes, fixed];
  }
  const encode = (value: unknown) => new TextEncoder().encode(JSON.stringify(value, null, 2) + '\n');
  files['preset.json'] = [encode(preset), fixed];
  files['run.json'] = [
    encode({
      preset: preset.id,
      sets: results.map((r) => {
        const links = linkRecords(preset, rows[r.index]);
        return {
          file: r.fileName,
          inputs: rows[r.index],
          sha256: r.hash,
          warnings: r.warnings,
          ...(links.length > 0 ? { links } : {}),
        };
      }),
    }),
    fixed,
  ];
  const zip = zipSync(files);
  downloadBlob(new Blob([zip as BlobPart], { type: 'application/zip' }), `${preset.id}_batch.zip`);
}
