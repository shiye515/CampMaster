import { useEffect, useState } from 'react';
import { usePoiStore } from './store/usePoiStore';
import { loadCitiesList, loadCityData, sanitizePoiData } from './utils/fgbLoader';
import { MapView } from './components/MapView';
import { PoiList } from './components/PoiList';
import { FilterBar } from './components/FilterBar';
import { Menu, X } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const loadCitiesList_ = usePoiStore((s) => s.loadCitiesList);
  const loadCityFeatures = usePoiStore((s) => s.loadCityFeatures);
  const applyFilters = usePoiStore((s) => s.applyFilters);
  const selectedCity = usePoiStore((s) => s.selectedCity);
  const isLoadingCityData = usePoiStore((s) => s.isLoadingCityData);

  // 初始化加载城市列表
  useEffect(() => {
    async function initializeCities() {
      setLoading(true);
      try {
        const cities = await loadCitiesList();
        console.log('✅ Cities loaded:', cities);
        loadCitiesList_(cities);
      } catch (error) {
        console.error('Failed to load cities list:', error);
      } finally {
        setLoading(false);
      }
    }

    initializeCities();
  }, [loadCitiesList_]);

  // 监听城市选择变化，加载对应城市的数据
  useEffect(() => {
    if (!selectedCity || !isLoadingCityData) return;

    async function loadCityPoiData() {
      try {
        if (!selectedCity) return;
        console.log(`Loading data for city: ${selectedCity}`);
        const data = await loadCityData(selectedCity);
        const sanitized = sanitizePoiData(data);
        console.log(`✅ Loaded ${sanitized.features.length} POIs for ${selectedCity}`);
        
        loadCityFeatures(sanitized);
        applyFilters();
      } catch (error) {
        console.error(`Failed to load data for ${selectedCity}:`, error);
      }
    }

    loadCityPoiData();
  }, [selectedCity, isLoadingCityData, loadCityFeatures, applyFilters]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">加载城市列表中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col md:flex-row bg-gray-50 overflow-hidden">
      {/* 移动端顶部栏 */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-lg text-gray-900">POI 地图</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 左侧侧边栏 - 筛选与列表 */}
      <div
        className={`${
          sidebarOpen ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-96 bg-white border-r border-gray-200 overflow-hidden`}
      >
        {/* 筛选栏 */}
        <div className="overflow-y-auto flex-shrink-0 border-b border-gray-200">
          <FilterBar onApplyFilters={() => applyFilters()} />
        </div>

        {/* POI 列表 */}
        <div className="flex-1 overflow-hidden">
          {isLoadingCityData ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">加载数据中...</p>
              </div>
            </div>
          ) : (
            <PoiList />
          )}
        </div>
      </div>

      {/* 右侧地图 */}
      <div className="flex-1 w-full overflow-hidden" style={{ height: '100%', minHeight: '0' }}>
        <MapView />
      </div>
    </div>
  );
}

export default App;
