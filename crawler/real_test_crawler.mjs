#!/usr/bin/env node

/**
 * 真实抖音爬虫测试脚本
 * 使用 ego-browser 实际访问抖音并爬取数据
 * 
 * 用法:
 *   ego-browser nodejs < real_test_crawler.mjs
 * 或
 *   ego-browser nodejs -e "$(cat real_test_crawler.mjs)"
 */

const fs = await import('node:fs/promises');
const path = await import('node:path');

// 创建或恢复任务空间
const task = await taskSpace('douyin-poi-crawler-test');
console.log(`\n🚀 启动爬虫任务 (TaskSpace ID: ${task.spaceId})`);

const page = task.page('p1');

// 爬虫配置
const KEYWORDS = [
  '杭州露营',
  '临安露营',
  '杭州民宿',
  '杭州野营',
  '西湖露营'
];

const RESULTS_DIR = '/tmp/douyin_test_results';
const DATASET_FILE = path.join(RESULTS_DIR, `crawler_results_${Date.now()}.json`);

// 确保输出目录存在
await fs.mkdir(RESULTS_DIR, { recursive: true });

console.log(`📁 输出目录: ${RESULTS_DIR}`);
console.log(`💾 数据文件: ${DATASET_FILE}`);

// 数据收集器
const collectedPois = new Map();
const searchStats = {};

/**
 * 提取页面中的POI数据
 */
async function extractPoisFromPage() {
  const pois = await page.evaluate(() => {
    const items = [];
    
    // 尝试多种选择器来适应抖音的页面变化
    const selectors = [
      '[class*="video"]',
      '[class*="feed"]',
      'article',
      '[role="article"]'
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach((el) => {
          // 尝试提取文本内容
          const text = el.innerText || el.textContent || '';
          const link = el.querySelector('a')?.href || '';
          
          if (text.length > 10) {
            items.push({
              title: text.substring(0, 100).trim(),
              link: link,
              timestamp: new Date().toISOString()
            });
          }
        });
        break;
      }
    }
    
    return items.slice(0, 10); // 返回前10个
  });
  
  return pois;
}

/**
 * 搜索一个关键词
 */
async function searchKeyword(keyword) {
  console.log(`\n🔍 正在搜索: "${keyword}"`);
  
  try {
    // 访问抖音
    await page.goto('https://www.douyin.com/search', { timeout: 30000 });
    console.log('✅ 页面加载完成');
    
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    // 尝试找到搜索框
    const searchSelectors = [
      'input[placeholder*="搜索"]',
      'input[placeholder*="search"]',
      'input[type="search"]',
      '.search-input input'
    ];
    
    let searchInput = null;
    for (const sel of searchSelectors) {
      try {
        searchInput = await page.waitForSelector(sel, { timeout: 5000 });
        if (searchInput) break;
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }
    
    if (!searchInput) {
      console.log('⚠️  未找到搜索框，尝试直接访问搜索URL');
      const encodedKW = encodeURIComponent(keyword);
      await page.goto(`https://www.douyin.com/search?q=${encodedKW}`, { timeout: 30000 });
      await page.waitForTimeout(3000);
    } else {
      // 清空并输入关键词
      await page.fill('input[type="search"]', keyword);
      await page.press('input[type="search"]', 'Enter');
      console.log(`📝 已输入关键词: ${keyword}`);
      await page.waitForTimeout(3000);
    }
    
    // 提取数据
    const pois = await extractPoisFromPage();
    console.log(`✅ 提取了 ${pois.length} 条数据`);
    
    return {
      keyword,
      count: pois.length,
      items: pois,
      status: 'success'
    };
  } catch (error) {
    console.log(`❌ 搜索失败: ${error.message}`);
    return {
      keyword,
      count: 0,
      items: [],
      status: 'error',
      error: error.message
    };
  }
}

/**
 * 主爬虫逻辑
 */
async function runCrawler() {
  console.log(`\n📊 开始爬取 ${KEYWORDS.length} 个关键词`);
  console.log(`时间: ${new Date().toLocaleString()}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  const results = [];
  
  for (const keyword of KEYWORDS) {
    const result = await searchKeyword(keyword);
    results.push(result);
    
    // 统计结果
    if (result.status === 'success') {
      result.items.forEach(item => {
        const key = item.title.substring(0, 50);
        if (!collectedPois.has(key)) {
          collectedPois.set(key, item);
        }
      });
    }
    
    searchStats[keyword] = result.count;
    
    // 延迟以避免被限流
    await page.waitForTimeout(2000);
  }
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n✨ 爬取完成`);
  console.log(`\n📈 统计信息:`);
  console.log(`   总关键词数: ${KEYWORDS.length}`);
  console.log(`   总采集数: ${Object.values(searchStats).reduce((a, b) => a + b, 0)}`);
  console.log(`   去重后: ${collectedPois.size}`);
  console.log(`   关键词分布:`);
  
  Object.entries(searchStats).forEach(([kw, count]) => {
    console.log(`     • "${kw}": ${count} 条`);
  });
  
  // 保存结果
  const output = {
    timestamp: new Date().toISOString(),
    taskSpaceId: task.spaceId,
    totalKeywords: KEYWORDS.length,
    totalCollected: Object.values(searchStats).reduce((a, b) => a + b, 0),
    dedupedCount: collectedPois.size,
    stats: searchStats,
    results: results,
    pois: Array.from(collectedPois.values())
  };
  
  await fs.writeFile(DATASET_FILE, JSON.stringify(output, null, 2));
  console.log(`\n💾 结果已保存到: ${DATASET_FILE}`);
  
  return output;
}

// 执行爬虫
try {
  const output = await runCrawler();
  
  // 打印总结
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ 爬虫运行成功!`);
  console.log(`${'═'.repeat(50)}`);
  console.log(`\n📊 最终统计:`);
  console.log(`   采集地点数: ${output.dedupedCount}`);
  console.log(`   关键词覆盖: ${output.totalKeywords}`);
  console.log(`   平均每词: ${(output.totalCollected / output.totalKeywords).toFixed(1)} 条`);
  
} catch (error) {
  console.error(`\n❌ 爬虫执行失败:`, error);
  process.exit(1);
}

// 任务完成
await task.finish();
