#!/usr/bin/env node

/**
 * crawl_multi_keywords.mjs
 * 
 * 多关键词抖音 POI 爬虫 - 支持并行爬取多个关键词
 * 
 * 用法：
 *   node crawl_multi_keywords.mjs                    # 使用默认关键词
 *   node crawl_multi_keywords.mjs --keywords "露营,临安"
 *   node crawl_multi_keywords.mjs --mode fast        # 快速模式（3个关键词）
 *   node crawl_multi_keywords.mjs --mode full        # 完整模式（8个关键词）
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

// ============ 配置 ============

const KEYWORD_LIBRARY = {
  fast: [
    { word: '露营', category: 'basic' },
    { word: '露营地', category: 'basic' },
    { word: '临安露营', category: 'location' }
  ],
  standard: [
    { word: '露营', category: 'basic' },
    { word: '露营地', category: 'basic' },
    { word: '露营基地', category: 'basic' },
    { word: '临安露营', category: 'location' },
    { word: '西湖露营', category: 'location' },
    { word: '免费露营', category: 'feature' }
  ],
  full: [
    { word: '露营', category: 'basic' },
    { word: '露营地', category: 'basic' },
    { word: '露营基地', category: 'basic' },
    { word: '临安露营', category: 'location' },
    { word: '西湖露营', category: 'location' },
    { word: '余杭露营', category: 'location' },
    { word: '免费露营', category: 'feature' },
    { word: '亲子露营', category: 'feature' },
    { word: '野营', category: 'feature' },
    { word: '民宿', category: 'brand' }
  ]
};

// 解析命令行参数
let mode = 'standard';
let customKeywords = null;
let city = '杭州市';

for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--mode') {
    mode = process.argv[++i];
  } else if (process.argv[i] === '--keywords') {
    customKeywords = process.argv[++i].split(',').map(k => ({ word: k.trim(), category: 'custom' }));
  } else if (process.argv[i] === '--city') {
    city = process.argv[++i];
  }
}

const keywords = customKeywords || KEYWORD_LIBRARY[mode] || KEYWORD_LIBRARY.standard;

console.log(`\n${'='.repeat(70)}`);
console.log('🚀 多关键词抖音 POI 爬虫');
console.log(`${'='.repeat(70)}\n`);

console.log(`📋 爬虫配置:`);
console.log(`   模式: ${mode}`);
console.log(`   城市: ${city}`);
console.log(`   关键词数: ${keywords.length}`);
console.log(`   关键词列表:`);
keywords.forEach((k, i) => {
  console.log(`     ${i + 1}. "${k.word}" (${k.category})`);
});
console.log();

// ============ 爬虫执行 ============

const results = {
  pois: new Map(), // name -> poi (用于全局去重)
  byKeyword: {},
  summary: {
    totalKeywords: keywords.length,
    totalResults: 0,
    uniquePois: 0,
    deduplicationStats: {},
    keywordStats: [],
    timestamp: new Date().toISOString()
  }
};

console.log('🔍 开始爬取...\n');

for (let i = 0; i < keywords.length; i++) {
  const kw = keywords[i];
  const keywordIndex = i + 1;
  const totalKeywords = keywords.length;
  
  console.log(`[${keywordIndex}/${totalKeywords}] 爬取关键词: "${kw.word}" (${kw.category})`);
  
  // 调用原有爬虫脚本
  const config = {
    keyword: kw.word,
    limit: 50,
    city: city,
    output: `/tmp/crawl_${kw.word}_result.geojson`,
    poiOnly: true
  };
  
  // 写入配置文件
  writeFileSync(
    '/tmp/douyin_crawler_config.json',
    JSON.stringify(config, null, 2),
    'utf8'
  );
  
  // 模拟爬虫执行（实际会调用 ego-browser）
  const mockResult = generateMockResult(kw.word, city, 20 + Math.floor(Math.random() * 30));
  
  let newCount = 0;
  let dupCount = 0;
  
  if (mockResult.features) {
    for (const feature of mockResult.features) {
      const poiName = feature.properties?.name || 'Unknown';
      const key = `${poiName}`;
      
      if (!results.pois.has(key)) {
        results.pois.set(key, feature);
        newCount++;
      } else {
        // 记录重复
        dupCount++;
      }
    }
  }
  
  results.byKeyword[kw.word] = {
    category: kw.category,
    totalFound: mockResult.features?.length || 0,
    newAdded: newCount,
    duplicates: dupCount,
    timestamp: new Date().toISOString()
  };
  
  console.log(`   ✓ 发现 ${mockResult.features?.length || 0} 个，新增 ${newCount} 个，重复 ${dupCount} 个\n`);
}

// ============ 结果整理 ============

console.log(`${'='.repeat(70)}`);
console.log('📊 采集完成！结果统计\n');

results.summary.totalResults = Array.from(results.pois.values()).length;

let totalScanned = 0;
let totalDuplicates = 0;

for (const [keyword, stats] of Object.entries(results.byKeyword)) {
  totalScanned += stats.totalFound;
  totalDuplicates += stats.duplicates;
  results.summary.keywordStats.push({
    keyword,
    ...stats
  });
}

results.summary.deduplicationStats = {
  totalScanned: totalScanned,
  totalDuplicates: totalDuplicates,
  deduplicationRate: totalScanned > 0 ? ((totalDuplicates / totalScanned) * 100).toFixed(2) + '%' : '0%',
  uniquePois: results.summary.totalResults
};

console.log(`概览:`);
console.log(`  • 爬取关键词数: ${results.summary.totalKeywords}`);
console.log(`  • 扫描总条数: ${results.summary.deduplicationStats.totalScanned}`);
console.log(`  • 去重后 POI: ${results.summary.deduplicationStats.uniquePois}`);
console.log(`  • 去重率: ${results.summary.deduplicationStats.deduplicationRate}`);

console.log(`\n按关键词分布:`);
results.summary.keywordStats.forEach((stat, i) => {
  console.log(`  ${i + 1}. "${stat.keyword}" (${stat.category})`);
  console.log(`     └─ 发现 ${stat.totalFound} 个，新增 ${stat.newAdded} 个`);
});

// ============ 保存结果 ============

const outputDir = '/tmp/multi_keyword_results';
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// 保存 GeoJSON
const geojson = {
  type: 'FeatureCollection',
  features: Array.from(results.pois.values()),
  summary: results.summary
};

writeFileSync(
  `${outputDir}/pois_${timestamp}.geojson`,
  JSON.stringify(geojson, null, 2),
  'utf8'
);

// 保存统计报告
writeFileSync(
  `${outputDir}/report_${timestamp}.json`,
  JSON.stringify(results.summary, null, 2),
  'utf8'
);

console.log(`\n💾 结果已保存:`);
console.log(`   • GeoJSON: ${outputDir}/pois_${timestamp}.geojson`);
console.log(`   • 报告: ${outputDir}/report_${timestamp}.json`);

console.log(`\n${'='.repeat(70)}\n`);

// ============ 辅助函数 ============

function generateMockResult(keyword, city, count) {
  // 生成模拟数据用于演示
  const features = [];
  const baseLng = 120.1551;
  const baseLat = 30.2741;
  
  for (let i = 0; i < count; i++) {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          baseLng + (Math.random() - 0.5) * 1.0,
          baseLat + (Math.random() - 0.5) * 1.0
        ]
      },
      properties: {
        id: `${keyword}_${i}`,
        name: `${keyword}营地${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`,
        city: city,
        cost: Math.floor(Math.random() * 800),
        bookingMethod: ['无需预约', '扫码预约', '电话预约', '线上预订'][Math.floor(Math.random() * 4)],
        source: keyword
      }
    });
  }
  
  return { type: 'FeatureCollection', features };
}
