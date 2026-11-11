import { makeEdge } from './graphOps';
import { COMPOSER_ID, OUTPUT_ID, type AppEdge, type AppNode } from './graphTypes';

/** The graph a new visitor sees: four inputs wired into the Composer, then the Output. */
export function initialGraph(): { nodes: AppNode[]; edges: AppEdge[] } {
  const nodes: AppNode[] = [
    { id: 'in-backdrop', type: 'imageInput', position: { x: 0, y: 0 }, data: { label: 'Backdrop', assetId: 'backdrop-warm' } },
    { id: 'in-product', type: 'imageInput', position: { x: 0, y: 210 }, data: { label: 'Product', assetId: 'product-bottle' } },
    { id: 'in-title', type: 'textInput', position: { x: 0, y: 420 }, data: { label: 'Title', text: 'Slow mornings' } },
    { id: 'in-tagline', type: 'textInput', position: { x: 0, y: 560 }, data: { label: 'Tagline', text: 'Daily oat cleanser' } },
    { id: COMPOSER_ID, type: 'composer', position: { x: 300, y: 130 }, data: {}, deletable: false },
    { id: OUTPUT_ID, type: 'outputImage', position: { x: 660, y: 150 }, data: {}, deletable: false },
  ];
  const edges: AppEdge[] = [
    makeEdge('in-backdrop', COMPOSER_ID, 'backdrop', 'image'),
    makeEdge('in-product', COMPOSER_ID, 'product', 'image'),
    makeEdge('in-title', COMPOSER_ID, 'title', 'text'),
    makeEdge('in-tagline', COMPOSER_ID, 'tagline', 'text'),
    makeEdge(COMPOSER_ID, OUTPUT_ID, null, 'output'),
  ];
  return { nodes, edges };
}
