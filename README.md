# Composer node

A deterministic Composer node: a layout preset plus a set of inputs gives one PNG.

Status: the render engine and a test page are done. The node canvas, the layout
editor, presets and batch runs come next. The images in `public/assets/images`
are stand-ins until the real asset pack is added.

## Run it

```
npm install
npm run dev        # test page: 5 input sets rendered with the seed preset
npm test           # unit tests for image fit and text layout
npm run typecheck
npm run build
```

## Where things are

- `src/engine/` is the renderer. It is pure TypeScript with no React in it.
- `src/presets/` holds presets as plain JSON.
- `src/assets/` loads the bundled fonts and images.
- `AGENTS.md` lists the rules the code follows.
