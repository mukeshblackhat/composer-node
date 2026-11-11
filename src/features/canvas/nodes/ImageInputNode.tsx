import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Image } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { isImageLink } from '../../../assets/links';
import { assetsVersion, loadRemoteImage, remoteInfo, retryRemoteImage, subscribeAssets } from '../../../assets/loader';
import { imageAssets } from '../../../assets/manifest';
import { useStore } from '../../../store';
import type { ImageInputNode as ImageNode } from '../../../store/graphTypes';
import { handleStyle, IMAGE_BLUE, NodeLabel } from './NodeLabel';

/** The picker value that means "an image from a link", not a bundled asset. */
const LINK = '__link__';

export function ImageInputNode({ id, data, selected }: NodeProps<ImageNode>) {
  const updateInputNode = useStore((s) => s.updateInputNode);
  const asset = imageAssets.find((a) => a.id === data.assetId);
  const link = isImageLink(data.assetId) ? data.assetId : null;

  // True from picking "Link…" until a link is entered or an asset is picked.
  const [choosingLink, setChoosingLink] = useState(false);
  const [draft, setDraft] = useState(link ?? '');
  const [draftError, setDraftError] = useState<string | null>(null);

  // Re-read the link's state whenever any link starts or finishes loading.
  useSyncExternalStore(subscribeAssets, assetsVersion);
  const info = link ? remoteInfo(link) : undefined;

  useEffect(() => {
    if (!link) return;
    setDraft(link);
    setDraftError(null);
    void loadRemoteImage(link);
  }, [link]);

  const commitDraft = () => {
    const value = draft.trim();
    if (value === data.assetId) return;
    if (!isImageLink(value)) {
      setDraftError(value ? 'Use a link that starts with http:// or https://' : null);
      return;
    }
    setDraftError(null);
    setChoosingLink(false);
    updateInputNode(id, { assetId: value });
  };

  return (
    <div className="w-44" data-testid={`node-${id}`}>
      <NodeLabel icon={<Image size={12} />}>
        <input
          className="nodrag min-w-0 flex-1 bg-transparent outline-none focus:text-neutral-900"
          value={data.label}
          aria-label="Input name"
          onChange={(e) => updateInputNode(id, { label: e.target.value })}
        />
      </NodeLabel>
      <div className={`rounded-xl border bg-white p-2 shadow-sm ${selected ? 'border-blue-500' : 'border-neutral-200'}`}>
        <div className="checker flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg" data-testid="image-thumb">
          {asset ? (
            <img src={asset.url} alt={asset.label} className="h-full w-full object-contain" draggable={false} />
          ) : !link ? (
            <span className="px-1 text-center text-xs text-red-600">Missing: {data.assetId}</span>
          ) : info?.status === 'ready' ? (
            <img src={link} alt="Linked image" className="h-full w-full object-contain" draggable={false} />
          ) : info?.status === 'failed' ? (
            <span className="flex flex-col items-center gap-1 px-1 text-center text-[11px] leading-tight text-red-600" data-testid="link-error">
              {info.reason}
              <button type="button" className="nodrag font-medium underline" onClick={() => void retryRemoteImage(link)}>
                Try again
              </button>
            </span>
          ) : (
            <span className="text-xs text-neutral-500">Loading…</span>
          )}
        </div>
        <select
          className="nodrag mt-2 h-7 w-full rounded-md border border-neutral-200 bg-white px-1.5 text-xs"
          value={link || choosingLink ? LINK : data.assetId}
          aria-label="Image"
          onChange={(e) => {
            if (e.target.value === LINK) {
              setChoosingLink(true);
              return;
            }
            setChoosingLink(false);
            setDraft('');
            setDraftError(null);
            updateInputNode(id, { assetId: e.target.value });
          }}
        >
          {imageAssets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.kind === 'backdrop' ? 'Backdrop' : 'Product'}: {a.label}
            </option>
          ))}
          <option value={LINK}>Link…</option>
        </select>
        {(link || choosingLink) && (
          <>
            <input
              className={`nodrag mt-1.5 h-7 w-full rounded-md border bg-white px-1.5 text-xs outline-none focus:border-blue-500 ${
                draftError ? 'border-red-400' : 'border-neutral-200'
              }`}
              value={draft}
              placeholder="https://…"
              aria-label="Image link"
              data-testid="image-link"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            />
            {draftError && <p className="mt-1 text-[11px] leading-tight text-red-600">{draftError}</p>}
          </>
        )}
      </div>
      <Handle type="source" position={Position.Right} id="out" style={{ ...handleStyle(IMAGE_BLUE), top: 'auto', bottom: 52 }} />
    </div>
  );
}
