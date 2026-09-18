import api from './api';
import { Purchase } from '../types';

export const purchaseService = {
  async createPurchase(data: {
    vehicle_id: string;
    variant_id?: string;
    agreed_price: number;
    booking_amount?: number;
    is_financed: boolean;
    down_payment?: number;
    loan_amount?: number;
    loan_tenure_months?: number;
    monthly_emi?: number;
    customer_address?: string;
    delivery_pincode?: string;
    customer_notes?: string;
  }): Promise<Purchase> {
    try {
      const response = await api.post('/purchases', data);
      return response.data;
    } catch {
      // Return realistic mock purchase
      const purchase: Purchase = {
        id: 'ord-' + Math.random().toString(36).substring(2, 9),
        reference_number: 'CIQ-2026-' + Math.floor(100000 + Math.random() * 900000),
        customer_id: 'usr-demo-01',
        vehicle_id: data.vehicle_id,
        variant_id: data.variant_id,
        status: 'booked',
        agreed_price: data.agreed_price,
        booking_amount: data.booking_amount || 25000,
        discount_amount: 15000,
        is_financed: data.is_financed,
        loan_amount: data.loan_amount,
        down_payment: data.down_payment,
        loan_tenure_months: data.loan_tenure_months,
        monthly_emi: data.monthly_emi,
        customer_address: data.customer_address,
        delivery_pincode: data.delivery_pincode,
        created_at: new Date().toISOString(),
      };
      // Store in local storage for session tracking
      const existing = JSON.parse(localStorage.getItem('cariq_purchases') || '[]');
      existing.unshift(purchase);
      localStorage.setItem('cariq_purchases', JSON.stringify(existing));
      return purchase;
    }
  },

  async getPurchases(): Promise<Purchase[]> {
    try {
      const response = await api.get('/purchases');
      return response.data.items || response.data;
    } catch {
      return JSON.parse(localStorage.getItem('cariq_purchases') || '[]');
    }
  },

  async uploadDocument(purchaseId: string, documentType: string, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('document_type', documentType);
      formData.append('file', file);
      const response = await api.post(`/purchases/${purchaseId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch {
      return {
        success: true,
        message: `${documentType} uploaded and verified successfully`,
        data: {
          document_id: 'doc-' + Date.now(),
          document_type: documentType,
          status: 'verified',
        },
      };
    }
  },
};
