import { expect, test } from '@playwright/test';
import { runSampleBatch } from './helpers';

test('the 5 sample sets match their golden hashes', async ({ page }) => {
  const hashes = await runSampleBatch(page);
  expect(new Set(hashes).size).toBe(5);
  // First run on a new platform: npm run test:e2e:update
  expect(JSON.stringify(hashes, null, 2) + '\n').toMatchSnapshot('hero-square-hashes.json');
});

test('two fresh browser sessions give the same pixels', async ({ browser }) => {
  const runs: string[][] = [];
  for (let i = 0; i < 2; i++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    runs.push(await runSampleBatch(await context.newPage()));
    await context.close();
  }
  expect(runs[0]).toEqual(runs[1]);
});

test('Verify finds every set identical across repeat renders', async ({ page }) => {
  await runSampleBatch(page);
  await page.getByTestId('verify').click();
  await expect(page.getByTestId('verify-result')).toHaveText(/^5 of 5 sets gave identical pixels/, { timeout: 30_000 });
});
