import Papa from 'papaparse';
import type { InputSet } from '../../engine';

/**
 * Read a CSV with a header row into input sets. Column names are trimmed;
 * cell values are kept exactly as written.
 */
export function parseCsv(text: string): { rows: InputSet[]; columns: string[] } {
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });
  const columns = (parsed.meta.fields ?? []).filter(Boolean);
  if (columns.length === 0) throw new Error('The CSV needs a header row.');

  const rows = parsed.data.map((record) => {
    const row: InputSet = {};
    for (const column of columns) {
      const value = record[column];
      if (value !== undefined && value !== null && value !== '') row[column] = String(value);
    }
    return row;
  });
  return { rows, columns };
}
