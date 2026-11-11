// The artboard sizes the editor offers. To add one, add a line here.

export type ArtboardSize = { label: string; width: number; height: number };

export const artboardSizes: ArtboardSize[] = [
  { label: 'Square 1:1', width: 1080, height: 1080 },
  { label: 'Portrait 4:5', width: 1080, height: 1350 },
  { label: 'Portrait 3:4', width: 1080, height: 1440 },
  { label: 'Tall 2:3', width: 1000, height: 1500 },
  { label: 'Story 9:16', width: 1080, height: 1920 },
  { label: 'Landscape 4:3', width: 1600, height: 1200 },
  { label: 'Wide 16:9', width: 1920, height: 1080 },
  { label: 'Link preview 1.91:1', width: 1200, height: 628 },
  { label: 'Banner 3:1', width: 1500, height: 500 },
];

/** One string per size, for a select's value. */
export const sizeKey = (size: { width: number; height: number }) => `${size.width}x${size.height}`;
