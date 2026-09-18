import api from './api';
import { EMICalculationResponse, AmortizationScheduleItem, AffordabilityResponse } from '../types';

export const financeService = {
  async calculateEMI(params: {
    vehicle_price: number;
    down_payment: number;
    interest_rate: number;
    tenure_months: number;
  }): Promise<EMICalculationResponse> {
    try {
      const response = await api.post('/finance/emi', params);
      return response.data;
    } catch {
      // Local mathematical calculation of EMI & Amortization
      const principal = Math.max(0, params.vehicle_price - params.down_payment);
      const monthlyRate = params.interest_rate / 12 / 100;
      const n = params.tenure_months;

      let monthlyEmi = 0;
      if (monthlyRate === 0) {
        monthlyEmi = principal / n;
      } else {
        monthlyEmi = (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
      }

      const totalPayment = monthlyEmi * n;
      const totalInterest = Math.max(0, totalPayment - principal);

      // Amortization schedule
      const schedule: AmortizationScheduleItem[] = [];
      let balance = principal;
      for (let m = 1; m <= n; m++) {
        const interestM = balance * monthlyRate;
        const principalM = monthlyEmi - interestM;
        balance = Math.max(0, balance - principalM);
        schedule.push({
          month: m,
          beginning_balance: Math.round(balance + principalM),
          emi: Math.round(monthlyEmi),
          principal: Math.round(principalM),
          interest: Math.round(interestM),
          ending_balance: Math.round(balance),
          year: Math.ceil(m / 12),
        });
      }

      return {
        vehicle_price: params.vehicle_price,
        down_payment: params.down_payment,
        loan_amount: principal,
        interest_rate: params.interest_rate,
        tenure_months: params.tenure_months,
        monthly_emi: Math.round(monthlyEmi),
        total_interest: Math.round(totalInterest),
        total_payment: Math.round(totalPayment),
        amortization_schedule: schedule,
      };
    }
  },

  async calculateAffordability(monthlyBudget: number): Promise<AffordabilityResponse> {
    try {
      const response = await api.post('/finance/affordability', { monthly_budget: monthlyBudget });
      return response.data;
    } catch {
      const maxEmi = monthlyBudget * 0.8;
      const r = 0.085 / 12;
      const n = 60;
      const loan = (maxEmi * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
      const downPayment = loan * 0.2;
      const vehiclePrice = loan + downPayment;

      return {
        monthly_budget: monthlyBudget,
        max_affordable_emi: Math.round(maxEmi),
        max_loan_amount: Math.round(loan),
        recommended_vehicle_price_range: {
          min: Math.round(vehiclePrice * 0.8),
          max: Math.round(vehiclePrice * 1.15),
        },
        assumed_interest_rate: 8.5,
        assumed_tenure_months: 60,
        down_payment_assumed: Math.round(downPayment),
      };
    }
  },
};
