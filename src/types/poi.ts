export interface MediaLink {
  platform: '小红书' | '抖音' | '大众点评' | '其他';
  title: string;
  url: string;
}

export interface PoiProperties {
  id: string | number;
  name: string;
  city: string;
  cost: number;
  bookingMethod: string;
  mediaLinks: MediaLink[];
}

export interface PoiFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: PoiProperties;
}

export interface PoiFeatureCollection {
  type: 'FeatureCollection';
  features: PoiFeature[];
}

export interface FilterState {
  searchText: string;
  selectedCity: string | null;
  costRange: [number, number];
  bookingMethods: string[];
  viewportBbox: [number, number, number, number] | null;
  enableViewportFilter: boolean;
}
