import { getImage } from '../../assets/loader';
import { canvasToPng, render, type InputSet, type Preset } from '../../engine';
import { downloadBlob } from '../../ui/download';

/**
 * Export renders again on a fresh canvas with the same function the preview
 * uses. It never copies the preview canvas, so nothing on screen can leak in.
 */
export async function exportPng(preset: Preset, inputs: InputSet, fileName: string): Promise<void> {
  const { canvas } = render(preset, inputs, getImage);
  downloadBlob(await canvasToPng(canvas), fileName);
}
