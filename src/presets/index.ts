import type { Preset } from '../engine';
import heroSquare from './hero-square.json';

/** Presets that ship with the app. They are plain JSON files in this folder. */
export const seedPresets: Preset[] = [heroSquare as Preset];
