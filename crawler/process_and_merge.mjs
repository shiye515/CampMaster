#!/usr/bin/env node
/**
 * process_and_merge.mjs
 * 
 * 处理爬虫数据：
 * 1. 读取爬虫输出的 GeoJSON 结果
 * 2. 按城市分文件存储到 public/data/cities/
 * 3. 与现有数据合并去重
 * 4. 生成整合后的城市列表
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const CITIES_DIR = resolve(process.cwd(), 'public/data/cities');
const CRAWLER_OUTPUT = process.argv[2] || 'douyin_poi_results.geojson';

console.log(`[Process] 开始处理爬虫数据...`);
console.log(`[Process] 输入文件: ${CRAWLER_OUTPUT}`);

// 1. 读取爬虫输出数据
let crawlerData;
try {
  const content = readFileSync(CRAWLER_OUTPUT, 'utf8');
  crawlerData = JSON.parse(content);
  if (!crawlerData.features) {
    throw new Error('Invalid GeoJSON: missing features array');
  }
  console.log(`[Process] ✅ 读取爬虫数据成功，共 ${crawlerData.features.length} 条 POI`);
} catch (err) {
  console.error(`[Process] ❌ 读取爬虫数据失败:`, err.message);
  process.exit(1);
}

// 2. 按城市分组爬虫数据
const crawlerByCity = {};
for (const feature of crawlerData.features) {
  const city = feature.properties.city || '未知城市';
  if (!crawlerByCity[city]) {
    crawlerByCity[city] = [];
  }
  crawlerByCity[city].push(feature);
}

console.log(`[Process] 爬虫数据分城市统计:`, 
  Object.entries(crawlerByCity).map(([city, features]) => `${city}(${features.length})`).join(', ')
);

// 3. 与现有数据合并
const mergedByCity = {};
const allCities = new Set(Object.keys(crawlerByCity));

// 先读取现有城市文件
if (existsSync(CITIES_DIR)) {
  const files = readdirSync(CITIES_DIR).filter(f => f.endsWith('.geojson'));
  for (const file of files) {
    const city = file.replace('.geojson', '');
    allCities.add(city);
    try {
      const existing = JSON.parse(readFileSync(resolve(CITIES_DIR, file), 'utf8'));
      if (existing.features) {
        mergedByCity[city] = [...(existing.features || [])];
      }
    } catch (err) {
      console.warn(`[Process] ⚠️ 读取现有数据 ${file} 失败: ${err.message}`);
    }
  }
}

// 合并爬虫数据，避免重复
for (const city of allCities) {
  if (!mergedByCity[city]) {
    mergedByCity[city] = [];
  }

  const existingNames = new Set(mergedByCity[city].map(f => f.properties.name));
  const newFeatures = crawlerByCity[city] || [];

  for (const feature of newFeatures) {
    if (!existingNames.has(feature.properties.name)) {
      mergedByCity[city].push(feature);
      existingNames.add(feature.properties.name);
    } else {
      console.log(`[Process] ℹ️ 跳过重复: ${feature.properties.name}`);
    }
  }
}

// 4. 写入城市文件
if (!existsSync(CITIES_DIR)) {
  const fs = await import('fs/promises');
  await fs.mkdir(CITIES_DIR, { recursive: true });
}

const cityStats = {};
for (const [city, features] of Object.entries(mergedByCity)) {
  const cityFile = resolve(CITIES_DIR, `${city}.geojson`);
  const geojson = {
    type: 'FeatureCollection',
    features: features
  };
  writeFileSync(cityFile, JSON.stringify(geojson, null, 2), 'utf8');
  cityStats[city] = features.length;
  console.log(`[Process] 💾 ${city}: ${features.length} 条 POI (已保存)`);
}

// 5. 生成城市列表配置
const cityList = Object.keys(mergedByCity)
  .sort()
  .map(city => ({ name: city, poiCount: mergedByCity[city].length }));

const cityConfigPath = resolve(CITIES_DIR, 'cities.json');
writeFileSync(cityConfigPath, JSON.stringify(cityList, null, 2), 'utf8');

console.log(`\n[Process] ✅ 数据处理完成！`);
console.log(`[Process] 总计城市数: ${cityList.length}`);
console.log(`[Process] 总计 POI 数: ${Object.values(mergedByCity).reduce((a, b) => a + b.length, 0)}`);
console.log(`[Process] 配置文件: ${cityConfigPath}\n`);
