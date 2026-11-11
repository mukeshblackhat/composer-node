import { useEffect, useState } from 'react';
import { loadAssets } from '../../assets/loader';
import { inputSetsUrl } from '../../assets/manifest';
import { useStore } from '../../store';
import { parseCsv } from '../runs/csv';

export type BootStatus = 'loading' | 'ready' | { error: string };

/** Load every font and image, and the sample input sets, before showing the app. */
export function useBoot(): BootStatus {
  const [status, setStatus] = useState<BootStatus>('loading');

  useEffect(() => {
    let live = true;
    Promise.all([loadAssets(), fetch(inputSetsUrl).then((r) => r.text())])
      .then(([, csv]) => {
        if (useStore.getState().rows.length === 0) {
          useStore.getState().setRows(parseCsv(csv).rows, 'Sample CSV');
        }
        if (live) setStatus('ready');
      })
      .catch((e: Error) => live && setStatus({ error: e.message }));
    return () => {
      live = false;
    };
  }, []);

  return status;
}
