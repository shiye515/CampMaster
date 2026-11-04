import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('../public/data');
const CITIES_DIR = path.join(DATA_DIR, 'cities');

/**
 * 数据验证和清洗函数
 */
function cleanPoi(poi) {
  const { properties, geometry } = poi;
  
  // 验证必需字段
  if (!properties || !geometry || !geometry.coordinates) {
    return null;
  }
  
  const { name, city, cost, bookingMethod, mediaLinks } = properties;
  
  // 验证坐标 (WGS84)
  const [lng, lat] = geometry.coordinates;
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    return null;
  }
  
  // 坐标范围检查 (中国范围)
  if (lng < 73 || lng > 135 || lat < 18 || lat > 54) {
    console.warn(`⚠️  坐标超出中国范围: ${name} (${lng}, ${lat})`);
    return null;
  }
  
  // 名称清洗
  const cleanName = (name || '').trim().replace(/\s+/g, '');
  if (!cleanName || cleanName.length === 0) {
    return null;
  }
  
  // 城市清洗
  const cleanCity = (city || '杭州市').trim();
  
  // 费用清洗
  const cleanCost = Math.max(0, parseInt(cost) || 0);
  
  // 下单方式清洗
  const cleanBookingMethod = (bookingMethod || '暂未获取').trim();
  
  // 媒体链接清洗
  let cleanMediaLinks = [];
  if (Array.isArray(mediaLinks)) {
    cleanMediaLinks = mediaLinks.filter(link => {
      return link && link.platform && link.url && link.title;
    }).map(link => ({
      platform: link.platform.trim(),
      title: link.title.trim().substring(0, 100),
      url: link.url.trim(),
    }));
  }
  
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [
        parseFloat(lng.toFixed(6)),
        parseFloat(lat.toFixed(6)),
      ],
    },
    properties: {
      id: properties.id || Math.random().toString(36).substr(2, 9),
      name: cleanName,
      city: cleanCity,
      cost: cleanCost,
      bookingMethod: cleanBookingMethod,
      mediaLinks: cleanMediaLinks,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * 计算POI的空间哈希用于去重
 */
function getPoiHash(poi) {
  const { coordinates } = poi.geometry;
  const { name } = poi.properties;
  
  // 50米栅格 (经纬度约0.0005度)
  const gridSize = 0.0005;
  const gridLng = Math.floor(coordinates[0] / gridSize) * gridSize;
  const gridLat = Math.floor(coordinates[1] / gridSize) * gridSize;
  
  // 名称规范化用于比较
  const normalizedName = name.toLowerCase().replace(/[^\w\u4e00-\u9fff]/g, '');
  
  return `${gridLng},${gridLat},${normalizedName}`;
}

/**
 * 检查名称相似度 (编辑距离)
 */
function editDistance(a, b) {
  const len1 = a.length;
  const len2 = b.length;
  const dp = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));
  
  for (let i = 0; i <= len1; i++) dp[0][i] = i;
  for (let j = 0; j <= len2; j++) dp[j][0] = j;
  
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      dp[j][i] = a[i - 1] === b[j - 1]
        ? dp[j - 1][i - 1]
        : 1 + Math.min(dp[j - 1][i], dp[j][i - 1], dp[j - 1][i - 1]);
    }
  }
  
  return dp[len2][len1];
}

/**
 * 检查两个POI是否重复
 */
function isDuplicate(poi1, poi2, threshold = 0.85) {
  const { coordinates: coord1 } = poi1.geometry;
  const { name: name1, city: city1 } = poi1.properties;
  
  const { coordinates: coord2 } = poi2.geometry;
  const { name: name2, city: city2 } = poi2.properties;
  
  // 城市必须相同
  if (city1 !== city2) return false;
  
  // 距离检查 (500米内)
  const latDiff = Math.abs(coord1[1] - coord2[1]);
  const lngDiff = Math.abs(coord1[0] - coord2[0]);
  if (latDiff > 0.005 || lngDiff > 0.005) return false;
  
  // 名称相似度检查
  const dist = editDistance(name1, name2);
  const similarity = 1 - dist / Math.max(name1.length, name2.length);
  
  return similarity >= threshold;
}

/**
 * 合并去重
 */
function deduplicateAndMerge(allPois) {
  const deduped = [];
  const seenHashes = new Set();
  const stats = {
    total: allPois.length,
    valid: 0,
    duplicates: 0,
    merged: 0,
  };
  
  for (const poi of allPois) {
    const hash = getPoiHash(poi);
    
    if (seenHashes.has(hash)) {
      stats.duplicates++;
      continue;
    }
    
    // 检查与已添加POI的相似度
    let found = false;
    for (const existing of deduped) {
      if (isDuplicate(poi, existing)) {
        stats.duplicates++;
        found = true;
        break;
      }
    }
    
    if (!found) {
      deduped.push(poi);
      seenHashes.add(hash);
      stats.valid++;
    }
  }
  
  return { deduped, stats };
}

/**
 * 主处理流程
 */
async function main() {
  console.log('\n======================================================================');
  console.log('🧹 数据清洗与合并工具');
  console.log('======================================================================\n');
  
  try {
    // 1. 读取采集的新数据
    const latestFile = process.argv[2];
    if (!latestFile) {
      console.error('❌ 请提供爬虫输出文件路径');
      process.exit(1);
    }
    
    console.log('【步骤1】读取新采集数据...');
    const newData = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));
    console.log(`  ✓ 新数据 POI: ${newData.features.length} 个\n`);
    
    // 2. 读取网站现有数据
    console.log('【步骤2】读取网站现有数据...');
    let existingPois = [];
    const existingFile = path.join(DATA_DIR, 'pois.geojson');
    
    if (fs.existsSync(existingFile)) {
      const existingData = JSON.parse(fs.readFileSync(existingFile, 'utf-8'));
      existingPois = existingData.features || [];
      console.log(`  ✓ 现有数据 POI: ${existingPois.length} 个\n`);
    } else {
      console.log(`  ℹ️  首次创建，无现有数据\n`);
    }
    
    // 3. 清洗新数据
    console.log('【步骤3】清洗新采集数据...');
    let cleanedNewPois = newData.features
      .map(poi => cleanPoi(poi))
      .filter(poi => poi !== null);
    
    const newStats = {
      total: newData.features.length,
      valid: cleanedNewPois.length,
      invalid: newData.features.length - cleanedNewPois.length,
    };
    
    console.log(`  ✓ 有效 POI: ${newStats.valid} 个`);
    console.log(`  ⚠️  清除无效 POI: ${newStats.invalid} 个\n`);
    
    // 4. 合并所有数据
    console.log('【步骤4】合并新旧数据...');
    const allPois = [...existingPois, ...cleanedNewPois];
    console.log(`  ✓ 合并后总数: ${allPois.length} 个\n`);
    
    // 5. 去重
    console.log('【步骤5】去重处理...');
    const { deduped, stats: dedupStats } = deduplicateAndMerge(allPois);
    
    console.log(`  ✓ 最终 POI: ${deduped.length} 个`);
    console.log(`  ✓ 去重数: ${dedupStats.duplicates} 个`);
    console.log(`  📊 去重率: ${(dedupStats.duplicates / allPois.length * 100).toFixed(2)}%\n`);
    
    // 6. 按城市分组
    console.log('【步骤6】按城市分组...');
    const byCity = {};
    for (const poi of deduped) {
      const city = poi.properties.city;
      if (!byCity[city]) {
        byCity[city] = [];
      }
      byCity[city].push(poi);
    }
    
    console.log(`  ✓ 涉及城市: ${Object.keys(byCity).length} 个`);
    for (const [city, pois] of Object.entries(byCity)) {
      console.log(`    - ${city}: ${pois.length} 个 POI`);
    }
    console.log('');
    
    // 7. 保存最终数据
    console.log('【步骤7】保存最终数据...');
    
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // 保存总文件
    const finalData = {
      type: 'FeatureCollection',
      features: deduped,
      metadata: {
        timestamp: new Date().toISOString(),
        totalPois: deduped.length,
        cities: Object.keys(byCity).length,
        version: '2.0',
      },
    };
    
    fs.writeFileSync(
      path.join(DATA_DIR, 'pois.geojson'),
      JSON.stringify(finalData, null, 2)
    );
    console.log(`  ✓ 总文件保存: public/data/pois.geojson (${deduped.length} POI)`);
    
    // 保存按城市分开的文件
    if (!fs.existsSync(CITIES_DIR)) {
      fs.mkdirSync(CITIES_DIR, { recursive: true });
    }
    
    const cityIndex = {};
    for (const [city, pois] of Object.entries(byCity)) {
      const cityData = {
        type: 'FeatureCollection',
        features: pois,
        metadata: {
          city: city,
          poiCount: pois.length,
          timestamp: new Date().toISOString(),
        },
      };
      
      const filename = `${city}.geojson`;
      fs.writeFileSync(
        path.join(CITIES_DIR, filename),
        JSON.stringify(cityData, null, 2)
      );
      
      cityIndex[city] = {
        filename: filename,
        poiCount: pois.length,
      };
    }
    
    // 保存城市索引
    fs.writeFileSync(
      path.join(DATA_DIR, 'cities.json'),
      JSON.stringify(
        {
          cities: Object.keys(byCity).sort(),
          cityData: cityIndex,
          timestamp: new Date().toISOString(),
          totalPois: deduped.length,
        },
        null,
        2
      )
    );
    
    console.log(`  ✓ 城市文件保存: public/data/cities/*.geojson`);
    console.log(`  ✓ 城市索引保存: public/data/cities.json\n`);
    
    // 8. 生成报告
    console.log('【步骤8】清洗统计报告...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 清洗前后对比:');
    console.log(`  新采集:    ${newStats.total} POI → 清洗后 ${newStats.valid} POI`);
    console.log(`  现有:      ${existingPois.length} POI`);
    console.log(`  合并:      ${allPois.length} POI`);
    console.log(`  去重后:    ${deduped.length} POI`);
    console.log(`  重复项:    ${dedupStats.duplicates} 个 (${(dedupStats.duplicates / allPois.length * 100).toFixed(2)}%)`);
    console.log('');
    console.log('📍 城市分布:');
    const sorted = Object.entries(byCity)
      .sort((a, b) => b[1].length - a[1].length);
    sorted.forEach(([city, pois]) => {
      console.log(`  ${city.padEnd(12)} ${pois.length.toString().padStart(5)} POI`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('✅ 数据清洗和合并完成！');
    console.log(`\n📁 输出文件:`);
    console.log(`   • public/data/pois.geojson (${deduped.length} POI)`);
    console.log(`   • public/data/cities.json (${Object.keys(byCity).length} 个城市)`);
    console.log(`   • public/data/cities/*.geojson (按城市分开)\n`);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
