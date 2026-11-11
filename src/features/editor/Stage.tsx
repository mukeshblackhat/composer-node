import { useLayoutEffect, useRef, useState } from 'react';
import type { InputSet } from '../../engine';
import { useStore } from '../../store';
import { WarningBadges } from '../../ui/WarningBadges';
import { useRender } from '../render/useRender';
import { Overlay } from './Overlay';

const PADDING = 48;

/** The preview: the real render, scaled down by CSS, with the editing overlay on top. */
export function Stage({ inputs }: { inputs: InputSet }) {
  const preset = useStore((s) => s.preset);
  const selectLayer = useStore((s) => s.selectLayer);
  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [area, setArea] = useState({ w: 0, h: 0 });
  const { layout, hash } = useRender(canvasRef, preset, inputs, { hash: true });

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setArea({ w: entry.contentRect.width, h: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { width, height } = preset.artboard;
  const scale = area.w > 0 ? Math.max(0.05, Math.min((area.w - PADDING * 2) / width, (area.h - PADDING * 2) / height)) : 0;

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-neutral-100">
      <div
        ref={areaRef}
        className="relative min-h-0 flex-1 overflow-hidden"
        onPointerDown={(e) => e.target === e.currentTarget && selectLayer(null)}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.08)]"
          style={{ width: width * scale, height: height * scale }}
        >
          <canvas ref={canvasRef} data-testid="preview-canvas" className="block h-full w-full" />
          {layout && scale > 0 && <Overlay preset={preset} layout={layout} scale={scale} />}
        </div>
      </div>

      <footer className="flex min-h-10 shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-500">
        <span className="tabular-nums">
          {width} × {height} px · {Math.round(scale * 100)}%
        </span>
        <span className="flex items-center gap-1">
          Pixel hash
          <code data-testid="preview-hash" data-hash={hash} className="font-mono text-neutral-800">
            {hash ? hash.slice(0, 12) : '…'}
          </code>
        </span>
        {layout && <WarningBadges warnings={layout.warnings} preset={preset} />}
      </footer>
    </div>
  );
}
