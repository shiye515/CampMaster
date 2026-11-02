import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePoiStore } from '../store/usePoiStore';
import { PoiCard } from './PoiCard';
import { Inbox } from 'lucide-react';

export function PoiList() {
  const filteredFeatures = usePoiStore((s) => s.filteredFeatures);
  const activePoi = usePoiStore((s) => s.activePoi);
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredFeatures.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 10,
  });

  // 当激活的 POI 变化时，自动滚动到该卡片
  useEffect(() => {
    if (activePoi !== null) {
      const index = filteredFeatures.findIndex((f) => f.properties.id === activePoi);
      if (index !== -1) {
        virtualizer.scrollToIndex(index, { align: 'center' });
      }
    }
  }, [activePoi, filteredFeatures, virtualizer]);

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div ref={parentRef} className="w-full h-full overflow-y-auto bg-gray-50">
      {filteredFeatures.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <Inbox size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 text-sm">
            没有找到符合条件的结果，请调整筛选条件
          </p>
        </div>
      ) : (
        <div
          style={{
            height: `${totalSize}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const feature = filteredFeatures[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                  padding: '8px',
                  boxSizing: 'border-box',
                }}
              >
                <PoiCard
                  feature={feature}
                  isActive={feature.properties.id === activePoi}
                  onClick={(id) => usePoiStore.setState({ activePoi: id })}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
