import type { BlendMode, ImageLayer } from '../../../engine';
import { useStore } from '../../../store';
import { cn } from '../../../ui/cn';
import { Field, Section, Segmented, SelectField } from '../../../ui/fields';

const BLENDS: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
];

const STEPS = [0, 0.5, 1];

export function ImageInspector({ layer }: { layer: ImageLayer }) {
  const updateLayer = useStore((s) => s.updateLayer);
  const set = (field: string, patch: Partial<ImageLayer>) => updateLayer(layer.id, patch, `${layer.id}:${field}`);
  const percent = Math.round(layer.opacity * 100);

  return (
    <Section title="Image">
      <Field label="Opacity">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            value={percent}
            className="min-w-0 flex-1 accent-blue-600"
            data-testid="opacity"
            onChange={(e) => set('opacity', { opacity: Number(e.target.value) / 100 })}
          />
          <span className="w-10 text-right text-xs text-neutral-600 tabular-nums">{percent}%</span>
        </div>
      </Field>
      <SelectField label="Blend mode" value={layer.blend} options={BLENDS} testId="blend" onChange={(blend) => set('blend', { blend })} />
      <Segmented
        label="Fit"
        value={layer.fit}
        onChange={(fit) => set('fit', { fit })}
        options={[
          { value: 'contain', label: 'Contain' },
          { value: 'cover', label: 'Cover' },
        ]}
      />
      <p className="text-xs leading-relaxed text-neutral-500">
        {layer.fit === 'contain'
          ? 'Shows the whole image inside the frame. It is never stretched; spare room goes where the anchor says.'
          : 'Fills the frame and crops what does not fit. The anchor picks which part stays.'}
      </p>
      <Field label="Anchor">
        <div className="grid w-24 grid-cols-3 gap-1" role="radiogroup" aria-label="Anchor">
          {STEPS.map((y) =>
            STEPS.map((x) => {
              const on = layer.anchor.x === x && layer.anchor.y === y;
              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={`Anchor ${x * 100}% ${y * 100}%`}
                  onClick={() => set('anchor', { anchor: { x, y } })}
                  className={cn(
                    'h-7 rounded border',
                    on ? 'border-blue-500 bg-blue-500' : 'border-neutral-200 bg-white hover:border-neutral-400',
                  )}
                />
              );
            }),
          )}
        </div>
      </Field>
    </Section>
  );
}
