import { useEffect } from 'react';
import { usePoiStore } from '../store/usePoiStore';
import { Search, MapPin, X } from 'lucide-react';

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
  const searchText = usePoiStore((s) => s.searchText);
  const selectedCity = usePoiStore((s) => s.selectedCity);
  const costRange = usePoiStore((s) => s.costRange);
  const bookingMethods = usePoiStore((s) => s.bookingMethods);
  const citiesList = usePoiStore((s) => s.citiesList);
  const bookingMethodsList = usePoiStore((s) => s.bookingMethodsList);
  const filteredFeatures = usePoiStore((s) => s.filteredFeatures);
  const enableViewportFilter = usePoiStore((s) => s.enableViewportFilter);

  const setSearchText = usePoiStore((s) => s.setSearchText);
  const setSelectedCity = usePoiStore((s) => s.setSelectedCity);
  const setCostRange = usePoiStore((s) => s.setCostRange);
  const toggleBookingMethod = usePoiStore((s) => s.toggleBookingMethod);
  const setEnableViewportFilter = usePoiStore((s) => s.setEnableViewportFilter);
  const clearFilters = usePoiStore((s) => s.clearFilters);

  // 当任何过滤条件变化时，触发应用过滤
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onApplyFilters();
    }, 150);

    return () => clearTimeout(debounceTimer);
  }, [searchText, selectedCity, costRange, bookingMethods, enableViewportFilter, onApplyFilters]);

  return (
    <div className="bg-white border-b border-gray-200 p-4 space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="搜索营地名称、城市、下单方式..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 城市选择 */}
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-2">
          城市
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCity(null)}
            className={`px-3 py-1 rounded-full text-sm transition ${
              selectedCity === null
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部城市
          </button>
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

      {/* 下单方式 */}
      {bookingMethodsList.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-2">
            下单方式
          </label>
          <div className="flex flex-wrap gap-2">
            {bookingMethodsList.slice(0, 4).map((method) => (
              <button
                key={method}
                onClick={() => toggleBookingMethod(method)}
                className={`px-3 py-1 rounded text-sm transition truncate ${
                  bookingMethods.includes(method)
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 视口过滤开关 */}
      <div className="flex items-center gap-3 p-2 bg-blue-50 rounded border border-blue-200">
        <input
          type="checkbox"
          id="viewport-filter"
          checked={enableViewportFilter}
          onChange={(e) => setEnableViewportFilter(e.target.checked)}
          className="w-4 h-4 text-blue-600 cursor-pointer"
        />
        <label htmlFor="viewport-filter" className="text-sm text-gray-700 cursor-pointer flex items-center gap-2">
          <MapPin size={16} />
          仅显示当前地图范围内的结果
        </label>
      </div>

      {/* 结果统计与清除 */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          找到 <span className="font-bold text-blue-600">{filteredFeatures.length}</span> 个结果
        </p>
        {(searchText || selectedCity || bookingMethods.length > 0 || enableViewportFilter) && (
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
