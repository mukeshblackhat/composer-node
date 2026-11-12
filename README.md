# Composer node

A deterministic Composer node for a node-based workflow. Images and text go in as inputs, a layout preset places them as layers, and one PNG comes out. The same preset and the same inputs give the same pixels.

**Live app:** TODO: add the deployed link
**Video:** TODO: add the video link

## Run it

```
npm install
npm run dev          # the app
npm test             # 45 unit tests
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
src/assets/      the font and image list, and the cache that loads them and images from links
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

**Choice 1: One function draws everything.**

The editor preview, the Output node, the PNG export and the batch run all use the same function, `render(preset, inputs)`. It draws the picture on a canvas at the full artboard size. The preview is the same picture, only shown smaller.

So what you see in the editor is what you get in the export. The export does not copy the preview. It draws the picture again with the same function.

Selection boxes, handles, guides and empty-slot hints are not part of the picture. They are normal page elements placed on top of it, so they can never appear in an export.

One problem I had to fix: on macOS, a canvas that is on the page picks up the page's font smoothing style, and this changed the text pixels. Now the drawing always happens on a canvas that is not on the page, and the result is copied into the preview.

What I rejected:

- A preview built with HTML and exported with html-to-image. The browser can break the text lines one way on screen and another way in the export.
- Konva and Fabric. These libraries keep their own copy of the scene and place text in their own way, so I would not control the pixels.

**Choice 2: I place the text myself.**

The engine measures each word, decides where each line breaks, and works out the exact position of every line in whole pixels. Only after that does it draw. The browser never decides a line break or the alignment.

What I rejected: drawing text as shapes with opentype.js. It would give closer results across browsers, but it needed more time than I had.

**Choice 3: A preset is plain JSON, and the input values are kept separate.**

A preset has three parts:

- **Artboard:** the size and the background colour.
- **Slots:** the inputs the node accepts.
- **Layers:** where and how each input is drawn.

The input values are a simple list of slot key and value. So one row of a CSV file is already one set of inputs. The connection points on the Composer node are the preset's slots. When you apply another preset, every wire whose slot key still exists stays connected.

What I rejected: keeping the values inside the layers. Then one preset could not be used for 100 products.

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

**When inputs do not fit.**

- Images are never stretched.
- A product image uses `contain`: the whole image is shown inside its box and sits on its anchor point. A tall bottle in a wide box keeps its shape and stands at the bottom centre.
- A backdrop uses `cover`: it fills the box, and the extra part is cropped around its anchor point.
- Text first wraps inside its box. If it still does not fit, the font size goes down one pixel at a time, until the smallest size set for that layer. If it still does not fit, the last line is cut and ends with "…".
- A word that is wider than the box gets its own line.
- If an input is missing, that layer is skipped.
- An image input can be a bundled asset or an `http(s)` link. If the link is dead, is not an image, or its host does not allow other websites to read it, that layer is skipped and the batch continues.
- Each of these cases shows a warning on the Output node, in the editor and on each batch result.

### 2. Limits

- **Same pixels only on the same browser and OS.** Text edges are drawn a little differently on each platform. Some browsers (Brave, Firefox in strict mode) add noise when a page reads canvas pixels, and this breaks the hash.
- **Boxes do not move.** When a title wraps to two lines, the tagline below it does not move down, so the two can touch. Set 3 shows this.
- **Fixed fonts, no upload.** Fonts come from a fixed list. An image is a bundled asset or a link.
- **A link can change.** If the host gives a different image tomorrow, the same CSV gives different pixels. Each link is fetched once per page load, and `run.json` saves the SHA-256 of the bytes it got. So a change can be noticed, but it cannot be stopped.
- **A link needs permission from its host.** It works only if the host allows other websites to read the image. The browser decodes linked images, so their pixels can differ between browser versions. The golden hashes cover bundled assets only.
- **Undo covers the preset only.** It does not cover the node graph. If deleting a slot removes a wire, undo does not bring the wire back.
- **One layout does not adapt to another size.** The 9:16 layout is a second preset. The editor can switch the artboard between nine sizes, but the layers do not move or scale. You place them again and save the result as a new preset.
- **Older browsers.** Text needs canvas `letterSpacing`, which older browsers do not have.

### 3. How I verified it

**45 unit tests** check: image fit maths, text wrap, shrink and cut, alignment, preset checks, wiring rules, drag geometry, and telling a link from an asset id.

**11 Playwright tests in Chrome** check:

- The 5 sample sets give the saved golden hashes.
- Two fresh browser sessions give the same hashes.
- Verify finds all 5 sets identical.
- Each downloaded PNG, decoded in Node, has the same hash as the editor preview, for all 5 sets.
- The Output node matches the preview.
- The zip has one PNG per set, with the hashes from the run.
- A long title shrinks first and is then cut.
- A batch draws a good link, gives a warning for a missing link, a web page and a host that blocks reading, and still finishes.
- A linked image exports with the same pixels as the preview.
- A bad link shows the reason on its input node.
- Choosing another artboard size changes the preview and the export, and one undo brings the old size back.

The link tests use a local server, not the internet.

**I checked that the golden test can fail.** I changed one text colour from `#3b1d10` to `#3b1d11`, and the test broke.

**Not verified:** Safari, Firefox and Windows; the real asset pack; very large images; touch input; runs of 100 or more sets.

### 4. When the agent got it wrong

Nothing much have to see lot of things at once so decided with other ai like chatgpt and claude to what to build on and to make the render engine ourself instead of using any liberary as per the scope so also thinking about the server rendering of the same node so we though of this so by using the headless browser we can run the jobs at the server adn generate them without relying on user side. 

### 5. The next primitive

Flex Implementation and auto adapt to diff sizes or aspect 

### 6. Hours

4-5 hours 
