import { describe, expect, it } from 'vitest';
import { moveFrame, resizeFrame, snapMove, snapResize } from '../../src/features/editor/geometry';

const frame = { x: 100, y: 100, w: 200, h: 100 };
const board = { width: 1080, height: 1080 };

describe('moveFrame and resizeFrame', () => {
  it('moves by whole pixels', () => {
    expect(moveFrame(frame, 10.4, -5.6)).toEqual({ x: 110, y: 94, w: 200, h: 100 });
  });

  it('keeps the opposite side still when resizing', () => {
    expect(resizeFrame(frame, 'se', 20, 10)).toEqual({ x: 100, y: 100, w: 220, h: 110 });
    expect(resizeFrame(frame, 'nw', 20, 10)).toEqual({ x: 120, y: 110, w: 180, h: 90 });
    expect(resizeFrame(frame, 'e', 0, 999)).toEqual({ x: 100, y: 100, w: 200, h: 100 });
  });

  it('never makes a frame smaller than 8 px or flips it', () => {
    const tiny = resizeFrame(frame, 'w', 500, 0);
    expect(tiny.w).toBe(8);
    expect(tiny.x + tiny.w).toBe(frame.x + frame.w);
  });
});

describe('snapping', () => {
  it('snaps a frame centre to the artboard centre', () => {
    // Centre at 537, 3 px from 540.
    const { frame: f, guides } = snapMove({ x: 437, y: 300, w: 200, h: 100 }, board, 6);
    expect(f.x).toBe(440);
    expect(guides.x).toEqual([540]);
    expect(guides.y).toEqual([]);
  });

  it('snaps to the nearer line when two are in reach', () => {
    const { frame: f } = snapMove({ x: 4, y: 0, w: 100, h: 100 }, board, 6);
    expect(f.x).toBe(0);
  });

  it('leaves a frame alone when nothing is close', () => {
    const start = { x: 300, y: 300, w: 100, h: 100 };
    expect(snapMove(start, board, 6)).toEqual({ frame: start, guides: { x: [], y: [] } });
  });

  it('snaps only the edge a handle moves', () => {
    const { frame: f, guides } = snapResize({ x: 100, y: 100, w: 977, h: 100 }, 'e', board, 6);
    expect(f).toEqual({ x: 100, y: 100, w: 980, h: 100 });
    expect(guides.x).toEqual([1080]);
  });
});
