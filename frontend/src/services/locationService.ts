import api from './api';
import { ServiceCenter } from '../types';
import { MOCK_SERVICE_CENTERS } from './mockData';

export const locationService = {
  async getServiceCenters(params?: { city?: string; brand?: string; user_lat?: number; user_lng?: number }): Promise<ServiceCenter[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.city) searchParams.append('city', params.city);
      if (params?.brand) searchParams.append('brand', params.brand);
      if (params?.user_lat) searchParams.append('user_lat', String(params.user_lat));
      if (params?.user_lng) searchParams.append('user_lng', String(params.user_lng));

      const response = await api.get(`/locations/service-centers?${searchParams.toString()}`);
      return response.data;
    } catch {
      let filtered = [...MOCK_SERVICE_CENTERS];
      if (params?.city) {
        filtered = filtered.filter((sc) => sc.city.toLowerCase().includes(params.city!.toLowerCase()));
      }
      if (params?.brand) {
        filtered = filtered.filter((sc) => sc.brand.toLowerCase().includes(params.brand!.toLowerCase()));
      }
      return filtered;
    }
  },
};
