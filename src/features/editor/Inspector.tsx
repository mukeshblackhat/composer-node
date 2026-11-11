import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Frame, Layer } from '../../engine';
import { useStore } from '../../store';
import { Button } from '../../ui/Button';
import { ColorField, NumberField, Section, SelectField, TextField } from '../../ui/fields';
import { artboardSizes, sizeKey } from './artboardSizes';
import { inspectorFor } from './inspectors';

export function Inspector() {
  const preset = useStore((s) => s.preset);
  const selectedId = useStore((s) => s.selectedLayerId);
  const layer = preset.layers.find((l) => l.id === selectedId);

  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-l border-neutral-200 bg-white" data-testid="inspector">
      {layer ? <LayerInspector key={layer.id} layer={layer} /> : <ArtboardInspector />}
    </aside>
  );
}

function ArtboardInspector() {
  const preset = useStore((s) => s.preset);
  const editPreset = useStore((s) => s.editPreset);
  const setArtboardSize = useStore((s) => s.setArtboardSize);

  const current = sizeKey(preset.artboard);
  const options = artboardSizes.map((size) => ({ value: sizeKey(size), label: size.label }));
  // A size that is not in the list, such as one from an imported preset.
  if (!options.some((o) => o.value === current)) options.unshift({ value: current, label: 'Custom' });

  return (
    <>
      <Section title="Artboard">
        <SelectField
          label="Size"
          value={current}
          options={options}
          testId="artboard-size"
          onChange={(key) => {
            const size = artboardSizes.find((s) => sizeKey(s) === key);
            if (size) setArtboardSize(size.width, size.height);
          }}
        />
        <p className="text-sm text-neutral-700 tabular-nums" data-testid="artboard-px">
          {preset.artboard.width} × {preset.artboard.height} px
        </p>
        <p className="text-xs leading-relaxed text-neutral-500">Layers stay where they are when the size changes.</p>
        <ColorField
          label="Background"
          value={preset.artboard.background}
          onChange={(background) => editPreset((p) => ({ ...p, artboard: { ...p.artboard, background } }), 'background')}
        />
      </Section>
      <Section title="Slots">
        <p className="text-xs leading-relaxed text-neutral-500">
          Each slot is an input on the Composer node and a column in a batch CSV.
        </p>
        <ul className="space-y-1 text-sm">
          {preset.slots.map((s) => (
            <li key={s.key} className="flex justify-between">
              <span>{s.label}</span>
              <code className="text-xs text-neutral-500">
                {s.key} · {s.type}
              </code>
            </li>
          ))}
        </ul>
      </Section>
      <p className="px-4 py-4 text-xs text-neutral-400">Select a layer to edit it.</p>
    </>
  );
}

function LayerInspector({ layer }: { layer: Layer }) {
  const preset = useStore((s) => s.preset);
  const setFrame = useStore((s) => s.setFrame);
  const updateLayer = useStore((s) => s.updateLayer);
  const removeLayer = useStore((s) => s.removeLayer);
  const selectLayer = useStore((s) => s.selectLayer);
  const Body = inspectorFor(layer);
  const frame = (patch: Partial<Frame>) => setFrame(layer.id, { ...layer.frame, ...patch }, `${layer.id}:frame`);

  return (
    <>
      <SlotSection slotKey={layer.slot} />

      <Section title="Frame">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={layer.frame.x} testId="frame-x" onChange={(x) => frame({ x })} />
          <NumberField label="Y" value={layer.frame.y} testId="frame-y" onChange={(y) => frame({ y })} />
          <NumberField label="Width" value={layer.frame.w} min={1} testId="frame-w" onChange={(w) => frame({ w })} />
          <NumberField label="Height" value={layer.frame.h} min={1} testId="frame-h" onChange={(h) => frame({ h })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            className="accent-blue-600"
            checked={layer.visible}
            onChange={(e) => updateLayer(layer.id, { visible: e.target.checked })}
          />
          Visible
        </label>
      </Section>

      <Body layer={layer} />

      <div className="px-4 py-4">
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={() => {
            removeLayer(layer.id);
            selectLayer(null);
          }}
        >
          Delete layer
        </Button>
        {preset.layers.filter((l) => l.slot === layer.slot).length === 1 && (
          <p className="mt-2 text-xs text-neutral-400">Its slot and the wire into it go too.</p>
        )}
      </div>
    </>
  );
}

/** Name and key of the slot a layer draws. The key is the CSV column. */
function SlotSection({ slotKey }: { slotKey: string }) {
  const slot = useStore((s) => s.preset.slots.find((x) => x.key === slotKey));
  const setSlotLabel = useStore((s) => s.setSlotLabel);
  const renameSlot = useStore((s) => s.renameSlot);
  const [key, setKey] = useState(slotKey);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setKey(slotKey);
    setError(null);
  }, [slotKey]);

  if (!slot) return null;

  const commitKey = () => {
    if (key === slot.key) return setError(null);
    const problem = renameSlot(slot.key, key.trim());
    setError(problem);
    if (problem) setKey(slot.key);
  };

  return (
    <Section title={`${slot.type === 'image' ? 'Image' : 'Text'} slot`}>
      <TextField label="Name" value={slot.label} onChange={(label) => setSlotLabel(slot.key, label)} testId="slot-label" />
      <TextField label="Key (CSV column)" value={key} onChange={setKey} onBlur={commitKey} error={error} testId="slot-key" />
    </Section>
  );
}
