import { ExternalLink, MapPin, DollarSign, Bookmark } from 'lucide-react';
import type { PoiFeature } from '../types/poi';
import { usePoiStore } from '../store/usePoiStore';

interface PoiCardProps {
  feature: PoiFeature;
  isActive: boolean;
  onHover?: (id: string | number | null) => void;
  onClick?: (id: string | number) => void;
}

const PLATFORM_COLORS: Record<string, { bg: string; text: string }> = {
  '小红书': { bg: 'bg-red-50', text: 'text-red-700' },
  '抖音': { bg: 'bg-black', text: 'text-white' },
  '大众点评': { bg: 'bg-green-50', text: 'text-green-700' },
  '其他': { bg: 'bg-gray-50', text: 'text-gray-700' },
};

export function PoiCard({ feature, isActive, onHover, onClick }: PoiCardProps) {
  const { properties } = feature;
  const [lng, lat] = feature.geometry.coordinates;

  const handleCardClick = () => {
    onClick?.(properties.id);
    usePoiStore.setState({ activePoi: properties.id });
  };

  return (
    <div
      onMouseEnter={() => onHover?.(properties.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={handleCardClick}
      className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all ${
        isActive
          ? 'border-orange-500 bg-orange-50 shadow-md'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
    >
      {/* 标题与城市 */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-gray-900 truncate">
            {properties.name}
          </h3>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <MapPin size={12} />
            {properties.city}
          </p>
        </div>
        <div className="text-xs text-gray-400 whitespace-nowrap">
          {lng.toFixed(2)}, {lat.toFixed(2)}
        </div>
      </div>

      {/* 费用与下单方式 */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-1">
          <DollarSign size={14} className="text-green-600" />
          <span className="text-sm font-semibold text-green-700">
            {properties.cost === 0 ? '免费' : `¥${properties.cost}`}
          </span>
        </div>
        <div className="flex-1 text-right">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded truncate">
            {properties.bookingMethod}
          </span>
        </div>
      </div>

      {/* 媒体链接 */}
      {properties.mediaLinks && properties.mediaLinks.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-600">推荐资源</p>
          <div className="flex flex-wrap gap-2">
            {properties.mediaLinks.map((link, idx) => {
              const colors = PLATFORM_COLORS[link.platform] || PLATFORM_COLORS['其他'];
              return (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 ${colors.bg} ${colors.text} text-xs px-2 py-1 rounded hover:opacity-80 transition truncate`}
                  title={link.title}
                >
                  <Bookmark size={12} />
                  <span className="truncate">{link.title}</span>
                  <ExternalLink size={10} />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
