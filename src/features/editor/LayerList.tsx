import { ChevronDown, ChevronUp, Eye, EyeOff, Image, Plus, Type } from 'lucide-react';
import { useStore } from '../../store';
import { Button } from '../../ui/Button';
import { cn } from '../../ui/cn';

/** Layers from top to bottom, as design tools list them. */
export function LayerList() {
  const preset = useStore((s) => s.preset);
  const selectedId = useStore((s) => s.selectedLayerId);
  const selectLayer = useStore((s) => s.selectLayer);
  const moveLayer = useStore((s) => s.moveLayer);
  const updateLayer = useStore((s) => s.updateLayer);
  const addLayer = useStore((s) => s.addLayer);

  const count = preset.layers.length;
  const topFirst = preset.layers.map((layer, index) => ({ layer, index })).reverse();
  const labelOf = (key: string) => preset.slots.find((s) => s.key === key)?.label ?? key;

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <h3 className="px-4 pt-4 pb-2 text-xs font-semibold tracking-wide text-neutral-900 uppercase">Layers</h3>
      <ol className="min-h-0 flex-1 overflow-y-auto px-2" data-testid="layer-list">
        {topFirst.map(({ layer, index }) => {
          const Icon = layer.type === 'image' ? Image : Type;
          const isSelected = layer.id === selectedId;
          return (
            <li
              key={layer.id}
              data-layer-id={layer.id}
              onClick={() => selectLayer(layer.id)}
              className={cn(
                'group flex h-9 cursor-pointer items-center gap-2 rounded-md pr-1 pl-2 text-sm',
                isSelected ? 'bg-blue-50 text-blue-900' : 'text-neutral-700 hover:bg-neutral-50',
              )}
            >
              <Icon size={14} className={isSelected ? 'text-blue-600' : 'text-neutral-400'} />
              <span className={cn('min-w-0 flex-1 truncate', !layer.visible && 'text-neutral-400 line-through')}>
                {labelOf(layer.slot)}
              </span>
              <span className={cn('flex', isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Bring forward"
                  title="Bring forward ( ] )"
                  disabled={index === count - 1}
                  icon={<ChevronUp size={14} />}
                  onClick={(e) => (e.stopPropagation(), moveLayer(layer.id, 1))}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Send backward"
                  title="Send backward ( [ )"
                  disabled={index === 0}
                  icon={<ChevronDown size={14} />}
                  onClick={(e) => (e.stopPropagation(), moveLayer(layer.id, -1))}
                />
              </span>
              <Button
                variant="ghost"
                size="sm"
                aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
                icon={layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                onClick={(e) => (e.stopPropagation(), updateLayer(layer.id, { visible: !layer.visible }))}
              />
            </li>
          );
        })}
      </ol>
      <div className="flex gap-2 border-t border-neutral-100 p-3">
        <Button className="flex-1" size="sm" icon={<Plus size={14} />} onClick={() => selectLayer(addLayer('image'))}>
          Image
        </Button>
        <Button className="flex-1" size="sm" icon={<Plus size={14} />} onClick={() => selectLayer(addLayer('text'))}>
          Text
        </Button>
      </div>
    </aside>
  );
}
