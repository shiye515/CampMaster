#!/usr/bin/env node

/**
 * enhanced_crawler.mjs
 * 
 * 增强版抖音 POI 爬虫 - 支持博主追踪 + 多关键词
 * 
 * 特性：
 * 1. 博主追踪系统 - 记录发现专业博主，优先采集其更新
 * 2. 多关键词支持 - 同时爬取多个相关关键词的结果
 * 3. 智能去重 - 基于坐标和名称的多维度去重
 * 4. 数据来源追踪 - 记录每个 POI 的采集来源
 * 5. 置信度评分 - 多来源数据获得更高分数
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

// ============ 配置 ============

const config = {
  // 爬虫模式
  mode: process.argv.includes('--influencer-only') ? 'influencer' : 'full', // full | influencer | keywords
  
  // 基础配置
  city: '杭州市',
  limit: 50, // 单个搜索的上限
  
  // 关键词库（按优先级排序）
  keywords: [
    // 基础词
    { word: '露营', priority: 10, weight: 1.0 },
    { word: '露营地', priority: 9, weight: 0.95 },
    { word: '露营基地', priority: 8, weight: 0.9 },
    
    // 地名词（杭州周边）
    { word: '临安露营', priority: 7, weight: 0.85 },
    { word: '西湖露营', priority: 6, weight: 0.8 },
    { word: '余杭露营', priority: 5, weight: 0.75 },
    
    // 特征词
    { word: '免费露营', priority: 7, weight: 0.8 },
    { word: '亲子露营', priority: 6, weight: 0.75 },
    { word: '野营', priority: 5, weight: 0.7 },
    
    // 品牌词
    { word: '民宿', priority: 4, weight: 0.65 },
    { word: '营地', priority: 4, weight: 0.65 },
  ],
  
  // 输出路径
  influencerList: '/tmp/influencer_tracklist.json',
  outputDir: '/tmp/crawler_results',
  
  // 采集策略
  dedupeRadius: 50, // 米，用于坐标去重
  minPoiPerInfluencer: 3, // 博主最少要有3个POI才被列为专业博主
};

console.log(`\n${'='.repeat(60)}`);
console.log('🚀 增强版抖音 POI 爬虫启动');
console.log(`${'='.repeat(60)}\n`);

// ============ 数据结构 ============

class InfluencerTracker {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = this.load();
  }
  
  load() {
    if (existsSync(this.filePath)) {
      try {
        return JSON.parse(readFileSync(this.filePath, 'utf8'));
      } catch (e) {
        console.warn(`⚠️  无法读取博主列表: ${e.message}`);
      }
    }
    return { influencers: [], lastUpdated: new Date().toISOString(), stats: {} };
  }
  
  save() {
    const stats = this.getStats();
    this.data.stats = stats;
    this.data.lastUpdated = new Date().toISOString();
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
  }
  
  addInfluencer(uid, name, avatar, poiIds = []) {
    const existing = this.data.influencers.find(i => i.uid === uid);
    
    if (existing) {
      // 合并 POI ID
      existing.poiIds = [...new Set([...existing.poiIds, ...poiIds])];
      existing.poiCount = existing.poiIds.length;
      existing.lastUpdate = new Date().toISOString();
      existing.videoCount = (existing.videoCount || 0) + 1;
    } else {
      this.data.influencers.push({
        uid,
        name,
        avatar,
        poiIds,
        poiCount: poiIds.length,
        videoCount: 1,
        addedAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString()
      });
    }
  }
  
  getInfluencers(minPoiCount = config.minPoiPerInfluencer) {
    return this.data.influencers.filter(i => i.poiCount >= minPoiCount);
  }
  
  getStats() {
    const influencers = this.getInfluencers();
    const totalPois = influencers.reduce((sum, i) => sum + i.poiCount, 0);
    
    return {
      totalInfluencers: influencers.length,
      totalPoisCovered: totalPois,
      avgPoiPerInfluencer: influencers.length > 0 ? (totalPois / influencers.length).toFixed(2) : 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

// ============ 数据去重引擎 ============

class DeduplicationEngine {
  constructor(radius = config.dedupeRadius) {
    this.radius = radius; // 米
    this.pois = new Map(); // id -> poi
    this.spatialIndex = []; // for rough spatial filtering
  }
  
  addPoi(poi) {
    const key = this.generateKey(poi);
    
    if (this.pois.has(key)) {
      const existing = this.pois.get(key);
      // 更新来源信息
      existing.sources = [...new Set([...(existing.sources || []), ...(poi.sources || [])])];
      existing.confidence = Math.min(existing.sources.length / 3, 1.0); // 多来源提升置信度
      return false; // 重复
    }
    
    this.pois.set(key, poi);
    this.spatialIndex.push(poi);
    return true; // 新增
  }
  
  generateKey(poi) {
    // 基于名称的精确匹配
    const name = poi.properties?.name || '';
    // 基于坐标的模糊匹配（向下取整到 50m 网格）
    const coords = poi.geometry?.coordinates || [0, 0];
    const grid = [
      Math.floor(coords[0] * 1000 / this.radius),
      Math.floor(coords[1] * 1000 / this.radius)
    ];
    
    return `${name}|${grid.join(',')}`;
  }
  
  getPois() {
    return Array.from(this.pois.values());
  }
  
  getStats() {
    return {
      uniquePois: this.pois.size,
      totalPoiRecords: this.spatialIndex.length,
      dedupeRate: ((1 - this.pois.size / this.spatialIndex.length) * 100).toFixed(2) + '%'
    };
  }
}

// ============ 爬虫引擎 ============

class EnhancedCrawler {
  constructor() {
    this.influencers = new InfluencerTracker(config.influencerList);
    this.dedupe = new DeduplicationEngine();
    this.results = {
      pois: [],
      sources: {},
      metadata: {
        crawlTime: new Date().toISOString(),
        mode: config.mode,
        keywordsSearched: [],
        influencersScanned: 0
      }
    };
  }
  
  async run() {
    try {
      console.log(`📋 运行模式: ${config.mode}`);
      console.log(`🏙️  目标城市: ${config.city}\n`);
      
      if (config.mode === 'full' || config.mode === 'influencer') {
        await this.crawlInfluencers();
      }
      
      if (config.mode === 'full' || config.mode === 'keywords') {
        await this.crawlKeywords();
      }
      
      this.saveResults();
      this.printStats();
      
    } catch (error) {
      console.error('❌ 爬虫执行出错:', error);
      process.exit(1);
    }
  }
  
  async crawlInfluencers() {
    console.log('👤 阶段1: 博主追踪采集\n');
    
    const activeInfluencers = this.influencers.getInfluencers();
    
    if (activeInfluencers.length === 0) {
      console.log('   ℹ️  暂无已追踪博主，跳过此阶段');
      return;
    }
    
    console.log(`   已追踪博主数: ${activeInfluencers.length}`);
    
    for (const inf of activeInfluencers.slice(0, 5)) { // 限制每次追踪5个博主
      console.log(`   正在更新: ${inf.name} (@${inf.uid})`);
      
      // 模拟从博主主页爬取视频
      // 实际实现会使用 ego-browser 访问博主主页
      // 这里用 mock 数据演示
      const mockPois = this.generateMockPois(inf.name, 3);
      
      for (const poi of mockPois) {
        if (this.dedupe.addPoi(poi)) {
          this.results.pois.push(poi);
        }
      }
      
      this.results.metadata.influencersScanned += 1;
    }
    
    console.log(`   ✅ 完成，新增 POI: ${this.results.pois.length}\n`);
  }
  
  async crawlKeywords() {
    console.log('🔍 阶段2: 多关键词搜索\n');
    
    // 按优先级排序关键词
    const sortedKeywords = config.keywords.sort((a, b) => b.priority - a.priority);
    
    for (const kwObj of sortedKeywords.slice(0, 5)) { // 限制为前5个关键词
      const keyword = kwObj.word;
      console.log(`   搜索关键词: "${keyword}"`);
      
      // 模拟搜索结果
      // 实际实现会使用 ego-browser 执行搜索
      const mockPois = this.generateMockPois(keyword, 8);
      
      let newCount = 0;
      for (const poi of mockPois) {
        poi.sources = poi.sources || [];
        poi.sources.push({ type: 'keyword', value: keyword });
        
        if (this.dedupe.addPoi(poi)) {
          this.results.pois.push(poi);
          newCount++;
        }
      }
      
      console.log(`     → 扫描 ${mockPois.length} 个，新增 ${newCount} 个`);
      this.results.metadata.keywordsSearched.push(keyword);
    }
    
    console.log();
  }
  
  generateMockPois(source, count) {
    // 生成模拟数据用于演示
    const pois = [];
    const baseCoords = [120.1551, 30.2741]; // 杭州中心
    
    for (let i = 0; i < count; i++) {
      const poi = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            baseCoords[0] + (Math.random() - 0.5) * 0.5,
            baseCoords[1] + (Math.random() - 0.5) * 0.5
          ]
        },
        properties: {
          id: `${source}_${i}`,
          name: `${source}示范营地${i + 1}`,
          city: config.city,
          cost: Math.floor(Math.random() * 500),
          bookingMethod: ['无需预约', '扫码预约', '电话预约'][Math.floor(Math.random() * 3)],
          sources: [{ type: 'mock', value: source }],
          confidence: Math.random() * 0.5 + 0.5
        }
      };
      
      pois.push(poi);
    }
    
    return pois;
  }
  
  saveResults() {
    if (!existsSync(config.outputDir)) {
      mkdirSync(config.outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // 保存 GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: this.results.pois
    };
    writeFileSync(
      `${config.outputDir}/pois_${timestamp}.geojson`,
      JSON.stringify(geojson, null, 2),
      'utf8'
    );
    
    // 保存元数据
    writeFileSync(
      `${config.outputDir}/metadata_${timestamp}.json`,
      JSON.stringify(this.results, null, 2),
      'utf8'
    );
    
    console.log(`\n💾 结果已保存至: ${config.outputDir}/`);
  }
  
  printStats() {
    console.log(`${'='.repeat(60)}`);
    console.log('📊 采集统计\n');
    
    console.log(`总新增 POI: ${this.results.pois.length}`);
    console.log(`搜索关键词: ${this.results.metadata.keywordsSearched.length} 个`);
    console.log(`已追踪博主: ${this.results.metadata.influencersScanned} 个`);
    
    const dedupeStats = this.dedupe.getStats();
    console.log(`\n去重统计:`);
    console.log(`  - 唯一 POI: ${dedupeStats.uniquePois}`);
    console.log(`  - 重复率: ${dedupeStats.dedupeRate}`);
    
    const influencerStats = this.influencers.getStats();
    console.log(`\n博主库统计:`);
    console.log(`  - 专业博主: ${influencerStats.totalInfluencers} 位`);
    console.log(`  - 覆盖 POI: ${influencerStats.totalPoisCovered} 个`);
    console.log(`  - 人均覆盖: ${influencerStats.avgPoiPerInfluencer} 个`);
    
    console.log(`\n${'='.repeat(60)}\n`);
  }
}

// ============ 主程序 ============

const crawler = new EnhancedCrawler();
await crawler.run();
