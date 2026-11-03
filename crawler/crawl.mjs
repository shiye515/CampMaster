#!/usr/bin/env node
/**
 * crawl.mjs - 抖音 POI 爬虫命令行启动器
 * 
 * 简单易用的命令行入口，支持传参指定关键词、数量、目标城市与输出路径，
 * 自动调起 ego-browser 运行时执行抓取与数据清洗。
 * 
 * 使用示例：
 *   node crawl.mjs --keyword "杭州露营地" --limit 20
 *   node crawl.mjs -k "安吉露营" -n 50 -o ./anji_pois.geojson -c "湖州市"
 */

import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  keyword: '露营地',
  limit: 30,
  city: '',
  output: 'douyin_poi_results.geojson',
  poiOnly: true
};

function printHelp() {
  console.log(`
抖音带 POI 数据自动化爬虫 CLI (Powered by ego-browser)

用法:
  node crawl.mjs [选项]

选项:
  -k, --keyword <str>    搜索关键词 (默认: "露营地")
  -n, --limit <num>      采集有效条数 (默认: 30)
  -c, --city <str>       限定城市 (如 "杭州市"、"湖州市"，默认自动识别)
  -o, --output <file>    输出文件路径 (默认: "douyin_poi_results.geojson")
  --all                  抓取所有视频，不过滤是否含明确 POI (默认仅保留含 POI 的条目)
  -h, --help             查看帮助信息

示例:
  node crawl.mjs -k "杭州露营地" -n 20
  node crawl.mjs -k "莫干山露营" -n 30 -o ./moganshan.geojson
  node crawl.mjs -k "千岛湖水上露营" -c "杭州市" -n 15
`);
}

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '-k' || arg === '--keyword') {
    options.keyword = args[++i];
  } else if (arg === '-n' || arg === '--limit') {
    options.limit = parseInt(args[++i], 10);
  } else if (arg === '-c' || arg === '--city') {
    options.city = args[++i];
  } else if (arg === '-o' || arg === '--output') {
    options.output = args[++i];
  } else if (arg === '--all') {
    options.poiOnly = false;
  } else if (arg === '-h' || arg === '--help') {
    printHelp();
    process.exit(0);
  }
}

// 转换为绝对路径，以便传递给非当前工作区环境的 ego-browser
options.output = resolve(process.cwd(), options.output);

// 写入临时运行时配置至 /tmp/douyin_crawler_config.json
const configPath = '/tmp/douyin_crawler_config.json';
writeFileSync(configPath, JSON.stringify(options, null, 2), 'utf8');

const crawlerScriptPath = resolve(__dirname, 'douyin_poi_crawler.mjs');

console.log(`\n======================================================`);
console.log(`🚀 正在启动抖音 POI 爬虫任务...`);
console.log(`📌 搜索关键词 : ${options.keyword}`);
console.log(`🎯 目标采集量 : ${options.limit} 条`);
console.log(`🏙️ 限定城市   : ${options.city || '自动识别'}`);
console.log(`💾 输出路径   : ${options.output}`);
console.log(`======================================================\n`);

// 调起 ego-browser nodejs 执行爬虫
const child = spawn('ego-browser', ['nodejs', '<', crawlerScriptPath], {
  shell: true,
  stdio: 'inherit'
});

child.on('close', (code) => {
  if (existsSync(configPath)) {
    try { unlinkSync(configPath); } catch (_) {}
  }
  if (code === 0) {
    console.log(`✅ 爬取任务顺利完成！结果已存至: ${options.output}\n`);
  } else {
    console.error(`❌ 爬虫进程退出，状态码: ${code}\n`);
  }
  process.exit(code);
});
