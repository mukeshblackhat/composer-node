# Composer node

A deterministic Composer node for a node-based workflow. Images and text go in as inputs, a layout preset places them as layers, and one PNG comes out. The same preset and the same inputs give the same pixels.

**Live app:** TODO: add the deployed link
**Video:** TODO: add the video link

## Run it

```
npm install
npm run dev          # the app
npm test             # 41 unit tests
npm run typecheck
npm run build
```

End-to-end tests run in Chrome through Playwright:

```
npx playwright install chromium   # once
npm run test:e2e:update           # once per new OS, records that OS's golden hashes
npm run test:e2e
```

Golden hashes are kept per operating system in `tests/e2e/__goldens__`. The Linux ones are committed.

The images in `public/assets/images` and `inputs.csv` are stand-ins until the real asset pack is added. TODO: swap in the asset pack and record the goldens again.

## What is where

```
src/engine/      the renderer: pure TypeScript, no React, no store
  render.ts      render(preset, inputs) -> canvas + warnings. The only way pixels are made.
  text.ts        wrap, shrink, cut with an ellipsis
  fit.ts         contain and cover
  layers/        one file per layer type, plus the registry
  validate.ts    checks a preset before it is used
src/store/       Zustand: graph, preset (with undo), editor and run slices
src/features/
  canvas/        React Flow: image and text inputs, Composer, Output
  editor/        stage, overlay with handles and snapping, layer list, inspector
  presets/       save, apply, import and export JSON
  runs/          CSV batch run, zip, Verify
src/presets/     the seed presets, as JSON files
tests/unit/      Vitest
tests/e2e/       Playwright
```

To add a layer type: add a file in `src/engine/layers/` (layout and paint), add it to the `Layer` union and the registry, and add its inspector panel in `src/features/editor/inspectors/`. Nothing else changes.

## Write-up

### 1. The three most important choices, and what I rejected

**One render function makes every pixel.** The editor preview, the Output node, PNG export and the batch run all call `render(preset, inputs)`, which draws on a plain 2D canvas at the full artboard size. The preview is that canvas scaled down with CSS. Selection boxes, handles, guides and empty-slot hints are DOM on top of it, so they can never end up in an export. Export does not copy the preview: it renders again on a fresh canvas with the same function. I rejected a DOM preview exported with html-to-image, because the browser would wrap the text one way on screen and the exporter another. I rejected Konva and Fabric because they keep their own scene state and their own text layout.

**I lay out text myself.** The engine measures words, wraps them, and works out every line's x position and baseline in whole pixels before it paints anything. The browser never decides a line break or the alignment. I rejected drawing text as vector paths with opentype.js for now. It would hold up better across browsers, but it cost more time than I had.

**A preset is plain JSON, kept apart from the input values.** It has an artboard, slots (what the node accepts) and layers (where each slot is drawn). The inputs are a flat map from slot key to value, so a CSV row already is an input set, and the Composer node's handles are just the preset's slots. Applying another preset keeps every wire whose slot key still exists. I rejected keeping values inside layers, because then one preset could not run on 100 products.

```json
{
  "version": 1, "id": "hero-square", "name": "Hero square",
  "artboard": { "width": 1080, "height": 1080, "background": "#ffffff" },
  "slots": [{ "key": "title", "label": "Title", "type": "text" }],
  "layers": [{
    "id": "layer-title", "type": "text", "slot": "title", "visible": true,
    "frame": { "x": 90, "y": 70, "w": 900, "h": 150 },
    "family": "DM Serif Display", "weight": 400, "size": 96, "color": "#3b1d10",
    "align": "center", "valign": "middle", "lineHeight": 1.1, "letterSpacing": 0,
    "overflow": { "minSize": 56, "maxLines": 2 }
  }]
}
```

**Inputs that do not fit.** Images are never stretched. A product uses `contain` and sits on its anchor, so a tall bottle in a wide slot keeps its shape and stands at the bottom centre. A backdrop uses `cover` and crops around its anchor. Text wraps to the frame; if it still does not fit, it shrinks one pixel at a time down to the layer's smallest size, then the last line is cut with an ellipsis. A word wider than the frame gets its own line. A missing input skips the layer. Every fallback shows up as a warning on the Output node, in the editor and on each batch result.

### 2. Limits

- The same pixels are only promised on the same browser and OS. Text edges differ between platforms, and browsers with canvas fingerprint protection (Brave, Firefox in strict mode) add noise to pixel reads, which breaks the hash.
- Frames are fixed. When a title wraps to two lines, the tagline under it does not move down, so they can touch. Set 3 shows this.
- Images and fonts come from a fixed asset list. There is no upload, and an image id in a CSV must match that list.
- Undo covers the preset, not the node graph. A wire that was unplugged by deleting its slot does not come back on undo.
- The 9:16 layout is a second preset, not one layout adapting to two formats.
- Text needs canvas `letterSpacing`, which older browsers do not have.

### 3. How I verified it

- 41 unit tests cover the fit maths, text wrap, shrink and cut, alignment, preset checks, wiring rules and drag geometry.
- 7 Playwright tests in Chrome: golden hashes for the 5 sets; two fresh browser sessions give the same hashes; Verify finds all 5 identical; each downloaded PNG, decoded in Node, hashes the same as the editor preview for all 5 sets; the Output node matches the preview; the zip holds one PNG per set with the run's hashes; a long title shrinks and then is cut.
- I made sure the golden test can fail: changing one text colour from `#3b1d10` to `#3b1d11` broke it.
- Not verified: Safari, Firefox and Windows; the real asset pack; very large images; touch input; runs of 100 or more sets.

### 4. When the agent got it wrong

TODO: replace with your own story if you have a better one. Draft from this build: the agent named the Output node's type `output`. React Flow ships default CSS for its own node type of that name, so the node got a stray grey box behind it. Type checks and tests all passed. I found it by looking at a screenshot of the canvas, renamed the type to `outputImage`, and left a comment saying why.

### 5. The next primitive

A Stack layer: a frame that lays its children out in a column with a gap. When the title wraps to two lines, the tagline moves down instead of running into it. Users could build layouts that hold up for any text length, and adapting one layout to a second format would get much easier.

### 6. Hours

TODO: the true number.
