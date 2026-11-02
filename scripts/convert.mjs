#!/usr/bin/env node

/**
 * 数据转换脚本：将 JSON/CSV 转换为 FlatGeobuf 与 GeoJSON 格式
 * 
 * 使用方法：
 *   node scripts/convert.mjs
 *   
 * 输入文件期望位置：
 *   public/data/pois.geojson (标准 GeoJSON)
 * 
 * 输出文件：
 *   public/data/pois.fgb (FlatGeobuf 二进制格式)
 *   public/data/pois.geojson (保留原文件以供备用)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const dataDir = path.join(projectRoot, 'public', 'data');
const inputFile = path.join(dataDir, 'pois.geojson');
const outputFgb = path.join(dataDir, 'pois.fgb');

console.log('🚀 POI 数据转换工具');
console.log('================================================\n');

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`✓ 创建数据目录: ${dataDir}`);
}

// 检查输入文件
if (!fs.existsSync(inputFile)) {
  console.error(`❌ 错误：找不到输入文件 ${inputFile}`);
  console.error('请先创建 public/data/pois.geojson 文件');
  process.exit(1);
}

console.log(`✓ 读取输入文件: pois.geojson`);

// 读取并验证 GeoJSON
try {
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  
  if (!data.type || data.type !== 'FeatureCollection') {
    throw new Error('Invalid GeoJSON: must be a FeatureCollection');
  }
  
  console.log(`✓ 有效的 GeoJSON 格式，包含 ${data.features.length} 个 Feature`);
  
  // 验证每个 Feature
  let validCount = 0;
  for (const feature of data.features) {
    if (
      feature.type === 'Feature' &&
      feature.geometry?.type === 'Point' &&
      Array.isArray(feature.geometry.coordinates) &&
      feature.properties?.id &&
      feature.properties?.name
    ) {
      validCount++;
    }
  }
  
  console.log(`✓ 有效的 Feature 数量: ${validCount}/${data.features.length}`);
  
  // 尝试使用 flatgeobuf-cli 转换（如果安装）
  try {
    console.log('\n转换为 FlatGeobuf 格式...');
    const command = `npx flatgeobuf convert ${inputFile} ${outputFgb}`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✓ 成功生成: pois.fgb`);
  } catch (error) {
    console.warn('⚠️  FlatGeobuf 转换失败，请确保已安装 flatgeobuf-cli');
    console.warn('   运行: npm install -g flatgeobuf-cli 后重试');
    console.log('\n✓ GeoJSON 文件已保留，应用仍可使用');
  }
  
  console.log('\n================================================');
  console.log('✅ 数据转换完成！');
  console.log(`   - pois.geojson: ${inputFile}`);
  console.log(`   - pois.fgb: ${outputFgb} (可选)`);
  console.log('\n应用会优先使用 .fgb 格式（更快更小），不存在时自动降级到 .geojson');
  
} catch (error) {
  console.error('❌ 处理失败:', error.message);
  process.exit(1);
}
