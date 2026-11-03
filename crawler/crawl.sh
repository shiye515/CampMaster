#!/usr/bin/env bash
# crawl.sh - 抖音 POI 爬虫快捷执行脚本

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$DIR/crawl.mjs" "$@"
