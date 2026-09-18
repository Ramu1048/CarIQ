import api from './api';
import { Vehicle, VehicleSummary, Brand, VehicleFilters } from '../types';
import { MOCK_VEHICLES, MOCK_BRANDS } from './mockData';

export const vehicleService = {
  async getVehicles(filters?: VehicleFilters): Promise<{ items: VehicleSummary[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.brand_ids?.length) {
        filters.brand_ids.forEach((id) => params.append('brand_id', id));
      }
      if (filters?.fuel_types?.length) {
        filters.fuel_types.forEach((ft) => params.append('fuel_type', ft));
      }
      if (filters?.transmissions?.length) {
        filters.transmissions.forEach((tr) => params.append('transmission', tr));
      }
      if (filters?.body_types?.length) {
        filters.body_types.forEach((bt) => params.append('body_type', bt));
      }
      if (filters?.min_price) params.append('min_price', String(filters.min_price));
      if (filters?.max_price) params.append('max_price', String(filters.max_price));
      if (filters?.min_safety_rating) params.append('min_safety_rating', String(filters.min_safety_rating));
      if (filters?.seating_capacity) params.append('seating_capacity', String(filters.seating_capacity));
      if (filters?.has_sunroof !== undefined) params.append('has_sunroof', String(filters.has_sunroof));
      if (filters?.is_ev !== undefined) params.append('is_ev', String(filters.is_ev));
      if (filters?.sort_by) params.append('sort_by', filters.sort_by);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get(`/vehicles?${params.toString()}`);
      return {
        items: response.data.items || response.data,
        total: response.data.total ?? response.data.length ?? MOCK_VEHICLES.length,
      };
    } catch {
      // Fallback filter over mock data
      let filtered = [...MOCK_VEHICLES];
      if (filters?.fuel_types?.length) {
        filtered = filtered.filter((v) => filters.fuel_types!.includes(v.fuel_type));
      }
      if (filters?.body_types?.length) {
        filtered = filtered.filter((v) => filters.body_types!.includes(v.body_type));
      }
      if (filters?.max_price) {
        filtered = filtered.filter((v) => v.ex_showroom_price <= filters.max_price!);
      }
      if (filters?.min_safety_rating) {
        filtered = filtered.filter((v) => (v.safety_rating || 0) >= filters.min_safety_rating!);
      }
      if (filters?.search_query) {
        const q = filters.search_query.toLowerCase();
        filtered = filtered.filter((v) =>
          v.model_name.toLowerCase().includes(q) || v.brand.name.toLowerCase().includes(q)
        );
      }
      return { items: filtered, total: filtered.length };
    }
  },

  async getVehicleById(id: string): Promise<Vehicle> {
    try {
      const response = await api.get(`/vehicles/${id}`);
      return response.data;
    } catch {
      const match = MOCK_VEHICLES.find((v) => v.id === id);
      if (match) return match;
      return MOCK_VEHICLES[0];
    }
  },

  async getBrands(): Promise<Brand[]> {
    try {
      const response = await api.get('/brands');
      return response.data.items || response.data;
    } catch {
      return MOCK_BRANDS;
    }
  },
};
