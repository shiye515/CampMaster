import { useEffect, useRef } from 'react';
import maplibregl, { Map, Popup, GeoJSONSource } from 'maplibre-gl';
import { usePoiStore } from '../store/usePoiStore';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright';
const ACTIVE_POI_RADIUS = 16; // 选中POI的圆点大小
const DEFAULT_POI_RADIUS = 8;  // 默认POI的圆点大小
const ACTIVE_POI_COLOR = '#ff6b00'; // 选中POI的颜色（深橙色）
const DEFAULT_POI_COLOR = '#ff0000'; // 默认POI的颜色（红色）

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const popupRef = useRef<Popup | null>(null);

  const filteredFeatures = usePoiStore((s) => s.filteredFeatures);
  const activePoi = usePoiStore((s) => s.activePoi);
  const setActivePoi = usePoiStore((s) => s.setActivePoi);

  // 初始化地图
  useEffect(() => {
    if (!mapContainer.current) return;

    (window as any).__mapDebug = {
      initStarted: true,
      features: []
    };

    map.current = new Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [120.15, 30.27], // 杭州坐标
      zoom: 9,
      attributionControl: false,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    
    // 等待样式加载后再添加source和layer
    const onStyleLoad = () => {
      (window as any).__mapDebug.styleLoadTriggered = true;

      // 添加 POI 数据源（禁用聚类，全zoom级别都显示单个点）
      try {
        const existingSource = map.current!.getSource('pois');
        if (!existingSource) {
          map.current!.addSource('pois', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
            cluster: false,
          });
          (window as any).__mapDebug.sourceAdded = true;
        } else {
          (window as any).__mapDebug.sourceExists = true;
        }
      } catch (e) {
        (window as any).__mapDebug.sourceError = String(e);
      }

      // 单个 POI 点（禁用聚类后的图层）
      try {
        const existingLayer = map.current!.getLayer('poi-points');
        if (!existingLayer) {
          map.current!.addLayer({
            id: 'poi-points',
            type: 'circle',
            source: 'pois',
            paint: {
              // 基于 feature-state 动态设置颜色和大小
              'circle-color': [
                'case',
                ['feature-state', 'active'],
                ACTIVE_POI_COLOR,  // 选中时：深橙色
                DEFAULT_POI_COLOR  // 默认：红色
              ],
              'circle-radius': [
                'case',
                ['feature-state', 'active'],
                ACTIVE_POI_RADIUS,   // 选中时：16px
                DEFAULT_POI_RADIUS   // 默认：8px
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 1.0,  // 完全不透明
            },
          });
          (window as any).__mapDebug.layerAdded = true;
        } else {
          (window as any).__mapDebug.layerExists = true;
        }
      } catch (e) {
        (window as any).__mapDebug.layerError = String(e);
      }
    };

    // 如果样式已加载，立即调用；否则等待style.load
    if (map.current.isStyleLoaded()) {
      onStyleLoad();
    } else {
      map.current.on('style.load', onStyleLoad);
    }

    // 点击单个 POI
    map.current.on('click', 'poi-points', (e: any) => {
      const feature = e.features[0];
      const id = feature.properties.id;
      setActivePoi(id);

      if (popupRef.current) popupRef.current.remove();

      popupRef.current = new Popup()
        .setLngLat(feature.geometry.coordinates)
        .setHTML(createPopupHTML(feature.properties))
        .addTo(map.current!);

      map.current!.flyTo({
        center: feature.geometry.coordinates,
        zoom: 15,
        duration: 500,
      });
    });

    // 鼠标悬停效果
    map.current.on('mouseenter', 'poi-points', () => {
      map.current!.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'poi-points', () => {
      map.current!.getCanvas().style.cursor = '';
    });

    // 记录map加载完成
    map.current.on('load', () => {
      (window as any).__mapDebug.mapLoaded = true;
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // 更新 GeoJSON 数据
  useEffect(() => {
    if (!map.current) return;

    // 等待地图加载完成后更新数据
    const updateData = () => {
      if (!map.current) {
        (window as any).__mapDebug.mapCurrentIsNull = true;
        return;
      }
      
      const source = map.current.getSource('pois') as GeoJSONSource;
      if (source) {
        (window as any).__mapDebug.lastUpdate = {
          featureCount: filteredFeatures.length,
          timestamp: new Date().toISOString(),
          success: true
        };
        source.setData({
          type: 'FeatureCollection',
          features: filteredFeatures,
        });
        (window as any).__mapDebug.dataSet = true;
      } else {
        (window as any).__mapDebug.sourceNotFoundOnUpdate = true;
        (window as any).__mapDebug.sourceCheckFailure = {
          mapExists: !!map.current,
          mapHasSources: !!map.current?.getStyle()?.sources,
          allSources: Object.keys(map.current?.getStyle()?.sources || {})
        };
      }
    };

    if (map.current.isStyleLoaded()) {
      (window as any).__mapDebug.styleAlreadyLoaded = true;
      updateData();
    } else {
      (window as any).__mapDebug.waitingForStyleLoad = true;
      map.current.once('style.load', () => {
        (window as any).__mapDebug.styleLoadComplete = true;
        updateData();
      });
    }
  }, [filteredFeatures]);

  // 高亮激活的 POI 并定位地图
  useEffect(() => {
    if (!map.current) return;

    const updateHighlight = () => {
      if (!map.current) return;
      
      const source = map.current.getSource('pois');
      if (!source) return;

      // 清除之前的状态
      filteredFeatures.forEach((f) => {
        map.current?.setFeatureState(
          { source: 'pois', id: f.properties?.id },
          { active: false }
        );
      });

      // 设置新的活跃状态并飞到选中的 POI
      if (activePoi !== null) {
        map.current.setFeatureState(
          { source: 'pois', id: activePoi },
          { active: true }
        );

        // 找到选中的 POI 特性
        const selectedFeature = filteredFeatures.find(
          (f) => f.properties?.id === activePoi
        );

        // 飞到选中的 POI 坐标
        if (selectedFeature && selectedFeature.geometry.type === 'Point') {
          const [lng, lat] = selectedFeature.geometry.coordinates;
          map.current.flyTo({
            center: [lng, lat],
            zoom: 15,
            duration: 800,
            padding: 100,
          });
        }
      }
    };

    if (map.current.isStyleLoaded()) {
      updateHighlight();
    } else {
      map.current.once('style.load', updateHighlight);
    }
  }, [activePoi, filteredFeatures]);

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

/**
 * 生成 POI 点位的弹窗 HTML
 */
function createPopupHTML(props: any): string {
  const mediaLinksHTML = (props.mediaLinks || [])
    .map(
      (link: any) =>
        `<a href="${link.url}" target="_blank" rel="noopener" class="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded mr-1 hover:bg-blue-600">${link.platform}</a>`
    )
    .join('');

  return `
    <div class="w-64">
      <h3 class="font-bold text-base mb-1">${props.name}</h3>
      <p class="text-xs text-gray-600 mb-2">${props.city}</p>
      <p class="text-sm mb-1"><strong>人均费用:</strong> ¥${props.cost}</p>
      <p class="text-sm mb-2"><strong>下单:</strong> ${props.bookingMethod}</p>
      <div class="text-xs">${mediaLinksHTML}</div>
    </div>
  `;
}
