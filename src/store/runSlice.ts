import type { InputSet, Warning } from '../engine';
import type { SliceCreator } from './types';

export type RunResult = {
  index: number;
  fileName: string;
  /** Object URL of the PNG. */
  url: string;
  hash: string;
  warnings: Warning[];
};

export type VerifyResult = { identical: number; total: number; renders: number };

export type RunSlice = {
  /** Input sets for a batch run, one per CSV row. */
  rows: InputSet[];
  rowsSource: string;
  results: RunResult[];
  /** Id of the preset the results were made with. */
  resultsPresetId: string | null;
  running: boolean;
  progress: number;
  verify: VerifyResult | null;
  setRows(rows: InputSet[], source: string): void;
  startRun(): void;
  addResult(result: RunResult): void;
  finishRun(presetId: string): void;
  setVerify(verify: VerifyResult | null): void;
};

export const createRunSlice: SliceCreator<RunSlice> = (set, get) => {
  const releaseUrls = () => get().results.forEach((r) => URL.revokeObjectURL(r.url));

  return {
    rows: [],
    rowsSource: '',
    results: [],
    resultsPresetId: null,
    running: false,
    progress: 0,
    verify: null,

    setRows: (rows, source) => {
      releaseUrls();
      set({ rows, rowsSource: source, results: [], verify: null });
    },

    startRun: () => {
      releaseUrls();
      set({ running: true, progress: 0, results: [], verify: null });
    },

    addResult: (result) => set({ results: [...get().results, result], progress: get().results.length + 1 }),
    finishRun: (presetId) => set({ running: false, resultsPresetId: presetId }),
    setVerify: (verify) => set({ verify }),
  };
};
