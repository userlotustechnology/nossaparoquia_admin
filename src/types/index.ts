export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  photo_url: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  user: { name: string; email: string } | null;
  action: string;
  model_type: string | null;
  model_id: number | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Parish {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  pix_key: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  requires_link_approval: boolean;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  price_monthly: number;
  price_yearly: number;
  max_parishioners: number | null;
  max_families: number | null;
  max_events: number | null;
  max_campaigns: number | null;
  is_active: boolean;
  is_public: boolean;
  features: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}
