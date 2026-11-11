import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react';
import { ArrowUpRight, Layers } from 'lucide-react';
import { useEffect } from 'react';
import type { Preset } from '../../../engine';
import { useStore } from '../../../store';
import type { ComposerNode as ComposerNodeType } from '../../../store/graphTypes';
import { handleStyle, IMAGE_BLUE, NodeLabel, TEXT_ORANGE } from './NodeLabel';

export function ComposerNode({ id }: NodeProps<ComposerNodeType>) {
  const preset = useStore((s) => s.preset);
  const openEditor = useStore((s) => s.openEditor);
  const updateNodeInternals = useUpdateNodeInternals();
  const slotKeys = preset.slots.map((s) => s.key).join('|');

  // The handles follow the preset's slots, so React Flow must measure again when they change.
  useEffect(() => updateNodeInternals(id), [id, slotKeys, updateNodeInternals]);

  return (
    <div className="w-64" data-testid="node-composer">
      <NodeLabel icon={<Layers size={12} />}>Composer</NodeLabel>
      <div className="rounded-xl border-2 border-blue-500 bg-white shadow-md">
        <ul className="py-1.5">
          {preset.slots.map((slot) => (
            <li key={slot.key} className="relative flex h-7 items-center justify-between px-3 text-sm" data-slot={slot.key}>
              <Handle
                type="target"
                position={Position.Left}
                id={slot.key}
                style={handleStyle(slot.type === 'image' ? IMAGE_BLUE : TEXT_ORANGE)}
              />
              <span className="truncate text-neutral-800">{slot.label}</span>
              <span className="text-xs text-neutral-400">{slot.type}</span>
            </li>
          ))}
        </ul>
        <div className="relative mx-2 rounded-lg bg-neutral-100 p-3">
          <Wireframe preset={preset} />
          <Handle type="source" position={Position.Right} id="out" style={{ ...handleStyle(IMAGE_BLUE), right: -14 }} />
        </div>
        <footer className="flex items-center justify-between px-3 py-2.5 text-sm">
          <span className="truncate font-medium text-neutral-800">{preset.name}</span>
          <button
            type="button"
            className="nodrag flex shrink-0 items-center gap-0.5 text-xs text-neutral-500 hover:text-blue-600"
            onClick={openEditor}
            data-testid="edit-layout"
          >
            Edit <ArrowUpRight size={12} />
          </button>
        </footer>
      </div>
    </div>
  );
}

/** The layout's frames as dashed boxes: what goes where, with no pixels. */
function Wireframe({ preset }: { preset: Preset }) {
  const { width, height } = preset.artboard;
  const maxW = 176;
  const maxH = 200;
  const scale = Math.min(maxW / width, maxH / height);
  const labelOf = (key: string) => preset.slots.find((s) => s.key === key)?.label ?? key;

  return (
    <div className="relative mx-auto bg-white" style={{ width: width * scale, height: height * scale }}>
      {preset.layers.map((layer) => {
        if (!layer.visible) return null;
        const f = layer.frame;
        const big = f.w * f.h > width * height * 0.6;
        return (
          <div
            key={layer.id}
            className={`absolute flex overflow-hidden border border-dashed border-blue-400 bg-blue-50/40 p-0.5 text-[9px] leading-none text-blue-600 ${
              big ? 'items-end justify-start' : 'items-center justify-center'
            }`}
            style={{ left: f.x * scale, top: f.y * scale, width: f.w * scale, height: f.h * scale }}
          >
            {labelOf(layer.slot)}
          </div>
        );
      })}
    </div>
  );
}
