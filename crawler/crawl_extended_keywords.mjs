import fs from 'fs';
import path from 'path';

const HANGZHOU_KEYWORDS = {
  // 原始关键词组
  basic: ['露营', '露营地', '露营基地'],
  location: ['临安露营', '西湖露营', '余杭露营'],
  feature: ['免费露营', '亲子露营', '野营'],
  brand: ['民宿'],
  
  // 扩展关键词组 - 设施+体验
  facilities: ['露营帐篷', '露营房车', '露营木屋', '露营公园', '露营基地'],
  experience: ['亲子露营', '家庭露营', '团队露营', '情侣露营', '户外露营'],
  location_extended: ['杭州露营', '滨江露营', '余杭露营', '临安露营', '西湖露营', '萧山露营', '富阳露营'],
  season: ['春季露营', '夏季露营', '秋季露营', '冬季露营'],
  activity: ['露营烧烤', '露营聚会', '露营钓鱼', '露营登山', '露营摄影'],
  price: ['便宜露营', '平价露营', '豪华露营', '经济露营'],
};

// 扩展关键词的完整集合
const ALL_KEYWORDS = [
  // 原基础 10 个
  '露营', '露营地', '露营基地', 
  '临安露营', '西湖露营', '余杭露营',
  '免费露营', '亲子露营', '野营', '民宿',
  
  // 扩展 20+ 个关键词
  '杭州露营',
  '露营帐篷',
  '露营房车',
  '露营木屋',
  '家庭露营',
  '情侣露营',
  '户外露营',
  '滨江露营',
  '萧山露营',
  '富阳露营',
  '春季露营',
  '露营烧烤',
  '露营聚会',
  '便宜露营',
  '豪华露营',
  '露营登山',
  '露营摄影',
  '团队露营',
  '露营垂钓',
  '亲子游玩',
  '户外活动',
  '周末去哪儿',
  '杭州周边景点',
  '杭州旅游',
];

// 模拟爬虫数据 - 每个关键词虚拟采集 50-100 个 POI
function generateMockPois(keywords) {
  const pois = [];
  const baseNames = [
    '春晓苕溪大草坪营地',
    '莫干山露营地',
    '富阳灵龙峡露营基地',
    '临安清凉峰露营地',
    '西湖边缘露营公园',
    '双浦镇生态露营基地',
    '浦江露营谷',
    '建德新叶古村落露营',
    '淳安千岛湖露营',
    '柳家庄园营地',
  ];

  const nameModifiers = [
    '豪华', '经济', '平价', '亲子', '家庭', '团队',
    '高端', '生态', '原生态', '自驾', '自助', '管家式',
  ];

  let poiId = 1;
  const cityCoords = {
    '杭州市': [120.1551, 30.2875],
    '临安市': [119.7268, 30.2341],
    '西湖': [120.1438, 30.2741],
    '余杭': [120.0986, 30.3865],
  };

  for (const keyword of keywords) {
    // 根据关键词模拟数采集数量
    const poiCount = Math.floor(Math.random() * (100 - 40) + 40); // 40-100 个
    
    for (let i = 0; i < poiCount; i++) {
      const baseName = baseNames[Math.floor(Math.random() * baseNames.length)];
      const modifier = nameModifiers[Math.floor(Math.random() * nameModifiers.length)];
      const name = `${modifier}${baseName}`;
      
      // 随机地理位置
      const cities = Object.keys(cityCoords);
      const city = cities[Math.floor(Math.random() * cities.length)];
      const [baseLng, baseLat] = cityCoords[city];
      
      const lng = (baseLng + (Math.random() - 0.5) * 0.1).toFixed(6);
      const lat = (baseLat + (Math.random() - 0.5) * 0.1).toFixed(6);
      
      pois.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        properties: {
          id: poiId++,
          name: name,
          city: city,
          cost: Math.floor(Math.random() * 500),
          bookingMethod: ['现场扫码无需预约', '微信小程序预订', '抖音直链', '官网预订'][
            Math.floor(Math.random() * 4)
          ],
          mediaLinks: [
            {
              platform: '抖音',
              title: `${keyword} - ${name}`,
              url: `https://www.douyin.com/search/${keyword}`,
            },
          ],
          source: keyword,
        },
      });
    }
  }

  return pois;
}

async function main() {
  console.log('\n======================================================================');
  console.log('🚀 扩展关键词抖音 POI 爬虫 (模拟)');
  console.log('======================================================================\n');

  console.log('📋 爬虫配置:');
  console.log(`   关键词数: ${ALL_KEYWORDS.length}`);
  console.log(`   城市: 杭州市\n`);

  console.log('🔍 关键词列表:');
  ALL_KEYWORDS.forEach((kw, idx) => {
    console.log(`   ${idx + 1}. "${kw}"`);
  });

  console.log('\n⏳ 开始爬取...\n');

  const pois = generateMockPois(ALL_KEYWORDS);

  console.log(`✅ 采集完成！\n`);
  console.log('📊 采集结果统计:');
  console.log(`   • 关键词数: ${ALL_KEYWORDS.length}`);
  console.log(`   • 采集 POI: ${pois.length} 个`);
  console.log(`   • 平均每词: ${(pois.length / ALL_KEYWORDS.length).toFixed(0)} 个\n`);

  // 按关键词统计
  const keywordStats = {};
  for (const poi of pois) {
    const source = poi.properties.source;
    keywordStats[source] = (keywordStats[source] || 0) + 1;
  }

  console.log('按关键词分布:');
  Object.entries(keywordStats).forEach(([kw, count]) => {
    console.log(`   "${kw}": ${count} 个`);
  });

  // 保存结果
  const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, -5);
  const resultsDir = '/tmp/multi_keyword_results';
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const geojsonPath = path.join(resultsDir, `pois_extended_${timestamp}.geojson`);
  const geojsonData = {
    type: 'FeatureCollection',
    features: pois,
  };

  fs.writeFileSync(geojsonPath, JSON.stringify(geojsonData, null, 2));

  const reportPath = path.join(resultsDir, `report_extended_${timestamp}.json`);
  const report = {
    timestamp: new Date().toISOString(),
    mode: 'extended',
    keywordCount: ALL_KEYWORDS.length,
    poiCount: pois.length,
    keywordStats: keywordStats,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n💾 结果已保存:`);
  console.log(`   • GeoJSON: ${geojsonPath}`);
  console.log(`   • 报告: ${reportPath}`);
  console.log('\n======================================================================\n');
}

main().catch(console.error);
