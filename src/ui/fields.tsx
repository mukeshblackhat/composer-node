import { useEffect, useState, type ReactNode } from 'react';
import { cn } from './cn';

const inputClass =
  'h-8 w-full min-w-0 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-1', className)}>
      <span className="text-[11px] font-medium text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-b border-neutral-100 px-4 py-4">
      <h3 className="text-xs font-semibold tracking-wide text-neutral-900 uppercase">{title}</h3>
      {children}
    </section>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  onChange(value: number): void;
  step?: number;
  min?: number;
  max?: number;
  /** Decimal places kept. 0 means whole numbers. */
  precision?: number;
  testId?: string;
};

/**
 * A number input that lets you type freely ("1." on the way to "1.2") and
 * only reports values that are real numbers, clamped and rounded.
 */
export function NumberField({ label, value, onChange, step = 1, min, max, precision = 0, testId }: NumberFieldProps) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    if (Number(text) !== value) setText(String(value));
    // Only outside changes of the value matter here, not every keystroke.
  }, [value]);

  const report = (raw: string) => {
    setText(raw);
    if (raw.trim() === '') return;
    let n = Number(raw);
    if (!Number.isFinite(n)) return;
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    const factor = 10 ** precision;
    n = Math.round(n * factor) / factor;
    if (n !== value) onChange(n);
  };

  return (
    <Field label={label}>
      <input
        type="number"
        className={cn(inputClass, 'tabular-nums')}
        value={text}
        step={step}
        min={min}
        max={max}
        data-testid={testId}
        onChange={(e) => report(e.target.value)}
        onBlur={() => setText(String(value))}
      />
    </Field>
  );
}

export function TextField({
  label,
  value,
  onChange,
  onBlur,
  error,
  testId,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  onBlur?(): void;
  error?: string | null;
  testId?: string;
}) {
  return (
    <Field label={label}>
      <input
        className={cn(inputClass, error && 'border-red-400')}
        value={value}
        data-testid={testId}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </Field>
  );
}

export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  testId,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange(value: T): void;
  testId?: string;
}) {
  return (
    <Field label={label}>
      <select
        className={inputClass}
        value={String(value)}
        data-testid={testId}
        onChange={(e) => {
          const picked = options.find((o) => String(o.value) === e.target.value);
          if (picked) onChange(picked.value);
        }}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange(value: string): void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const valid = /^#[0-9a-fA-F]{6}$/.test(text);

  return (
    <Field label={label}>
      <div className="flex gap-1.5">
        <input
          type="color"
          className="h-8 w-9 shrink-0 cursor-pointer rounded-md border border-neutral-200 bg-white p-0.5"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          className={cn(inputClass, 'font-mono text-xs', !valid && 'border-red-400')}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value.toLowerCase());
          }}
          onBlur={() => setText(value)}
        />
      </div>
    </Field>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange(value: T): void;
}) {
  return (
    <Field label={label}>
      <div className="flex h-8 rounded-md border border-neutral-200 bg-neutral-50 p-0.5" role="radiogroup">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            aria-label={o.label}
            title={o.label}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 rounded text-xs',
              o.value === value ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800',
            )}
          >
            {o.icon ?? o.label}
          </button>
        ))}
      </div>
    </Field>
  );
}
