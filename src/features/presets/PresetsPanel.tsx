import { Braces, Check, Download, Trash2, Upload } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { useStore } from '../../store';
import { Button } from '../../ui/Button';
import { cn } from '../../ui/cn';
import { Drawer } from '../../ui/Drawer';
import { downloadJson } from '../../ui/download';

/** Save, apply, import and export presets. A preset is data, so it can be read as JSON right here. */
export function PresetsPanel() {
  const preset = useStore((s) => s.preset);
  const savedPresets = useStore((s) => s.savedPresets);
  const { savePreset, saveAsNew, applyPreset, importPreset, deleteSavedPreset, setPanel } = useStore.getState();
  const [newName, setNewName] = useState(`${preset.name} copy`);
  const [showJson, setShowJson] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const saved = savedPresets.find((p) => p.id === preset.id);
  const isSaved = !!saved && JSON.stringify(saved) === JSON.stringify(preset);

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let value: unknown;
    try {
      value = JSON.parse(await file.text());
    } catch {
      setImportError('That file is not valid JSON.');
      return;
    }
    setImportError(importPreset(value));
  };

  return (
    <Drawer title="Presets" onClose={() => setPanel(null)} testId="presets-panel">
      <section className="space-y-3 border-b border-neutral-100 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-neutral-500">On the canvas</p>
            <p className="truncate font-semibold">{preset.name}</p>
          </div>
          <span className={cn('shrink-0 text-xs', isSaved ? 'text-neutral-400' : 'text-amber-600')}>
            {isSaved ? 'Saved' : saved ? 'Unsaved changes' : 'Not saved yet'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={savePreset} disabled={isSaved} data-testid="save-preset">
            Save
          </Button>
          <Button icon={<Download size={14} />} onClick={() => downloadJson(preset, `${preset.id}.json`)}>
            Export JSON
          </Button>
          <Button icon={<Braces size={14} />} onClick={() => setShowJson(!showJson)}>
            {showJson ? 'Hide JSON' : 'View JSON'}
          </Button>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) saveAsNew(newName.trim());
          }}
        >
          <input
            className="h-8 min-w-0 flex-1 rounded-md border border-neutral-200 px-2 text-sm outline-none focus:border-blue-500"
            value={newName}
            aria-label="New preset name"
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button type="submit" disabled={!newName.trim()}>
            Save as new
          </Button>
        </form>
        {showJson && (
          <pre
            className="max-h-96 overflow-auto rounded-lg bg-neutral-950 p-3 font-mono text-[11px] leading-relaxed text-neutral-100"
            data-testid="preset-json"
          >
            {JSON.stringify(preset, null, 2)}
          </pre>
        )}
      </section>

      <section className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wide text-neutral-900 uppercase">Saved presets</h3>
          <label className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-neutral-200 px-2 text-xs font-medium hover:bg-neutral-50">
            <Upload size={13} /> Import JSON
            <input type="file" accept="application/json,.json" className="hidden" onChange={onImport} data-testid="import-preset" />
          </label>
        </div>
        {importError && <p className="mb-2 rounded-md bg-red-50 p-2 text-xs text-red-700">{importError}</p>}
        <ul className="divide-y divide-neutral-100">
          {savedPresets.map((p) => {
            const current = p.id === preset.id;
            return (
              <li key={p.id} className="flex items-center gap-2 py-2.5" data-preset-id={p.id}>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {current && <Check size={14} className="text-blue-600" />}
                    {p.name}
                  </p>
                  <p className="text-xs text-neutral-500 tabular-nums">
                    {p.artboard.width} × {p.artboard.height} · {p.slots.length} slots · {p.layers.length} layers
                  </p>
                </div>
                <Button size="sm" disabled={current} onClick={() => applyPreset(p.id)}>
                  {current ? 'In use' : 'Apply'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Export ${p.name}`}
                  icon={<Download size={14} />}
                  onClick={() => downloadJson(p, `${p.id}.json`)}
                />
                <Button
                  size="sm"
                  variant="danger"
                  aria-label={`Delete ${p.name}`}
                  icon={<Trash2 size={14} />}
                  disabled={savedPresets.length === 1}
                  onClick={() => deleteSavedPreset(p.id)}
                />
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-neutral-500">
          Applying a preset keeps the wires whose slot keys still exist, so the same inputs render in the new layout.
        </p>
      </section>
    </Drawer>
  );
}
