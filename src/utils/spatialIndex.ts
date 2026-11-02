import RBush from 'rbush';
import type { PoiFeature } from '../types/poi';

export interface BboxItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  featureId: string | number;
}

/**
 * 创建 RBush 空间索引，支持毫秒级视口范围过滤
 */
export class SpatialIndex {
  private tree: RBush<BboxItem>;

  constructor() {
    this.tree = new RBush<BboxItem>(9);
  }

  /**
   * 从 GeoJSON Feature 数组构建索引
   */
  buildFromFeatures(features: PoiFeature[]): void {
    const items: BboxItem[] = features
      .filter((f) => {
        const [lng, lat] = f.geometry.coordinates;
        return isValidCoordinate(lng, lat);
      })
      .map((f) => {
        const [lng, lat] = f.geometry.coordinates;
        return {
          minX: lng,
          minY: lat,
          maxX: lng,
          maxY: lat,
          featureId: f.properties.id,
        };
      });

    this.tree.clear();
    this.tree.load(items);
  }

  /**
   * 查询包含在指定 Bbox 内的所有 POI ID
   * @param bbox [west, south, east, north] - [minLng, minLat, maxLng, maxLat]
   */
  searchBbox(bbox: [number, number, number, number]): (string | number)[] {
    const [west, south, east, north] = bbox;
    const results = this.tree.search({
      minX: west,
      minY: south,
      maxX: east,
      maxY: north,
    } as BboxItem);

    return results.map((item) => item.featureId);
  }

  /**
   * 查询以指定点为中心、半径为 R 的圆形区域内的 POI（使用方形近似）
   * @param lng 中心经度
   * @param lat 中心纬度
   * @param radiusKm 半径（公里）
   */
  searchRadius(lng: number, lat: number, radiusKm: number): (string | number)[] {
    const latDelta = radiusKm / 111; // 1 度纬度 ≈ 111 km
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    return this.searchBbox([
      lng - lngDelta,
      lat - latDelta,
      lng + lngDelta,
      lat + latDelta,
    ]);
  }

  /**
   * 获取索引中所有 POI 的边界框
   */
  getBounds(): [number, number, number, number] {
    const data = this.tree.toJSON().children ?? [];
    if (data.length === 0) return [0, 0, 0, 0];

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const item of data) {
      minX = Math.min(minX, item.minX);
      minY = Math.min(minY, item.minY);
      maxX = Math.max(maxX, item.maxX);
      maxY = Math.max(maxY, item.maxY);
    }

    return [minX, minY, maxX, maxY];
  }

  clear(): void {
    this.tree.clear();
  }
}

/**
 * 验证坐标的有效性（WGS84）
 */
export function isValidCoordinate(lng: number, lat: number): boolean {
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}
