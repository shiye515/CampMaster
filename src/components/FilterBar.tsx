import { useEffect } from 'react';
import { usePoiStore } from '../store/usePoiStore';
import { X } from 'lucide-react';

const COST_PRESETS = [
  { label: '全部', min: 0, max: 10000 },
  { label: '免费 (0元)', min: 0, max: 0 },
  { label: '100元以内', min: 0, max: 100 },
  { label: '100-300元', min: 100, max: 300 },
  { label: '300元以上', min: 300, max: 10000 },
];

interface FilterBarProps {
  onApplyFilters: () => void;
}

export function FilterBar({ onApplyFilters }: FilterBarProps) {
  const selectedCity = usePoiStore((s) => s.selectedCity);
  const costRange = usePoiStore((s) => s.costRange);
  const citiesList = usePoiStore((s) => s.citiesList);
  const filteredFeatures = usePoiStore((s) => s.filteredFeatures);

  const setSelectedCity = usePoiStore((s) => s.setSelectedCity);
  const setCostRange = usePoiStore((s) => s.setCostRange);
  const clearFilters = usePoiStore((s) => s.clearFilters);

  // 当任何过滤条件变化时，触发应用过滤
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onApplyFilters();
    }, 150);

    return () => clearTimeout(debounceTimer);
  }, [selectedCity, costRange, onApplyFilters]);

  return (
    <div className="bg-white border-b border-gray-200 p-4 space-y-4">
      {/* 城市选择 */}
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-2">
          城市
        </label>
        <div className="flex flex-wrap gap-2">
          {citiesList.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city === selectedCity ? null : city)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                selectedCity === city
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* 费用范围 */}
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-2">
          人均费用
        </label>
        <div className="flex flex-wrap gap-2">
          {COST_PRESETS.map((preset) => {
            const isActive =
              costRange[0] === preset.min && costRange[1] === preset.max;
            return (
              <button
                key={preset.label}
                onClick={() => setCostRange([preset.min, preset.max])}
                className={`px-3 py-1 rounded text-sm transition ${
                  isActive
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 结果统计与清除 */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          找到 <span className="font-bold text-blue-600">{filteredFeatures.length}</span> 个结果
        </p>
        {(selectedCity) && (
          <button
            onClick={() => clearFilters()}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
          >
            <X size={14} />
            清除筛选
          </button>
        )}
      </div>
    </div>
  );
}
