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
  bookingMethodsList: string[];

  // 空间索引与视口
  spatialIndex: SpatialIndex;

  // 操作
  loadFeatures: (features: PoiFeatureCollection) => void;
  setSearchText: (text: string) => void;
  setSelectedCity: (city: string | null) => void;
  setCostRange: (range: [number, number]) => void;
  toggleBookingMethod: (method: string) => void;
  setBookingMethods: (methods: string[]) => void;
  setViewportBbox: (bbox: [number, number, number, number] | null) => void;
  setEnableViewportFilter: (enabled: boolean) => void;
  setActivePoi: (id: string | number | null) => void;
  clearFilters: () => void;
  applyFilters: () => void;
}

const initialFilterState: FilterState = {
  searchText: '',
  selectedCity: null,
  costRange: [0, 10000],
  bookingMethods: [],
  viewportBbox: null,
  enableViewportFilter: false,
};

export const usePoiStore = create<PoiStoreState>((set) => ({
  ...initialFilterState,
  allFeatures: [],
  filteredFeatures: [],
  activePoi: null,
  citiesList: [],
  bookingMethodsList: [],
  spatialIndex: new SpatialIndex(),

  loadFeatures: (data: PoiFeatureCollection) => {
    set(() => {
      const features = data.features;
      const citiesList = Array.from(
        new Set(features.map((f) => f.properties.city))
      ).sort();
      const bookingMethodsList = Array.from(
        new Set(features.map((f) => f.properties.bookingMethod))
      ).sort();

      const spatialIndex = new SpatialIndex();
      spatialIndex.buildFromFeatures(features);

      return {
        allFeatures: features,
        filteredFeatures: features,
        citiesList,
        bookingMethodsList,
        spatialIndex,
      };
    });
  },

  setSearchText: (text: string) => {
    set({ searchText: text });
  },

  setSelectedCity: (city: string | null) => {
    set({ selectedCity: city });
  },

  setCostRange: (range: [number, number]) => {
    set({ costRange: range });
  },

  toggleBookingMethod: (method: string) => {
    set((state) => {
      const methods = state.bookingMethods.includes(method)
        ? state.bookingMethods.filter((m) => m !== method)
        : [...state.bookingMethods, method];
      return { bookingMethods: methods };
    });
  },

  setBookingMethods: (methods: string[]) => {
    set({ bookingMethods: methods });
  },

  setViewportBbox: (bbox: [number, number, number, number] | null) => {
    set({ viewportBbox: bbox });
  },

  setEnableViewportFilter: (enabled: boolean) => {
    set({ enableViewportFilter: enabled });
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

      // 1. 搜索文本过滤
      if (state.searchText.trim()) {
        const query = state.searchText.toLowerCase();
        filtered = filtered.filter((f) => {
          const { name, city, bookingMethod } = f.properties;
          return (
            name.toLowerCase().includes(query) ||
            city.toLowerCase().includes(query) ||
            bookingMethod.toLowerCase().includes(query)
          );
        });
      }

      // 2. 城市过滤
      if (state.selectedCity && state.selectedCity !== '全部城市') {
        filtered = filtered.filter((f) => f.properties.city === state.selectedCity);
      }

      // 3. 费用范围过滤
      const [minCost, maxCost] = state.costRange;
      filtered = filtered.filter(
        (f) => f.properties.cost >= minCost && f.properties.cost <= maxCost
      );

      // 4. 下单方式过滤
      if (state.bookingMethods.length > 0) {
        filtered = filtered.filter((f) =>
          state.bookingMethods.some((method) =>
            f.properties.bookingMethod.includes(method)
          )
        );
      }

      // 5. 视口范围过滤
      if (state.enableViewportFilter && state.viewportBbox) {
        const visibleIds = state.spatialIndex.searchBbox(state.viewportBbox);
        const visibleSet = new Set(visibleIds);
        filtered = filtered.filter((f) => visibleSet.has(f.properties.id));
      }

      return { filteredFeatures: filtered };
    });
  },
}));
