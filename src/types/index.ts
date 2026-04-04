export interface User {
  id: string;
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
  isImpersonating: boolean;
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

export interface ObservabilityOverview {
  application: {
    env: string;
    debug: boolean;
    php: string;
    laravel: string;
  };
  observability: {
    log_all_api_requests: boolean;
    slow_request_log_ms: number;
    request_correlation_header: string;
  };
  health: {
    database_reachable: boolean;
  };
  queue: {
    driver: string;
    failed_jobs: number | null;
    pending_jobs: number | null;
  };
  cache: {
    store: string;
  };
  pulse: {
    enabled: boolean;
    dashboard: boolean;
    dashboard_path: string;
    dashboard_url: string | null;
    tables_present: boolean;
    ingest_worker: string;
    spa_note: string;
  };
  pulse_samples_24h: {
    slow_requests: Array<{
      method: string | null;
      path: string | null;
      via: string | null;
      duration_ms: number;
      at: string;
    }>;
    slow_queries: Array<{
      summary: string;
      duration_ms: number;
      at: string;
    }>;
  };
}

export interface Parish {
  id: number;
  uuid: string;
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
