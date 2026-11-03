import type { PoiFeatureCollection, PoiFeature } from '../types/poi';

/**
 * 从相对路径异步加载 FlatGeobuf 或 GeoJSON 数据
 * @param dataPath 相对路径，如 './data/pois.fgb' 或 './data/pois.geojson'
 * @returns FeatureCollection
 */
export async function loadPoiData(dataPath: string): Promise<PoiFeatureCollection> {
  const response = await fetch(dataPath);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  if (dataPath.endsWith('.fgb')) {
    return await loadFlatGeobuf(response);
  } else if (dataPath.endsWith('.geojson') || dataPath.endsWith('.json')) {
    return await response.json();
  } else {
    throw new Error('Unsupported data format. Use .fgb or .geojson');
  }
}

/**
 * 解析 FlatGeobuf 流式数据
 */
async function loadFlatGeobuf(response: Response): Promise<PoiFeatureCollection> {
  try {
    // 动态导入 flatgeobuf
    const flatgeobuf = await import('flatgeobuf');
    const buffer = await response.arrayBuffer();
    const features: PoiFeature[] = [];

    // 使用 flatgeobuf.geojson.deserialize 流式解析
    for await (const feature of flatgeobuf.geojson.deserialize(new Uint8Array(buffer))) {
      features.push(feature as PoiFeature);
    }

    return {
      type: 'FeatureCollection',
      features,
    };
  } catch (error) {
    console.warn('FlatGeobuf 解析失败，尝试降级到 GeoJSON:', error);
    throw error;
  }
}

/**
 * 验证 POI 数据的完整性
 */
export function validatePoiFeature(feature: any): feature is PoiFeature {
  if (feature.type !== 'Feature') return false;
  if (feature.geometry?.type !== 'Point') return false;
  if (!Array.isArray(feature.geometry.coordinates)) return false;
  if (!feature.properties?.id || !feature.properties?.name) return false;
  return true;
}

/**
 * 过滤和验证所有 POI 数据
 */
export function sanitizePoiData(data: PoiFeatureCollection): PoiFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: data.features.filter(validatePoiFeature),
  };
}
