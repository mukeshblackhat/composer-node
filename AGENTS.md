# Rules for coding agents

This app renders a layout preset plus an input set to one image. The same
preset and inputs must always give the same pixels.

## The engine boundary

- `src/engine/` is pure TypeScript. It must not import React, Zustand or
  anything from `src/features/` or `src/store/`.
- Nothing outside `src/engine/` may call methods on a canvas 2D context.
  The preview, the PNG export and the batch run all call `render()`.
- `render()` reads no clock, no random number, no window size and no
  `devicePixelRatio`. The canvas is always the artboard size.

## Layout rules

- Frames and font sizes are whole artboard pixels.
- Text is wrapped by `engine/text.ts`. Never rely on CSS or the browser to
  break lines.
- Images are never stretched. They use `contain` or `cover`.
- Every fallback (shrunk text, cut text, missing input) returns a warning.

## Fonts and images

- Fonts come only from `public/assets/fonts` and are loaded before any
  render. If a font is missing, fail. Never fall back to a system font.
- Decoded images and fonts live in the asset cache, not in the store.

## Adding a layer type

Add one file in `src/engine/layers/` that exports a `LayerType`, add its
type to the `Layer` union in `engine/types.ts`, and register it in
`engine/layers/index.ts`. No other engine file should need to change.

## Working style

- Keep commits small, one step each.
- Run `npm run typecheck` and `npm test` before every commit.
