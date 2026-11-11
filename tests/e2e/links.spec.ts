import { expect, test } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { PNG } from 'pngjs';
import { downloadedBytes, freshHash, openApp, pngHash } from './helpers';

// No test here touches the internet. Links are answered by a small server
// on another port, so the browser applies its real cross-origin rules.
let server: Server;
let GOOD = '';
let MISSING = '';
let PAGE = '';
let NO_CORS = '';

/** A tall 120 × 300 picture with a colour ramp, so a wrong crop or scale changes pixels. */
function tallPng(): Buffer {
  const png = new PNG({ width: 120, height: 300 });
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const i = (y * png.width + x) * 4;
      png.data[i] = x * 2;
      png.data[i + 1] = Math.floor((y * 255) / png.height);
      png.data[i + 2] = 160;
      png.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

test.beforeAll(async () => {
  const body = tallPng();
  const open = { 'access-control-allow-origin': '*' };
  server = createServer((request, response) => {
    if (request.url === '/good.png') response.writeHead(200, { 'content-type': 'image/png', ...open }).end(body);
    else if (request.url === '/page') response.writeHead(200, { 'content-type': 'text/html', ...open }).end('<p>Not an image</p>');
    // An image, but its host does not let other sites read it.
    else if (request.url === '/no-cors.png') response.writeHead(200, { 'content-type': 'image/png' }).end(body);
    else response.writeHead(404, { 'content-type': 'text/plain', ...open }).end('Not found');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const host = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  GOOD = `${host}/good.png`;
  MISSING = `${host}/missing.png`;
  PAGE = `${host}/page`;
  NO_CORS = `${host}/no-cors.png`;
});

test.afterAll(() => {
  server.close();
});

const csv = () =>
  [
    'backdrop,product,title,tagline',
    `backdrop-warm,${GOOD},Linked,A good link`,
    `backdrop-warm,${MISSING},Linked,A link that is gone`,
    `backdrop-warm,${PAGE},Linked,A link to a page`,
    `backdrop-warm,${NO_CORS},Linked,A host that blocks reads`,
  ].join('\n');

test('a batch draws a good link and warns about bad ones without stopping', async ({ page }) => {
  await openApp(page);
  await page.getByTestId('open-runs').click();
  await page.getByTestId('upload-csv').setInputFiles({ name: 'links.csv', mimeType: 'text/csv', buffer: Buffer.from(csv()) });
  await page.getByTestId('run-batch').click();

  const results = page.getByTestId('run-result');
  await expect(results).toHaveCount(4, { timeout: 30_000 });

  await expect(results.nth(0).locator('[data-code=missing-asset]')).toHaveCount(0);
  for (const bad of [1, 2, 3]) {
    await expect(results.nth(bad).locator('[data-code=missing-asset]'), `set ${bad + 1}`).toHaveCount(1);
  }

  // The good link really was drawn: its set differs from one with no product.
  const hashes = await results.locator('code[data-hash]').evaluateAll((els) => els.map((el) => el.getAttribute('data-hash')!));
  expect(hashes[0]).not.toBe(hashes[1]);

  await page.getByTestId('verify').click();
  await expect(page.getByTestId('verify-result')).toHaveText(/^4 of 4 sets gave identical pixels/, { timeout: 30_000 });
});

test('a link typed into an input node renders, and its export matches the preview', async ({ page }) => {
  await openApp(page);
  const output = page.getByTestId('output-hash');
  const before = await output.getAttribute('data-hash');

  const node = page.getByTestId('node-in-product');
  await node.getByLabel('Image', { exact: true }).selectOption({ label: 'Link…' });
  await node.getByTestId('image-link').fill(GOOD);
  await node.getByTestId('image-link').press('Enter');

  const linked = await freshHash(output);
  expect(linked).not.toBe(before);
  await expect(page.getByTestId('node-output').locator('[data-code=missing-asset]')).toHaveCount(0);

  await page.getByTestId('edit-layout').click();
  const preview = page.getByTestId('preview-hash');
  await expect(preview).toHaveAttribute('data-hash', linked);

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-png').click()]);
  expect(pngHash(await downloadedBytes(download))).toBe(linked);
});

test('a bad link says why on the input node and warns on the output', async ({ page }) => {
  await openApp(page);

  const node = page.getByTestId('node-in-product');
  await node.getByLabel('Image', { exact: true }).selectOption({ label: 'Link…' });
  await node.getByTestId('image-link').fill(MISSING);
  await node.getByTestId('image-link').press('Enter');

  await expect(node.getByTestId('link-error')).toContainText('The link returned 404.');
  await expect(page.getByTestId('node-output').locator('[data-code=missing-asset]')).toHaveCount(1);

  await node.getByTestId('image-link').fill('not-a-link');
  await node.getByTestId('image-link').press('Enter');
  await expect(node).toContainText('Use a link that starts with http:// or https://');
});
