import { create } from 'zustand';
import type {
  PoiFeature,
  PoiFeatureCollection,
  FilterState,
} from '../types/poi';
import { SpatialIndex } from '../utils/spatialIndex';

interface PoiStoreState extends FilterState {
  // 原始数据
  allFeatures: PoiFeature[];
  filteredFeatures: PoiFeature[];
  activePoi: (string | number) | null;

  // 派生数据
  citiesList: string[];
  isLoadingCityData: boolean;

  // 空间索引与视口
  spatialIndex: SpatialIndex;

  // 操作
  loadCitiesList: (cities: string[]) => void;
  loadCityFeatures: (features: PoiFeatureCollection) => void;
  setSelectedCity: (city: string | null) => void;
  setCostRange: (range: [number, number]) => void;
  setActivePoi: (id: string | number | null) => void;
  clearFilters: () => void;
  applyFilters: () => void;
}

const initialFilterState: FilterState = {
  selectedCity: null,
  costRange: [0, 10000],
};

export const usePoiStore = create<PoiStoreState>((set) => ({
  ...initialFilterState,
  allFeatures: [],
  filteredFeatures: [],
  activePoi: null,
  citiesList: [],
  isLoadingCityData: false,
  spatialIndex: new SpatialIndex(),

  loadCitiesList: (cities: string[]) => {
    set({
      citiesList: cities.sort(),
      // 自动选择第一个城市
      selectedCity: cities.length > 0 ? cities[0] : null,
    });
  },

  loadCityFeatures: (data: PoiFeatureCollection) => {
    set(() => {
      const features = data.features;

      const spatialIndex = new SpatialIndex();
      spatialIndex.buildFromFeatures(features);

      return {
        allFeatures: features,
        filteredFeatures: features,
        spatialIndex,
        isLoadingCityData: false,
      };
    });
  },

  setSelectedCity: (city: string | null) => {
    set({ 
      selectedCity: city,
      isLoadingCityData: city !== null,
    });
  },

  setCostRange: (range: [number, number]) => {
    set({ costRange: range });
  },

  setActivePoi: (id: string | number | null) => {
    set({ activePoi: id });
  },

  clearFilters: () => {
    set({
      ...initialFilterState,
      activePoi: null,
    });
  },

  applyFilters: () => {
    set((state) => {
      let filtered = [...state.allFeatures];

      // 费用范围过滤
      const [minCost, maxCost] = state.costRange;
      filtered = filtered.filter(
        (f) => f.properties.cost >= minCost && f.properties.cost <= maxCost
      );

      return { filteredFeatures: filtered };
    });
  },
}));
