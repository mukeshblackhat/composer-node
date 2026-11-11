import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { fontFamilies, weightsOf } from '../../../assets/manifest';
import type { TextLayer } from '../../../engine';
import { useStore } from '../../../store';
import { ColorField, NumberField, Section, Segmented, SelectField } from '../../../ui/fields';

const WEIGHT_NAMES: Record<number, string> = { 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold' };

export function TextInspector({ layer }: { layer: TextLayer }) {
  const updateLayer = useStore((s) => s.updateLayer);
  // One tag per field: typing in one box becomes one undo step.
  const set = (field: string, patch: Partial<TextLayer>) => updateLayer(layer.id, patch, `${layer.id}:${field}`);
  const weights = weightsOf(layer.family);

  return (
    <>
      <Section title="Text">
        <SelectField
          label="Family"
          value={layer.family}
          testId="font-family"
          options={fontFamilies.map((f) => ({ value: f, label: f }))}
          onChange={(family) => {
            // Keep the weight if the new family has it, else take its first one.
            const available = weightsOf(family);
            set('family', { family, weight: available.includes(layer.weight) ? layer.weight : available[0] });
          }}
        />
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Weight"
            value={layer.weight}
            options={weights.map((w) => ({ value: w, label: `${WEIGHT_NAMES[w] ?? w} ${w}` }))}
            onChange={(weight) => set('weight', { weight })}
          />
          <NumberField label="Size" value={layer.size} min={1} max={1000} testId="font-size" onChange={(size) => set('size', { size })} />
        </div>
        <ColorField label="Colour" value={layer.color} onChange={(color) => set('color', { color })} />
        <div className="grid grid-cols-2 gap-2">
          <Segmented
            label="Align"
            value={layer.align}
            onChange={(align) => set('align', { align })}
            options={[
              { value: 'left', label: 'Left', icon: <AlignLeft size={14} /> },
              { value: 'center', label: 'Centre', icon: <AlignCenter size={14} /> },
              { value: 'right', label: 'Right', icon: <AlignRight size={14} /> },
            ]}
          />
          <Segmented
            label="Vertical"
            value={layer.valign}
            onChange={(valign) => set('valign', { valign })}
            options={[
              { value: 'top', label: 'Top' },
              { value: 'middle', label: 'Mid' },
              { value: 'bottom', label: 'End' },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Line height"
            value={layer.lineHeight}
            step={0.05}
            min={0.5}
            max={4}
            precision={2}
            onChange={(lineHeight) => set('lineHeight', { lineHeight })}
          />
          <NumberField
            label="Letter spacing"
            value={layer.letterSpacing}
            step={0.5}
            min={-50}
            max={200}
            precision={1}
            onChange={(letterSpacing) => set('letterSpacing', { letterSpacing })}
          />
        </div>
      </Section>

      <Section title="When text is too long">
        <p className="text-xs leading-relaxed text-neutral-500">
          Text wraps to the frame. If it still does not fit, it shrinks one pixel at a time down to the smallest size,
          then is cut with an ellipsis after the last line.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Smallest size"
            value={layer.overflow.minSize}
            min={1}
            max={layer.size}
            onChange={(minSize) => set('minSize', { overflow: { ...layer.overflow, minSize } })}
          />
          <NumberField
            label="Most lines"
            value={layer.overflow.maxLines}
            min={1}
            max={50}
            onChange={(maxLines) => set('maxLines', { overflow: { ...layer.overflow, maxLines } })}
          />
        </div>
      </Section>
    </>
  );
}
