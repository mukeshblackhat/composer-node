import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Download, Image } from 'lucide-react';
import { useRef } from 'react';
import { useStore } from '../../../store';
import { COMPOSER_ID, OUTPUT_ID, type OutputNode as OutputNodeType } from '../../../store/graphTypes';
import { useGraphInputs } from '../../../store/selectors';
import { Button } from '../../../ui/Button';
import { WarningBadges } from '../../../ui/WarningBadges';
import { exportPng } from '../../render/exportPng';
import { useRender } from '../../render/useRender';
import { handleStyle, IMAGE_BLUE, NodeLabel } from './NodeLabel';

const NOTHING = {};

export function OutputNode(_: NodeProps<OutputNodeType>) {
  const preset = useStore((s) => s.preset);
  const connected = useStore((s) => s.edges.some((e) => e.source === COMPOSER_ID && e.target === OUTPUT_ID));
  const graphInputs = useGraphInputs();
  const inputs = connected ? graphInputs : NOTHING;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { layout, hash } = useRender(canvasRef, preset, inputs, { hash: true });
  const { width, height } = preset.artboard;

  return (
    <div className="w-72" data-testid="node-output">
      <NodeLabel icon={<Image size={12} />}>Output</NodeLabel>
      <div className="rounded-xl border border-neutral-200 bg-white p-2 shadow-sm">
        {/* Fits inside 272 × 360, so a tall format does not make a tall node. */}
        <div
          className="relative mx-auto overflow-hidden rounded-lg bg-neutral-100"
          style={{ width: Math.min(272, (360 * width) / height), aspectRatio: `${width} / ${height}` }}
        >
          <canvas ref={canvasRef} data-testid="output-canvas" className={`block h-full w-full ${connected ? '' : 'invisible'}`} />
          {!connected && (
            <span className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500">
              Connect the Composer
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <code className="truncate font-mono text-[11px] text-neutral-500" data-testid="output-hash" data-hash={hash} title={hash}>
            {hash ? hash.slice(0, 12) : '…'}
          </code>
          <Button
            size="sm"
            className="nodrag"
            icon={<Download size={13} />}
            disabled={!connected}
            onClick={() => exportPng(preset, inputs, `${preset.id}.png`)}
          >
            PNG
          </Button>
        </div>
        {layout && layout.warnings.length > 0 && (
          <div className="mt-2">
            <WarningBadges warnings={layout.warnings} preset={preset} />
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} id="in" style={{ ...handleStyle(IMAGE_BLUE), top: 120 }} />
    </div>
  );
}
