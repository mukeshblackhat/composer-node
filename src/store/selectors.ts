import { useShallow } from 'zustand/react/shallow';
import type { InputSet } from '../engine';
import { resolveInputs } from './graphOps';
import { useStore } from './index';

/**
 * The input set wired into the Composer. Shallow comparison keeps the same
 * object while only node positions change, so dragging a node on the canvas
 * does not re-render the output.
 */
export function useGraphInputs(): InputSet {
  return useStore(useShallow((s) => resolveInputs(s.nodes, s.edges)));
}

/** The inputs the editor preview and its export use. */
export function useEditorInputs(): InputSet {
  const graph = useGraphInputs();
  const row = useStore((s) => (typeof s.inputSource === 'number' ? s.rows[s.inputSource] : undefined));
  return row ?? graph;
}
