import type { Frame, Layer, RenderEnv, SlotType, WarningCode } from '../types';

export type LayoutResult<Resolved> = {
  /** Numbers ready to paint, or null when there is nothing to draw. */
  resolved: Resolved | null;
  /** The box the content really covers. The editor overlay can show it. */
  contentBox: Frame | null;
  warnings: WarningCode[];
};

/**
 * One kind of layer. `layout` works out numbers and needs no canvas, so it
 * can be unit tested. `paint` only draws what `layout` decided.
 */
export type LayerType<L extends Layer = Layer, Resolved = unknown> = {
  type: L['type'];
  /** The kind of slot this layer reads from. */
  slotType: SlotType;
  /** Property values for a new layer of this type. */
  defaults(base: { id: string; slot: string; frame: Frame }): L;
  layout(layer: L, input: string | undefined, env: RenderEnv): LayoutResult<Resolved>;
  paint(ctx: CanvasRenderingContext2D, layer: L, resolved: Resolved, env: RenderEnv): void;
};
