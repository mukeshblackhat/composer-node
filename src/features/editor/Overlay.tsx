import { useRef, useState, type PointerEvent } from 'react';
import type { Frame, Layout, Preset } from '../../engine';
import { useStore } from '../../store';
import { cn } from '../../ui/cn';
import { CURSORS, HANDLE_SPOT, HANDLES, moveFrame, resizeFrame, snapMove, snapResize, type Guides, type HandleId } from './geometry';

type Drag = {
  layerId: string;
  mode: 'move' | HandleId;
  start: Frame;
  pointerX: number;
  pointerY: number;
  /** One tag per drag, so the whole drag is one undo step. */
  tag: string;
};

/** Snap when within this many screen pixels. */
const SNAP_PX = 6;

let dragCount = 0;

/**
 * Selection boxes, handles and guides, drawn as DOM on top of the preview
 * canvas. Nothing here is ever painted into the canvas, so editing aids can
 * not leak into an export.
 */
export function Overlay({ preset, layout, scale }: { preset: Preset; layout: Layout; scale: number }) {
  const selectedId = useStore((s) => s.selectedLayerId);
  const selectLayer = useStore((s) => s.selectLayer);
  const setFrame = useStore((s) => s.setFrame);
  const [guides, setGuides] = useState<Guides | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  const emptyLayers = new Set(layout.items.filter((i) => i.resolved === null).map((i) => i.layer.id));
  const selected = preset.layers.find((l) => l.id === selectedId && l.visible);
  const labelOf = (key: string) => preset.slots.find((s) => s.key === key)?.label ?? key;
  const px = (f: Frame) => ({ left: f.x * scale, top: f.y * scale, width: f.w * scale, height: f.h * scale });

  const begin = (e: PointerEvent, layerId: string, mode: Drag['mode']) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const layer = preset.layers.find((l) => l.id === layerId);
    if (!layer) return;
    selectLayer(layerId);
    drag.current = { layerId, mode, start: layer.frame, pointerX: e.clientX, pointerY: e.clientY, tag: `drag-${++dragCount}` };
    rootRef.current?.setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.pointerX) / scale;
    const dy = (e.clientY - d.pointerY) / scale;
    if (d.mode === 'move' && Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

    let frame = d.mode === 'move' ? moveFrame(d.start, dx, dy) : resizeFrame(d.start, d.mode, dx, dy);
    // Hold Alt to place freely without snapping.
    if (!e.altKey) {
      const snapped =
        d.mode === 'move'
          ? snapMove(frame, preset.artboard, SNAP_PX / scale)
          : snapResize(frame, d.mode, preset.artboard, SNAP_PX / scale);
      frame = snapped.frame;
      setGuides(snapped.guides.x.length || snapped.guides.y.length ? snapped.guides : null);
    } else {
      setGuides(null);
    }
    setFrame(d.layerId, frame, d.tag);
  };

  const end = () => {
    drag.current = null;
    setGuides(null);
  };

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 select-none"
      onPointerMove={onMove}
      onPointerUp={end}
      onPointerCancel={end}
      data-testid="overlay"
    >
      {/* Boxes in stack order, so a click lands on the top-most layer under the pointer. */}
      {preset.layers.map(
        (layer) =>
          layer.visible && (
            <div
              key={layer.id}
              data-layer-id={layer.id}
              className={cn(
                'absolute cursor-move',
                layer.id !== selectedId && 'hover:outline hover:outline-1 hover:outline-blue-500/60',
                emptyLayers.has(layer.id) && 'outline outline-1 outline-dashed outline-blue-500/70',
              )}
              style={px(layer.frame)}
              onPointerDown={(e) => begin(e, layer.id, 'move')}
            >
              {emptyLayers.has(layer.id) && (
                <span className="absolute inset-0 flex items-center justify-center bg-blue-500/5 text-xs font-medium text-blue-600">
                  {labelOf(layer.slot)}
                </span>
              )}
            </div>
          ),
      )}

      {/* The selection sits above every box, so its handles are always reachable. */}
      {selected && (
        <div
          className="pointer-events-none absolute outline-2 outline-blue-500 outline-solid"
          style={px(selected.frame)}
          data-testid="selection"
        >
          <span className="absolute -top-6 left-0 rounded bg-blue-500 px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-white">
            {labelOf(selected.slot)} · {selected.frame.w} × {selected.frame.h}
          </span>
          {HANDLES.map((h) => (
            <span
              key={h}
              data-handle={h}
              className="pointer-events-auto absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-blue-500 bg-white"
              style={{ left: `${HANDLE_SPOT[h].x * 100}%`, top: `${HANDLE_SPOT[h].y * 100}%`, cursor: CURSORS[h] }}
              onPointerDown={(e) => begin(e, selected.id, h)}
            />
          ))}
        </div>
      )}

      {guides?.x.map((x) => (
        <div key={`x${x}`} className="pointer-events-none absolute top-0 bottom-0 w-px bg-fuchsia-500" style={{ left: x * scale }} />
      ))}
      {guides?.y.map((y) => (
        <div key={`y${y}`} className="pointer-events-none absolute right-0 left-0 h-px bg-fuchsia-500" style={{ top: y * scale }} />
      ))}
    </div>
  );
}
