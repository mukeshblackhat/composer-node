import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Button } from './Button';

/** A panel that slides over the right side of the screen. */
export function Drawer({
  title,
  onClose,
  children,
  width = 'w-[440px]',
  testId,
}: {
  title: string;
  onClose(): void;
  children: ReactNode;
  width?: string;
  testId?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <aside
      data-testid={testId}
      className={`fixed top-0 right-0 bottom-0 z-40 flex ${width} max-w-full flex-col border-l border-neutral-200 bg-white shadow-xl`}
    >
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-neutral-200 px-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Button variant="ghost" size="sm" onClick={onClose} icon={<X size={16} />} aria-label="Close" />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </aside>
  );
}
