import { FlowCanvas } from './features/canvas/FlowCanvas';
import { LayoutEditor } from './features/editor/LayoutEditor';
import { PresetsPanel } from './features/presets/PresetsPanel';
import { RunPanel } from './features/runs/RunPanel';
import { TopBar } from './features/shell/TopBar';
import { useBoot } from './features/shell/useBoot';
import { useStore } from './store';

export default function App() {
  const status = useBoot();
  const editorOpen = useStore((s) => s.editorOpen);
  const panel = useStore((s) => s.panel);

  if (status === 'loading') {
    return <p className="flex h-screen items-center justify-center text-sm text-neutral-500">Loading fonts and images…</p>;
  }
  if (status !== 'ready') {
    return <p className="flex h-screen items-center justify-center text-sm text-red-700">{status.error}</p>;
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-50 text-neutral-900">
      <TopBar />
      <main className="relative min-h-0 flex-1">
        <FlowCanvas />
      </main>
      {editorOpen && <LayoutEditor />}
      {panel === 'presets' && <PresetsPanel />}
      {panel === 'runs' && <RunPanel />}
    </div>
  );
}
