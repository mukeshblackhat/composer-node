import { validatePreset, type Preset } from '../engine';
import heroSquare from './hero-square.json';
import storyPortrait from './story-portrait.json';

/**
 * Presets that ship with the app. They are plain JSON files in this folder
 * and pass the same check as an imported preset.
 */
export const seedPresets: Preset[] = [heroSquare, storyPortrait].map(validatePreset);
