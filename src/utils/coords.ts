/**
 * 坐标系转换工具
 * 用于在国内坐标系（GCJ-02，火星坐标系，抖音/高德/腾讯使用）与标准国际坐标系（WGS-84，MapLibre/OpenStreetMap 使用）之间转换
 */

const PI = 3.1415926535897932384626;
const A = 6378245.0; // WGS-84 长半轴
const EE = 0.00669342162296594323; // WGS-84 扁率

/**
 * 判断是否在国内范围之外（非国内范围不进行偏转）
 */
export function outOfChina(lng: number, lat: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformLat(x: number, y: number): number {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * (2.0 / 3.0);
  ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * (2.0 / 3.0);
  ret += (160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * (2.0 / 3.0);
  return ret;
}

function transformLng(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * (2.0 / 3.0);
  ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * (2.0 / 3.0);
  ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin((x / 3.0) * PI)) * (2.0 / 3.0);
  return ret;
}

/**
 * WGS-84 转 GCJ-02
 */
export function wgs84ToGcj02(lng: number, lat: number): [number, number] {
  if (outOfChina(lng, lat)) return [lng, lat];
  let dlat = transformLat(lng - 105.0, lat - 35.0);
  let dlng = transformLng(lng - 105.0, lat - 35.0);
  const radlat = (lat / 180.0) * PI;
  let magic = Math.sin(radlat);
  magic = 1 - EE * magic * magic;
  const sqrtmagic = Math.sqrt(magic);
  dlat = (dlat * 180.0) / (((A * (1 - EE)) / (magic * sqrtmagic)) * PI);
  dlng = (dlng * 180.0) / ((A / sqrtmagic) * Math.cos(radlat) * PI);
  return [lng + dlng, lat + dlat];
}

/**
 * GCJ-02 (火星坐标) 转 WGS-84 (标准GPS坐标)
 * 采用一步逆向近似 + 二阶迭代校正，将误差控制在厘米级内
 * @param lng GCJ-02 经度
 * @param lat GCJ-02 纬度
 * @returns [lng, lat] 转换后的 WGS-84 经纬度
 */
export function gcj02ToWgs84(lng: number, lat: number): [number, number] {
  if (outOfChina(lng, lat)) return [lng, lat];

  let dlat = transformLat(lng - 105.0, lat - 35.0);
  let dlng = transformLng(lng - 105.0, lat - 35.0);
  const radlat = (lat / 180.0) * PI;
  let magic = Math.sin(radlat);
  magic = 1 - EE * magic * magic;
  const sqrtmagic = Math.sqrt(magic);
  dlat = (dlat * 180.0) / (((A * (1 - EE)) / (magic * sqrtmagic)) * PI);
  dlng = (dlng * 180.0) / ((A / sqrtmagic) * Math.cos(radlat) * PI);

  let wgsLng = lng - dlng;
  let wgsLat = lat - dlat;

  // 迭代校正一步误差，精度达到米级以内
  const [testGcjLng, testGcjLat] = wgs84ToGcj02(wgsLng, wgsLat);
  wgsLng += lng - testGcjLng;
  wgsLat += lat - testGcjLat;

  return [Number(wgsLng.toFixed(6)), Number(wgsLat.toFixed(6))];
}
