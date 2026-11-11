import { expect, type Download, type Locator, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';

/**
 * The same hash the app shows: SHA-256 over width, height, then RGBA bytes.
 * Run in Node on a decoded PNG file, it checks the file a user downloads.
 */
export function rgbaHash(width: number, height: number, rgba: Uint8Array): string {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  return createHash('sha256').update(header).update(rgba).digest('hex');
}

export function pngHash(bytes: Uint8Array): string {
  const png = PNG.sync.read(Buffer.from(bytes));
  return rgbaHash(png.width, png.height, png.data);
}

export async function downloadedBytes(download: Download): Promise<Buffer> {
  return readFileSync(await download.path());
}

/** Open the app with no saved state and wait until the Output node has rendered. */
export async function openApp(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('output-hash')).not.toHaveAttribute('data-hash', '', { timeout: 20_000 });
}

/** Wait for a hash element to go blank (a new render) and then fill in. */
export async function freshHash(hash: Locator): Promise<string> {
  await expect(hash).toHaveAttribute('data-hash', '');
  await expect(hash).not.toHaveAttribute('data-hash', '');
  return (await hash.getAttribute('data-hash'))!;
}

/** Run the current preset on the sample CSV and return each set's hash, in order. */
export async function runSampleBatch(page: Page): Promise<string[]> {
  await openApp(page);
  await page.getByTestId('open-runs').click();
  await page.getByTestId('run-batch').click();
  const results = page.getByTestId('run-result');
  await expect(results).toHaveCount(5, { timeout: 30_000 });
  return results.locator('code[data-hash]').evaluateAll((els) => els.map((el) => el.getAttribute('data-hash')!));
}
