/**
 * 高德地图 API 集成
 * 用于获取经纬度对应的真实地名信息
 */

// 高德地图 API Key (需要配置，这里使用公开示例)
const AMAP_KEY = 'YOUR_AMAP_KEY';

// 高德逆地址解析 API
// 注：实际使用需要自己的API Key，这里提供接口定义
const AMAP_GEOCODE_REVERSE = 'https://restapi.amap.com/v3/geocode/regeo';

export interface GeocodingResult {
  address: string;
  addressComponent?: {
    province?: string;
    city?: string;
    district?: string;
    township?: string;
  };
  pois?: Array<{
    name: string;
    type: string;
    location: string;
  }>;
}

/**
 * 根据经纬度获取地名信息
 * @param lng 经度
 * @param lat 纬度
 * @returns 地名信息
 */
export async function getLocationName(
  lng: number,
  lat: number,
  apiKey?: string
): Promise<string | null> {
  try {
    const key = apiKey || AMAP_KEY;
    
    if (!key || key === 'YOUR_AMAP_KEY') {
      // 如果没有配置API Key，使用本地逆向地理编码的备选方案
      return generateLocationNameFromCoordinates(lng, lat);
    }

    const response = await fetch(
      `${AMAP_GEOCODE_REVERSE}?location=${lng},${lat}&key=${key}&radius=1000&extensions=all`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn('高德 API 请求失败', response.status);
      return generateLocationNameFromCoordinates(lng, lat);
    }

    const data = (await response.json()) as any;

    if (data.status !== '1') {
      console.warn('高德 API 返回错误', data.info);
      return generateLocationNameFromCoordinates(lng, lat);
    }

    // 优先级：POI名称 > 街道地址 > 地区名称
    if (data.regeocode?.pois && data.regeocode.pois.length > 0) {
      const poi = data.regeocode.pois[0];
      return poi.name || poi.type;
    }

    if (data.regeocode?.formatted_address) {
      return data.regeocode.formatted_address;
    }

    // 备用：组装地名
    const component = data.regeocode?.addressComponent;
    if (component) {
      const parts = [
        component.district || component.city,
        component.township,
      ].filter(Boolean);
      return parts.join('·') || null;
    }

    return null;
  } catch (error) {
    console.error('获取地名失败:', error);
    return generateLocationNameFromCoordinates(lng, lat);
  }
}

/**
 * 本地生成地名（备选方案，不需要API Key）
 * 基于经纬度进行粗略的地区判断
 */
function generateLocationNameFromCoordinates(lng: number, lat: number): string {
  // 浙江省各城市的大致坐标范围
  const regions: Array<{
    name: string;
    lngRange: [number, number];
    latRange: [number, number];
  }> = [
    {
      name: '杭州市',
      lngRange: [119.8, 120.6],
      latRange: [29.8, 30.5],
    },
    {
      name: '宁波市',
      lngRange: [120.8, 121.8],
      latRange: [29.4, 30.2],
    },
    {
      name: '温州市',
      lngRange: [120.4, 121.3],
      latRange: [27.8, 28.6],
    },
    {
      name: '嘉兴市',
      lngRange: [120.4, 121.2],
      latRange: [30.4, 30.9],
    },
    {
      name: '湖州市',
      lngRange: [119.8, 120.6],
      latRange: [30.7, 31.3],
    },
    {
      name: '绍兴市',
      lngRange: [120.4, 121.3],
      latRange: [29.8, 30.5],
    },
    {
      name: '金华市',
      lngRange: [119.2, 120.3],
      latRange: [28.9, 29.9],
    },
    {
      name: '衢州市',
      lngRange: [118.4, 119.3],
      latRange: [28.8, 29.4],
    },
    {
      name: '舟山市',
      lngRange: [121.8, 122.8],
      latRange: [29.8, 30.5],
    },
    {
      name: '台州市',
      lngRange: [121.0, 122.0],
      latRange: [28.6, 29.3],
    },
    {
      name: '丽水市',
      lngRange: [119.4, 120.6],
      latRange: [28.2, 28.9],
    },
  ];

  // 查找坐标所在的地区
  for (const region of regions) {
    if (
      lng >= region.lngRange[0] &&
      lng <= region.lngRange[1] &&
      lat >= region.latRange[0] &&
      lat <= region.latRange[1]
    ) {
      return region.name;
    }
  }

  // 如果不在已知范围内，返回浙江
  return '浙江省';
}

/**
 * 缓存系统：避免重复请求相同的坐标
 */
const geoCache = new Map<string, string>();

const CACHE_MAX_SIZE = 1000;

export async function getCachedLocationName(
  lng: number,
  lat: number,
  apiKey?: string
): Promise<string | null> {
  const key = `${lng.toFixed(4)},${lat.toFixed(4)}`;

  // 检查缓存
  if (geoCache.has(key)) {
    return geoCache.get(key) || null;
  }

  // 获取新地名
  const name = await getLocationName(lng, lat, apiKey);

  // 存入缓存（限制大小）
  if (name) {
    if (geoCache.size >= CACHE_MAX_SIZE) {
      // 清空旧缓存
      const firstKey = geoCache.keys().next().value as string | undefined;
      if (firstKey) {
        geoCache.delete(firstKey);
      }
    }
    geoCache.set(key, name);
  }

  return name;
}

/**
 * 清空缓存
 */
export function clearGeoCache() {
  geoCache.clear();
}

/**
 * 获取缓存统计
 */
export function getGeoCacheStats() {
  return {
    size: geoCache.size,
    maxSize: CACHE_MAX_SIZE,
  };
}
