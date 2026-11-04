/**
 * 高德地图逆地址解析集成模块
 * 用于为 POI 数据补充真实的地理信息
 */

import fetch from 'node-fetch';

const AMAP_REGEO_API = 'https://restapi.amap.com/v3/geocode/regeo';
const REQUEST_DELAY = 150; // 毫秒，控制请求速率

/**
 * 根据经纬度获取地理信息
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @param {string} apiKey - 高德地图 API Key
 * @returns {Promise<{address: string, pois: Array}>}
 */
export async function getAddressFromAmap(lng, lat, apiKey) {
  if (!apiKey) {
    console.warn(`⚠️  未配置 Amap API Key，跳过地名解析`);
    return null;
  }

  try {
    const url = `${AMAP_REGEO_API}?location=${lng},${lat}&key=${apiKey}&radius=1000&extensions=all`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ Amap 请求失败: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.status !== '1') {
      console.error(`❌ Amap API 返回错误: ${data.info}`);
      return null;
    }

    const regeocode = data.regeocode || {};
    
    // 尝试获取周边 POI 信息
    let poiName = null;
    if (regeocode.pois && regeocode.pois.length > 0) {
      const poi = regeocode.pois[0];
      poiName = poi.name || poi.type;
    }

    // 获取格式化地址
    const address = regeocode.formatted_address;

    return {
      address,
      poiName,
      district: regeocode.addressComponent?.district,
      city: regeocode.addressComponent?.city,
      pois: regeocode.pois || [],
    };
  } catch (error) {
    console.error(`❌ 获取地名失败: ${error.message}`);
    return null;
  }
}

/**
 * 批量获取地理信息（带并发控制和速率限制）
 * @param {Array} features - GeoJSON features 数组
 * @param {string} apiKey - 高德地图 API Key
 * @param {number} concurrency - 并发数
 * @returns {Promise<Array>} 增强后的 features
 */
export async function enrichFeaturesWithAmap(features, apiKey, concurrency = 3) {
  if (!apiKey) {
    console.warn(`⚠️  未配置 Amap API Key，跳过地名增强`);
    return features;
  }

  console.log(`🔄 开始用 Amap 增强 ${features.length} 个 POI...`);

  const results = [];
  let processed = 0;

  // 并发处理，控制速率
  for (let i = 0; i < features.length; i += concurrency) {
    const batch = features.slice(i, i + concurrency);
    
    const promises = batch.map(async (feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      
      try {
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
        
        const geoInfo = await getAddressFromAmap(lng, lat, apiKey);
        
        // 更新 feature 的名称和属性
        if (geoInfo && geoInfo.poiName) {
          feature.properties.name = geoInfo.poiName;
          feature.properties.address = geoInfo.address;
        }
        
        processed++;
        if (processed % 10 === 0) {
          console.log(`  进度: ${processed}/${features.length}`);
        }
        
        return feature;
      } catch (error) {
        console.error(`  ❌ 处理 POI ${feature.properties.id} 失败: ${error.message}`);
        return feature; // 保留原始 feature
      }
    });

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
  }

  console.log(`✅ Amap 增强完成: ${processed}/${features.length}`);
  return results;
}

/**
 * 本地地名库（备选，不需要 API Key）
 * 用于 Amap 不可用时的降级方案
 */
const LOCAL_LOCATION_NAMES = {
  '浙江': {
    '杭州市': {
      name: '杭州市',
      bounds: { minLng: 119.8, maxLng: 120.6, minLat: 29.8, maxLat: 30.5 },
    },
    '宁波市': {
      name: '宁波市',
      bounds: { minLng: 120.8, maxLng: 121.8, minLat: 29.4, maxLat: 30.2 },
    },
    // 添加更多城市...
  },
};

/**
 * 本地地名查询（不需要 API Key）
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @returns {string|null} 地名
 */
export function getLocationNameLocally(lng, lat) {
  const regions = [
    { name: '杭州', lngRange: [119.8, 120.6], latRange: [29.8, 30.5] },
    { name: '宁波', lngRange: [120.8, 121.8], latRange: [29.4, 30.2] },
    { name: '温州', lngRange: [120.4, 121.3], latRange: [27.8, 28.6] },
    { name: '嘉兴', lngRange: [120.4, 121.2], latRange: [30.4, 30.9] },
    { name: '湖州', lngRange: [119.8, 120.6], latRange: [30.7, 31.3] },
    { name: '绍兴', lngRange: [120.4, 121.3], latRange: [29.8, 30.5] },
    { name: '金华', lngRange: [119.2, 120.3], latRange: [28.9, 29.9] },
    { name: '衢州', lngRange: [118.4, 119.3], latRange: [28.8, 29.4] },
    { name: '舟山', lngRange: [121.8, 122.8], latRange: [29.8, 30.5] },
    { name: '台州', lngRange: [121.0, 122.0], latRange: [28.6, 29.3] },
    { name: '丽水', lngRange: [119.4, 120.6], latRange: [28.2, 28.9] },
  ];

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

  return null;
}

export default {
  getAddressFromAmap,
  enrichFeaturesWithAmap,
  getLocationNameLocally,
};
