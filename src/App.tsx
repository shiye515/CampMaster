import { useEffect, useState } from 'react';
import { usePoiStore } from './store/usePoiStore';
import { loadPoiData, sanitizePoiData } from './utils/fgbLoader';
import { MapView } from './components/MapView';
import { PoiList } from './components/PoiList';
import { FilterBar } from './components/FilterBar';
import { Menu, X } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const loadFeatures = usePoiStore((s) => s.loadFeatures);
  const applyFilters = usePoiStore((s) => s.applyFilters);

  // 初始化加载数据
  useEffect(() => {
    async function initializeData() {
      setLoading(true);
      try {
        // 尝试先加载 FlatGeobuf，失败则回退到 GeoJSON
        let data = await loadPoiData('./data/pois.fgb').catch(() =>
          loadPoiData('./data/pois.geojson')
        );

        // 验证和清理数据
        data = sanitizePoiData(data);

        if (data.features.length === 0) {
          console.warn('No valid POI features loaded');
        }

        // 加载到存储
        loadFeatures(data);

        // 应用初始过滤
        applyFilters();
      } catch (error) {
        console.error('Failed to initialize data:', error);
      } finally {
        setLoading(false);
      }
    }

    initializeData();
  }, [loadFeatures, applyFilters]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col md:flex-row bg-gray-50">
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
          <PoiList />
        </div>
      </div>

      {/* 右侧地图 */}
      <div className="flex-1 w-full md:w-auto h-96 md:h-full overflow-hidden">
        <MapView />
      </div>
    </div>
  );
}

export default App;
