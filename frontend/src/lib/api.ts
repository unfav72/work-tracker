const API_BASE = 'http://localhost:8000/api/v1';

// Token management
let accessToken: string | null = localStorage.getItem('access_token');

export function setToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
}

export function getToken() {
  return accessToken;
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setToken(null);
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();
    setToken(data.access_token);
    return data;
  },

  register: async (email: string, password: string, timezone?: string) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Registration failed');
    }

    return response.json();
  },

  me: () => apiFetch('/auth/me'),
  
  updateMe: (data: { 
    timezone?: string; 
    theme?: string;
    digest_enabled?: boolean;
    digest_time?: string;
    quiet_start?: string;
    quiet_end?: string;
    reminder_email?: string;
  }) => 
    apiFetch('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),

  logout: () => {
    setToken(null);
  },
};

// Works API
export const worksApi = {
  list: (skip = 0, limit = 100) => apiFetch(`/works/?skip=${skip}&limit=${limit}`),

  get: (id: string) => apiFetch(`/works/${id}`),

  create: (data: {
    title: string;
    description?: string;
    priority?: string;
    color?: string;
    recurrence_type?: string;
    recurrence_config?: Record<string, unknown>;
    time_of_day?: string;
    start_date: string;
    end_date?: string;
    reminder_offset_minutes?: number;
    reminder_enabled?: boolean;
  }) => apiFetch('/works/', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, unknown>) =>
    apiFetch(`/works/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  archive: (id: string) =>
    apiFetch(`/works/${id}/archive`, { method: 'POST' }),
};

// Logs API
export const logsApi = {
  createOrUpdate: (data: { work_id: string; date: string; status: string }) =>
    apiFetch('/logs/', { method: 'POST', body: JSON.stringify(data) }),

  getToday: () => apiFetch('/logs/today'),
};

// Stats API
export const statsApi = {
  summary: () => apiFetch('/stats/summary'),
};

// Types
export interface Work {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category_id?: string;
  priority: string;
  color?: string;
  recurrence_type: string;
  recurrence_config?: Record<string, unknown>;
  time_of_day?: string;
  start_date: string;
  end_date?: string;
  reminder_offset_minutes?: number;
  reminder_enabled: boolean;
  is_archived: boolean;
  created_at: string;
}

export interface WorkLog {
  id: string;
  work_id: string;
  date: string;
  status: string;
  completed_at?: string;
  snoozed_until?: string;
}

export interface User {
  id: string;
  email: string;
  timezone: string;
  theme: string;
  digest_enabled: boolean;
  digest_time?: string;
  quiet_start?: string;
  quiet_end?: string;
  reminder_email?: string;
  is_verified: boolean;
  created_at: string;
}

export interface StatsSummary {
  total_active_works: number;
  completed_today: number;
}
