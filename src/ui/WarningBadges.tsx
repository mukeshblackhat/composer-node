import type { Preset, Warning, WarningCode } from '../engine';

const TEXT: Record<WarningCode, string> = {
  'missing-input': 'no input',
  'missing-asset': 'image not found',
  'text-shrunk': 'shrunk to fit',
  'text-truncated': 'cut off',
};

const TONE: Record<WarningCode, string> = {
  'missing-input': 'bg-neutral-100 text-neutral-600',
  'missing-asset': 'bg-red-100 text-red-800',
  'text-shrunk': 'bg-amber-100 text-amber-900',
  'text-truncated': 'bg-red-100 text-red-800',
};

/** One small badge per warning, such as "Title: shrunk to fit". */
export function WarningBadges({ warnings, preset }: { warnings: Warning[]; preset: Preset }) {
  if (warnings.length === 0) return null;
  const labelOf = (key: string) => preset.slots.find((s) => s.key === key)?.label ?? key;
  return (
    <div className="flex flex-wrap gap-1" data-testid="warnings">
      {warnings.map((w) => (
        <span
          key={w.layerId + w.code}
          data-code={w.code}
          className={`rounded px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${TONE[w.code]}`}
        >
          {labelOf(w.slot)}: {TEXT[w.code]}
        </span>
      ))}
    </div>
  );
}
