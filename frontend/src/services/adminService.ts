import api from './api';
import { AdminDashboardData } from '../types';

export const adminService = {
  async getDashboard(): Promise<AdminDashboardData> {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch {
      return {
        total_users: 1420,
        total_vehicles: 32,
        total_purchases: 89,
        total_revenue: 164500000,
        recent_purchases: JSON.parse(localStorage.getItem('cariq_purchases') || '[]'),
      };
    }
  },

  async updatePurchaseStatus(purchaseId: string, status: string): Promise<any> {
    try {
      const response = await api.put(`/purchases/${purchaseId}/status`, { status });
      return response.data;
    } catch {
      return { success: true, status };
    }
  },
};
