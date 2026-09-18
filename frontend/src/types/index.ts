// CarIQ Frontend Types Definition

export type UserRole = 'customer' | 'dealer' | 'admin';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  location_city?: string;
  location_state?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  country_of_origin?: string;
  founded_year?: number;
  logo_url?: string;
  is_active: boolean;
  vehicle_count?: number;
}

export interface Variant {
  id: string;
  vehicle_id: string;
  name: string;
  slug: string;
  price_difference: number;
  ex_showroom_price: number;
  key_features: string[];
  is_base_variant: boolean;
  is_top_variant: boolean;
}

export interface VehicleImage {
  id: string;
  url: string;
  caption?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface VehicleSummary {
  id: string;
  model_name: string;
  slug: string;
  body_type: string;
  fuel_type: string;
  transmission: string;
  ex_showroom_price: number;
  on_road_price_approx?: number;
  mileage_kmpl?: number;
  seating_capacity: number;
  safety_rating?: number;
  has_sunroof: boolean;
  ev_range_km?: number;
  popularity_score: number;
  brand: Brand;
  primary_image_url?: string;
  created_at: string;
}

export interface Vehicle extends VehicleSummary {
  description?: string;
  engine_cc?: number;
  horsepower?: number;
  torque_nm?: number;
  fuel_tank_capacity_litres?: number;
  battery_capacity_kwh?: number;
  ground_clearance_mm?: number;
  boot_space_litres?: number;
  warranty_years?: number;
  warranty_km?: number;
  service_interval_km?: number;
  images: VehicleImage[];
  variants: Variant[];
  features: string[];
  safety_features: string[];
  is_active: boolean;
}

export interface VehicleFilters {
  brand_ids?: string[];
  fuel_types?: string[];
  transmissions?: string[];
  body_types?: string[];
  min_price?: number;
  max_price?: number;
  min_mileage?: number;
  min_safety_rating?: number;
  seating_capacity?: number;
  has_sunroof?: boolean;
  is_ev?: boolean;
  search_query?: string;
  sort_by?: 'popularity' | 'price_asc' | 'price_desc' | 'mileage' | 'safety';
  page?: number;
  page_size?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIChatResponse {
  reply: string;
  conversation_history: ChatMessage[];
  referenced_vehicles?: VehicleSummary[];
  ai_provider_used: string;
}

export interface RecommendationItem {
  vehicle: VehicleSummary;
  match_score: number;
  reasons: string[];
  limitations: string[];
  confidence_score: number;
  variant_recommendation?: string;
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[];
  identified_priorities: string[];
  interpreted_budget_max?: number;
  interpreted_budget_min?: number;
  total_matches_found: number;
  summary: string;
  ai_provider_used: string;
}

export interface AISearchResponse {
  query: string;
  interpreted_preferences: Record<string, any>;
  results: VehicleSummary[];
  summary: string;
  total: number;
}

export interface AICompareResponse {
  vehicles: VehicleSummary[];
  ai_verdict: string;
  winner_by_category: Record<string, string>;
  key_tradeoffs: string[];
  best_for: Record<string, string>;
}

export interface AmortizationScheduleItem {
  month: number;
  beginning_balance: number;
  emi: number;
  principal: number;
  interest: number;
  ending_balance: number;
  year: number;
}

export interface EMICalculationResponse {
  vehicle_price: number;
  down_payment: number;
  loan_amount: number;
  interest_rate: number;
  tenure_months: number;
  monthly_emi: number;
  total_interest: number;
  total_payment: number;
  amortization_schedule: AmortizationScheduleItem[];
}

export interface AffordabilityResponse {
  monthly_budget: number;
  max_affordable_emi: number;
  max_loan_amount: number;
  recommended_vehicle_price_range: {
    min: number;
    max: number;
  };
  assumed_interest_rate: number;
  assumed_tenure_months: number;
  down_payment_assumed: number;
}

export type PurchaseStatus =
  | 'initiated'
  | 'details_pending'
  | 'documents_pending'
  | 'finance_pending'
  | 'payment_pending'
  | 'booked'
  | 'processing'
  | 'completed'
  | 'cancelled';

export interface Purchase {
  id: string;
  reference_number: string;
  customer_id: string;
  vehicle_id: string;
  variant_id?: string;
  status: PurchaseStatus;
  agreed_price: number;
  booking_amount?: number;
  discount_amount: number;
  is_financed: boolean;
  loan_amount?: number;
  down_payment?: number;
  interest_rate?: number;
  loan_tenure_months?: number;
  monthly_emi?: number;
  customer_address?: string;
  delivery_pincode?: string;
  vehicle?: VehicleSummary;
  created_at: string;
  updated_at?: string;
}

export interface ServiceCenter {
  id: string;
  name: string;
  brand: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: float;
  longitude: float;
  phone: string;
  email: string;
  opening_hours: string;
  rating: number;
  services: string[];
  distance_km?: number;
}

type float = number;

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  timestamp: string;
}

export interface AdminDashboardData {
  total_users: number;
  total_vehicles: number;
  total_purchases: number;
  total_revenue: number;
  recent_purchases: Purchase[];
}
