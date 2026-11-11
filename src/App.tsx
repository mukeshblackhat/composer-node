// Engine test page. It renders every CSV row with the seed preset and shows
// the pixel hash. The node canvas and the layout editor will replace it.

import Papa from 'papaparse';
import { useEffect, useRef, useState } from 'react';
import { getImage, loadAssets } from './assets/loader';
import { inputSetsUrl } from './assets/manifest';
import { canvasToPng, hashCanvas, render, type InputSet, type Preset, type Warning } from './engine';
import { seedPresets } from './presets';

type Status = 'loading' | 'ready' | { error: string };
type Check = 'idle' | 'running' | { same: number; total: number };

const preset = seedPresets[0];

async function fetchInputSets(): Promise<InputSet[]> {
  const text = await (await fetch(inputSetsUrl)).text();
  return Papa.parse<InputSet>(text, { header: true, skipEmptyLines: true }).data;
}

export default function App() {
  const [status, setStatus] = useState<Status>('loading');
  const [sets, setSets] = useState<InputSet[]>([]);
  const [check, setCheck] = useState<Check>('idle');

  useEffect(() => {
    Promise.all([loadAssets(), fetchInputSets()])
      .then(([, rows]) => {
        setSets(rows);
        setStatus('ready');
      })
      .catch((e: Error) => setStatus({ error: e.message }));
  }, []);

  // Render each set 3 times on fresh canvases and compare the hashes.
  async function verify() {
    setCheck('running');
    let same = 0;
    for (const inputs of sets) {
      const hashes = new Set<string>();
      for (let i = 0; i < 3; i++) {
        hashes.add(await hashCanvas(render(preset, inputs, getImage).canvas));
      }
      if (hashes.size === 1) same++;
    }
    setCheck({ same, total: sets.length });
  }

  if (status === 'loading') return <p className="p-6 text-neutral-500">Loading fonts and images…</p>;
  if (status !== 'ready') return <p className="p-6 text-red-700">{status.error}</p>;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex flex-wrap items-center gap-4">
        <div className="mr-auto">
          <h1 className="text-xl font-semibold">Composer engine</h1>
          <p className="text-sm text-neutral-500">
            Preset "{preset.name}" on {sets.length} input sets
          </p>
        </div>
        {typeof check === 'object' && (
          <span
            data-testid="verify-result"
            className={check.same === check.total ? 'text-sm text-green-700' : 'text-sm text-red-700'}
          >
            {check.same} of {check.total} sets gave identical pixels on 3 renders
          </span>
        )}
        <button
          onClick={verify}
          disabled={check === 'running'}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {check === 'running' ? 'Checking…' : 'Verify'}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sets.map((inputs, i) => (
          <RenderCard key={i} index={i} preset={preset} inputs={inputs} />
        ))}
      </div>
    </main>
  );
}

function RenderCard({ index, preset, inputs }: { index: number; preset: Preset; inputs: InputSet }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hash, setHash] = useState('');
  const [warnings, setWarnings] = useState<Warning[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let live = true;
    const result = render(preset, inputs, getImage, canvas);
    setWarnings(result.warnings);
    hashCanvas(canvas).then((h) => live && setHash(h));
    return () => {
      live = false;
    };
  }, [preset, inputs]);

  // Export renders again on a fresh canvas. It does not copy the preview.
  async function download() {
    const blob = await canvasToPng(render(preset, inputs, getImage).canvas);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${preset.id}-${index + 1}.png`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <article className="overflow-hidden rounded-lg border border-neutral-200">
      {/* The canvas keeps its full artboard size. CSS only scales it down. */}
      <canvas ref={canvasRef} className="block h-auto w-full" />
      <div className="space-y-2 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium">Set {index + 1}</span>
          <button onClick={download} className="text-blue-700 hover:underline">
            Download PNG
          </button>
        </div>
        <code data-testid="hash" data-hash={hash} className="block truncate text-xs text-neutral-500">
          {hash ? hash.slice(0, 16) : '…'}
        </code>
        <div className="flex flex-wrap gap-1">
          {warnings.map((w) => (
            <span key={w.layerId + w.code} className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">
              {w.slot}: {w.code}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
