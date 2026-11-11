import { ArrowUpRight, Download, FileSpreadsheet, Play, ShieldCheck, Upload } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { inputSetsUrl } from '../../assets/manifest';
import type { Preset } from '../../engine';
import { useStore } from '../../store';
import { Button } from '../../ui/Button';
import { cn } from '../../ui/cn';
import { Drawer } from '../../ui/Drawer';
import { WarningBadges } from '../../ui/WarningBadges';
import { parseCsv } from './csv';
import { downloadZip, runBatch, verifyBatch } from './runBatch';

/** Run one preset on a list of input sets and get one PNG per set. */
export function RunPanel() {
  const current = useStore((s) => s.preset);
  const savedPresets = useStore((s) => s.savedPresets);
  const rows = useStore((s) => s.rows);
  const rowsSource = useStore((s) => s.rowsSource);
  const results = useStore((s) => s.results);
  const resultsPresetId = useStore((s) => s.resultsPresetId);
  const running = useStore((s) => s.running);
  const verify = useStore((s) => s.verify);
  const { setRows, setVerify, setPanel, loadValues } = useStore.getState();

  const [presetChoice, setPresetChoice] = useState<string>('current');
  const [csvError, setCsvError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const preset: Preset = presetChoice === 'current' ? current : (savedPresets.find((p) => p.id === presetChoice) ?? current);
  const columns = new Set(rows.flatMap((r) => Object.keys(r)));
  const missing = preset.slots.filter((s) => !columns.has(s.key));
  const done = !running && results.length === rows.length && results.length > 0 && resultsPresetId === preset.id;

  const loadCsv = (text: string, source: string) => {
    try {
      setRows(parseCsv(text).rows, source);
      setCsvError(null);
    } catch (e) {
      setCsvError((e as Error).message);
    }
  };

  const onUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) loadCsv(await file.text(), file.name);
  };

  const onVerify = async () => {
    setVerifying(true);
    setVerify(await verifyBatch(preset, rows, resultsPresetId === preset.id ? results : []));
    setVerifying(false);
  };

  return (
    <Drawer title="Batch run" onClose={() => setPanel(null)} width="w-[600px]" testId="run-panel">
      <section className="space-y-3 border-b border-neutral-100 p-4">
        <label className="flex items-center gap-3 text-sm">
          <span className="w-16 text-xs font-medium text-neutral-500">Preset</span>
          <select
            className="h-8 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 text-sm"
            value={presetChoice}
            onChange={(e) => setPresetChoice(e.target.value)}
            data-testid="run-preset"
          >
            <option value="current">{current.name} (on the canvas)</option>
            {savedPresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (saved)
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3 text-sm">
          <span className="w-16 text-xs font-medium text-neutral-500">Inputs</span>
          <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
            <FileSpreadsheet size={14} className="shrink-0 text-neutral-400" />
            {rowsSource || 'None'} · {rows.length} sets
          </span>
          <Button size="sm" variant="ghost" onClick={async () => loadCsv(await (await fetch(inputSetsUrl)).text(), 'Sample CSV')}>
            Sample
          </Button>
          <label className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-neutral-200 px-2 text-xs font-medium hover:bg-neutral-50">
            <Upload size={13} /> CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onUpload} data-testid="upload-csv" />
          </label>
        </div>
        {csvError && <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{csvError}</p>}
        {missing.length > 0 && (
          <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-900">
            The CSV has no column for {missing.map((s) => `"${s.key}"`).join(', ')}. Those slots stay empty.
          </p>
        )}

        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-2 py-1.5 font-medium">#</th>
                {preset.slots.map((s) => (
                  <th key={s.key} className={cn('px-2 py-1.5 font-medium', !columns.has(s.key) && 'text-amber-700')}>
                    {s.key}
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="px-2 py-1.5 text-neutral-400 tabular-nums">{i + 1}</td>
                  {preset.slots.map((s) => (
                    <td key={s.key} className="max-w-36 truncate px-2 py-1.5" title={row[s.key]}>
                      {row[s.key] ?? <span className="text-neutral-300">empty</span>}
                    </td>
                  ))}
                  <td className="px-1 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Put this set into the canvas inputs"
                      aria-label={`Use set ${i + 1} on the canvas`}
                      icon={<ArrowUpRight size={13} />}
                      onClick={() => {
                        loadValues(row);
                        setPanel(null);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            icon={<Play size={14} />}
            disabled={running || rows.length === 0}
            onClick={() => runBatch(preset, rows)}
            data-testid="run-batch"
          >
            {running ? `Rendering ${results.length + 1} of ${rows.length}…` : `Render ${rows.length} PNGs`}
          </Button>
          <Button icon={<Download size={14} />} disabled={!done} onClick={() => downloadZip(preset, rows, results)} data-testid="download-zip">
            Download all (.zip)
          </Button>
          <Button icon={<ShieldCheck size={14} />} disabled={verifying || running || rows.length === 0} onClick={onVerify} data-testid="verify">
            {verifying ? 'Checking…' : 'Verify'}
          </Button>
        </div>
        {verify && (
          <p
            data-testid="verify-result"
            className={cn('text-xs', verify.identical === verify.total ? 'text-green-700' : 'text-red-700')}
          >
            {verify.identical} of {verify.total} sets gave identical pixels across {verify.renders} fresh renders
            {done ? ' and the run above' : ''}.
          </p>
        )}
      </section>

      {results.length > 0 && (
        <section className="grid grid-cols-2 gap-3 p-4" data-testid="run-results">
          {results.map((r) => (
            <article key={r.index} className="overflow-hidden rounded-lg border border-neutral-200" data-testid="run-result">
              <img src={r.url} alt={`Set ${r.index + 1}`} className="block w-full bg-neutral-100" />
              <div className="space-y-1.5 p-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">Set {r.index + 1}</span>
                  <a href={r.url} download={r.fileName} className="text-blue-700 hover:underline">
                    PNG
                  </a>
                </div>
                <code className="block truncate font-mono text-[11px] text-neutral-500" data-hash={r.hash} title={r.hash}>
                  {r.hash.slice(0, 16)}
                </code>
                <WarningBadges warnings={r.warnings} preset={preset} />
              </div>
            </article>
          ))}
        </section>
      )}
    </Drawer>
  );
}
