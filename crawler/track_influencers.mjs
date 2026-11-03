#!/usr/bin/env node

/**
 * track_influencers.mjs
 * 
 * 博主追踪管理工具 - 管理已发现的高质量露营博主
 * 
 * 用法：
 *   node track_influencers.mjs --list              # 列出所有追踪的博主
 *   node track_influencers.mjs --add <uid> <name>  # 手动添加博主
 *   node track_influencers.mjs --remove <uid>      # 删除博主
 *   node track_influencers.mjs --stats             # 显示统计信息
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const INFLUENCER_DB = '/tmp/influencer_database.json';

class InfluencerDB {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.data = this.load();
  }
  
  load() {
    if (!existsSync(this.dbPath)) {
      return {
        influencers: [],
        metadata: {
          version: '1.0',
          created: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }
      };
    }
    
    try {
      return JSON.parse(readFileSync(this.dbPath, 'utf8'));
    } catch (e) {
      console.error('❌ 无法读取数据库:', e.message);
      return { influencers: [], metadata: {} };
    }
  }
  
  save() {
    const dir = dirname(this.dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    this.data.metadata.lastUpdated = new Date().toISOString();
    writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
  }
  
  addInfluencer(uid, name, avatar = '', category = 'general') {
    const existing = this.data.influencers.find(i => i.uid === uid);
    
    if (existing) {
      existing.lastUpdate = new Date().toISOString();
      existing.poiCount = (existing.poiCount || 0) + 1;
      console.log(`✓ 更新博主: ${name} (POI数: ${existing.poiCount})`);
    } else {
      this.data.influencers.push({
        uid,
        name,
        avatar,
        category,
        poiCount: 1,
        videoCount: 0,
        addedAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        followerCount: 0,
        status: 'active'
      });
      console.log(`✓ 新增博主: ${name}`);
    }
    
    this.save();
  }
  
  removeInfluencer(uid) {
    const index = this.data.influencers.findIndex(i => i.uid === uid);
    if (index >= 0) {
      const name = this.data.influencers[index].name;
      this.data.influencers.splice(index, 1);
      this.save();
      console.log(`✓ 删除博主: ${name}`);
      return true;
    }
    console.log(`❌ 未找到博主 UID: ${uid}`);
    return false;
  }
  
  listInfluencers(limit = null) {
    const sorted = this.data.influencers.sort((a, b) => b.poiCount - a.poiCount);
    const list = limit ? sorted.slice(0, limit) : sorted;
    
    if (list.length === 0) {
      console.log('暂无数据');
      return;
    }
    
    console.log(`\n已追踪博主 (${list.length}/${this.data.influencers.length}):\n`);
    list.forEach((inf, i) => {
      console.log(`${i + 1}. ${inf.name}`);
      console.log(`   ├─ UID: ${inf.uid}`);
      console.log(`   ├─ POI数: ${inf.poiCount}`);
      console.log(`   ├─ 分类: ${inf.category}`);
      console.log(`   ├─ 状态: ${inf.status}`);
      console.log(`   └─ 更新: ${new Date(inf.lastUpdate).toLocaleDateString('zh-CN')}`);
    });
  }
  
  getStats() {
    const stats = {
      totalInfluencers: this.data.influencers.length,
      totalPois: this.data.influencers.reduce((sum, i) => sum + i.poiCount, 0),
      byCategory: {},
      avgPoisPerInfluencer: 0
    };
    
    this.data.influencers.forEach(inf => {
      const cat = inf.category || 'unknown';
      stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
    });
    
    if (stats.totalInfluencers > 0) {
      stats.avgPoisPerInfluencer = (stats.totalPois / stats.totalInfluencers).toFixed(2);
    }
    
    return stats;
  }
  
  printStats() {
    const stats = this.getStats();
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 博主库统计\n');
    console.log(`总博主数: ${stats.totalInfluencers}`);
    console.log(`总 POI 覆盖: ${stats.totalPois}`);
    console.log(`人均 POI: ${stats.avgPoisPerInfluencer}`);
    console.log(`\n按分类:`);
    Object.entries(stats.byCategory).forEach(([cat, count]) => {
      console.log(`  • ${cat}: ${count} 位`);
    });
    console.log(`\n${'='.repeat(60)}\n`);
  }
}

// ============ 命令处理 ============

const args = process.argv.slice(2);
const db = new InfluencerDB(INFLUENCER_DB);

if (args.length === 0) {
  console.log(`
用法:
  node track_influencers.mjs --list              # 列出所有博主
  node track_influencers.mjs --add <uid> <name>  # 添加博主
  node track_influencers.mjs --remove <uid>      # 删除博主
  node track_influencers.mjs --stats             # 统计信息
  node track_influencers.mjs --export             # 导出数据
`);
  process.exit(0);
}

const cmd = args[0];

switch (cmd) {
  case '--list':
    db.listInfluencers(20);
    break;
    
  case '--add':
    if (args.length < 3) {
      console.log('❌ 用法: --add <uid> <name> [category]');
      process.exit(1);
    }
    db.addInfluencer(args[1], args[2], '', args[3] || 'general');
    break;
    
  case '--remove':
    if (args.length < 2) {
      console.log('❌ 用法: --remove <uid>');
      process.exit(1);
    }
    db.removeInfluencer(args[1]);
    break;
    
  case '--stats':
    db.printStats();
    break;
    
  case '--export':
    const exportPath = args[1] || '/tmp/influencers_export.json';
    writeFileSync(exportPath, JSON.stringify(db.data, null, 2), 'utf8');
    console.log(`✓ 已导出至: ${exportPath}`);
    break;
    
  default:
    console.log(`❌ 未知命令: ${cmd}`);
    process.exit(1);
}
