import { FolderOpen, Layers, Play, RotateCcw, SquarePen } from 'lucide-react';
import { resetApp, useStore } from '../../store';
import { Button } from '../../ui/Button';

export function TopBar() {
  const preset = useStore((s) => s.preset);
  const savedPresets = useStore((s) => s.savedPresets);
  const { applyPreset, setPanel, openEditor } = useStore.getState();
  const inSaved = savedPresets.some((p) => p.id === preset.id);

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-900 text-white">
          <Layers size={14} />
        </span>
        <span className="text-sm font-semibold">Composer node</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-neutral-500">
          Preset
          <select
            className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-900"
            value={inSaved ? preset.id : ''}
            onChange={(e) => e.target.value && applyPreset(e.target.value)}
            data-testid="preset-picker"
          >
            {!inSaved && <option value="">{preset.name} (not saved)</option>}
            {savedPresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <Button icon={<SquarePen size={14} />} onClick={openEditor}>
          Edit layout
        </Button>
        <Button icon={<FolderOpen size={14} />} onClick={() => setPanel('presets')} data-testid="open-presets">
          Presets
        </Button>
        <Button variant="primary" icon={<Play size={14} />} onClick={() => setPanel('runs')} data-testid="open-runs">
          Batch run
        </Button>
        <Button
          variant="ghost"
          aria-label="Reset demo"
          title="Clear saved state and start over"
          icon={<RotateCcw size={14} />}
          onClick={() => window.confirm('Clear the canvas and saved presets, and start over?') && resetApp()}
        />
      </div>
    </header>
  );
}
