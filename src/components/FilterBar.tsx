import { useEffect } from 'react';
import { usePoiStore } from '../store/usePoiStore';

const COST_PRESETS = [
  { label: '全部价格', min: 0, max: 10000 },
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

  // 当任何过滤条件变化时，触发应用过滤
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onApplyFilters();
    }, 150);

    return () => clearTimeout(debounceTimer);
  }, [selectedCity, costRange, onApplyFilters]);

  return (
    <div className="bg-white border-b border-gray-200 p-4 space-y-4">
      {/* 城市选择 - 下拉框 */}
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-2">
          城市
        </label>
        <select
          value={selectedCity || ''}
          onChange={(e) => setSelectedCity(e.target.value || selectedCity)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          {citiesList.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* 费用范围 - 下拉框 */}
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-2">
          人均费用
        </label>
        <select
          value={`${costRange[0]}-${costRange[1]}`}
          onChange={(e) => {
            const [minStr, maxStr] = e.target.value.split('-');
            setCostRange([parseInt(minStr), parseInt(maxStr)]);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        >
          {COST_PRESETS.map((preset) => (
            <option key={preset.label} value={`${preset.min}-${preset.max}`}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      {/* 结果统计 */}
      <div className="pt-2 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          找到 <span className="font-bold text-blue-600">{filteredFeatures.length}</span> 个结果
        </p>
      </div>
    </div>
  );
}
