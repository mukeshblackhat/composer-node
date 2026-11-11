import { ArrowLeft, Download, Redo2, Save, Undo2 } from 'lucide-react';
import { useEffect } from 'react';
import { useStore } from '../../store';
import { useEditorInputs } from '../../store/selectors';
import { Button } from '../../ui/Button';
import { cn } from '../../ui/cn';
import { exportPng } from '../render/exportPng';
import { Inspector } from './Inspector';
import { LayerList } from './LayerList';
import { Stage } from './Stage';

/** True when focus is in a field, so editor shortcuts stay out of the way. */
function typing(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

export function LayoutEditor() {
  const inputs = useEditorInputs();
  const preset = useStore((s) => s.preset);
  const isSaved = useStore((s) => {
    const saved = s.savedPresets.find((p) => p.id === s.preset.id);
    return !!saved && JSON.stringify(saved) === JSON.stringify(s.preset);
  });
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const rows = useStore((s) => s.rows);
  const inputSource = useStore((s) => s.inputSource);
  const { undo, redo, closeEditor, savePreset, setPresetName, setInputSource } = useStore.getState();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target)) return;
      const s = useStore.getState();
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        s.redo();
        return;
      }
      if (e.key === 'Escape') {
        if (s.selectedLayerId) s.selectLayer(null);
        else s.closeEditor();
        return;
      }

      const layer = s.preset.layers.find((l) => l.id === s.selectedLayerId);
      if (!layer) return;
      const step = e.shiftKey ? 10 : 1;
      const nudge: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      if (nudge[e.key]) {
        e.preventDefault();
        const [dx, dy] = nudge[e.key];
        s.setFrame(layer.id, { ...layer.frame, x: layer.frame.x + dx, y: layer.frame.y + dy }, `nudge:${layer.id}`);
      } else if (e.key === ']') {
        s.moveLayer(layer.id, 1);
      } else if (e.key === '[') {
        s.moveLayer(layer.id, -1);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        s.removeLayer(layer.id);
        s.selectLayer(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const exportName = typeof inputSource === 'number' ? `${preset.id}_set-${inputSource + 1}.png` : `${preset.id}.png`;

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-white" data-testid="layout-editor">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 px-3">
        <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={closeEditor}>
          Canvas
        </Button>
        <div className="h-6 w-px bg-neutral-200" />
        <input
          className="h-8 w-56 rounded-md border border-transparent px-2 text-sm font-semibold outline-none hover:border-neutral-200 focus:border-blue-500"
          value={preset.name}
          aria-label="Preset name"
          onChange={(e) => setPresetName(e.target.value)}
        />
        <span className={cn('text-xs', isSaved ? 'text-neutral-400' : 'text-amber-600')} data-testid="save-state">
          {isSaved ? 'Saved' : 'Unsaved changes'}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-neutral-500">
            Preview with
            <select
              className="h-8 w-60 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-900"
              value={String(inputSource)}
              data-testid="input-source"
              onChange={(e) => setInputSource(e.target.value === 'graph' ? 'graph' : Number(e.target.value))}
            >
              <option value="graph">Canvas inputs</option>
              {rows.map((row, i) => (
                <option key={i} value={i}>
                  Set {i + 1}: {row.title ?? Object.values(row)[0]}
                </option>
              ))}
            </select>
          </label>
          <div className="h-6 w-px bg-neutral-200" />
          <Button variant="ghost" aria-label="Undo" title="Undo (⌘Z)" disabled={!canUndo} onClick={undo} icon={<Undo2 size={16} />} />
          <Button variant="ghost" aria-label="Redo" title="Redo (⇧⌘Z)" disabled={!canRedo} onClick={redo} icon={<Redo2 size={16} />} />
          <Button icon={<Save size={15} />} onClick={savePreset} disabled={isSaved}>
            Save preset
          </Button>
          <Button
            variant="primary"
            icon={<Download size={15} />}
            data-testid="export-png"
            onClick={() => exportPng(useStore.getState().preset, inputs, exportName)}
          >
            Export PNG
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <LayerList />
        <Stage inputs={inputs} />
        <Inspector />
      </div>
    </div>
  );
}
