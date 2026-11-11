import { expect, test } from '@playwright/test';
import { unzipSync } from 'fflate';
import { downloadedBytes, freshHash, openApp, pngHash, runSampleBatch } from './helpers';

test('each exported PNG has exactly the pixels of the editor preview', async ({ page }) => {
  await openApp(page);
  await page.getByTestId('edit-layout').click();
  const preview = page.getByTestId('preview-hash');

  for (let set = 0; set < 5; set++) {
    await page.getByTestId('input-source').selectOption(String(set));
    const shown = await freshHash(preview);
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-png').click()]);
    expect(download.suggestedFilename()).toBe(`hero-square_set-${set + 1}.png`);
    expect(pngHash(await downloadedBytes(download)), `set ${set + 1}`).toBe(shown);
  }
});

test('the Output node and the editor preview show the same pixels', async ({ page }) => {
  await openApp(page);
  const output = await page.getByTestId('output-hash').getAttribute('data-hash');
  await page.getByTestId('edit-layout').click();
  await expect(page.getByTestId('preview-hash')).toHaveAttribute('data-hash', output!);
});

test('the zip holds one PNG per set, matching the hashes in the run', async ({ page }) => {
  const hashes = await runSampleBatch(page);
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-zip').click()]);
  const files = unzipSync(new Uint8Array(await downloadedBytes(download)));

  const pngs = Object.keys(files).filter((name) => name.endsWith('.png')).sort();
  expect(pngs).toEqual([1, 2, 3, 4, 5].map((n) => `hero-square_set-0${n}.png`));
  expect(pngs.map((name) => pngHash(files[name]))).toEqual(hashes);

  const run = JSON.parse(new TextDecoder().decode(files['run.json']));
  expect(run.sets.map((s: { sha256: string }) => s.sha256)).toEqual(hashes);
  expect(JSON.parse(new TextDecoder().decode(files['preset.json'])).id).toBe('hero-square');
});

test('a title far too long for its frame shrinks, then is cut, and says so', async ({ page }) => {
  await openApp(page);
  const title = page.getByTestId('node-in-title').locator('textarea');
  const warnings = page.getByTestId('node-output').getByTestId('warnings');

  await title.fill('Slow mornings that start with one calm ritual');
  await expect(warnings.locator('[data-code=text-shrunk]')).toHaveCount(1);

  await title.fill('Slow mornings '.repeat(12));
  await expect(warnings.locator('[data-code=text-truncated]')).toHaveCount(1);
});
