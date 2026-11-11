import type { ReactNode } from 'react';

/** The small caption above a node card, as in the Onto canvas. */
export function NodeLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return <div className="mb-1.5 flex h-5 items-center gap-1.5 px-0.5 text-xs text-neutral-500">{icon}{children}</div>;
}

export const handleStyle = (colour: string) => ({
  width: 10,
  height: 10,
  background: 'white',
  border: `2px solid ${colour}`,
});

export const IMAGE_BLUE = '#3b82f6';
export const TEXT_ORANGE = '#f97316';
