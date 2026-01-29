import type {
  User,
  ToolSchema,
  PaginatedResponse,
  AuditLog,
  RecordQueryInput,
} from '@toolforge/shared';

const API_BASE = '/api';

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Skip token refresh for auth endpoints - they handle their own auth
  const isAuthEndpoint = endpoint.startsWith('/auth/');

  if (response.status === 401 && !isAuthEndpoint) {
    // Try to refresh token
    const refreshed = await refreshTokens();
    if (refreshed) {
      // Retry request with new token
      headers['Authorization'] = `Bearer ${accessToken}`;
      const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({ message: 'Request failed' }));
        throw new ApiError(retryResponse.status, error.message, error.details);
      }

      return retryResponse.json();
    }

    // Refresh failed, clear token
    setAccessToken(null);
    throw new ApiError(401, 'Session expired');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message, error.details);
  }

  // Handle empty response
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function refreshTokens(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; accessToken: string }> {
    const data = await request<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(data.accessToken);
    return data;
  },

  async logout(): Promise<void> {
    await request('/auth/logout', { method: 'POST' });
    setAccessToken(null);
  },

  async refresh(): Promise<{ user: User; accessToken: string }> {
    const data = await request<{ user: User; accessToken: string }>('/auth/refresh', {
      method: 'POST',
    });
    setAccessToken(data.accessToken);
    return data;
  },

  async me(): Promise<{ user: User }> {
    return request('/auth/me');
  },
};

// Schema API
export const schemaApi = {
  async getAll(): Promise<{ data: ToolSchema[] }> {
    return request('/schemas');
  },

  async getById(id: string): Promise<ToolSchema> {
    return request(`/schemas/${id}`);
  },

  async getByToolId(toolId: string): Promise<ToolSchema> {
    return request(`/schemas/tool/${toolId}`);
  },

  async create(schema: Partial<ToolSchema>): Promise<ToolSchema> {
    return request('/schemas', {
      method: 'POST',
      body: JSON.stringify(schema),
    });
  },

  async update(id: string, schema: Partial<ToolSchema>): Promise<ToolSchema> {
    return request(`/schemas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(schema),
    });
  },

  async publish(id: string): Promise<ToolSchema> {
    return request(`/schemas/${id}/publish`, { method: 'POST' });
  },

  async unpublish(id: string): Promise<ToolSchema> {
    return request(`/schemas/${id}/unpublish`, { method: 'POST' });
  },

  async delete(id: string): Promise<void> {
    await request(`/schemas/${id}`, { method: 'DELETE' });
  },

  async validate(schema: unknown): Promise<{ valid: boolean; errors?: string[] }> {
    return request('/schemas/validate', {
      method: 'POST',
      body: JSON.stringify(schema),
    });
  },
};

// Records API
export const recordsApi = {
  async query(
    toolId: string,
    query: RecordQueryInput
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.page) params.set('page', String(query.page));
    if (query.pageSize) params.set('pageSize', String(query.pageSize));
    if (query.sort) {
      params.set('sort', query.sort.field);
      params.set('sortDir', query.sort.direction);
    }
    if (query.filters) {
      for (const filter of query.filters) {
        params.set(filter.field, String(filter.value));
      }
    }

    return request(`/tools/${toolId}/records?${params.toString()}`);
  },

  async getById(toolId: string, recordId: string): Promise<Record<string, unknown>> {
    return request(`/tools/${toolId}/records/${recordId}`);
  },

  async create(toolId: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    return request(`/tools/${toolId}/records`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(
    toolId: string,
    recordId: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return request(`/tools/${toolId}/records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(toolId: string, recordId: string): Promise<void> {
    await request(`/tools/${toolId}/records/${recordId}`, { method: 'DELETE' });
  },

  async bulkUpdate(
    toolId: string,
    recordIds: string[],
    field: string,
    value: unknown
  ): Promise<{ updated: number }> {
    return request(`/tools/${toolId}/records/bulk`, {
      method: 'POST',
      body: JSON.stringify({ recordIds, field, value }),
    });
  },

  async executeAction(
    toolId: string,
    actionId: string,
    recordIds: string[],
    params?: Record<string, unknown>
  ): Promise<{ success: boolean; affected?: number; message?: string }> {
    return request(`/tools/${toolId}/actions/${actionId}`, {
      method: 'POST',
      body: JSON.stringify({ recordIds, params }),
    });
  },
};

// Audit API
export const auditApi = {
  async query(
    toolId: string,
    params: {
      recordId?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<PaginatedResponse<AuditLog>> {
    const searchParams = new URLSearchParams();
    if (params.recordId) searchParams.set('recordId', params.recordId);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));

    return request(`/tools/${toolId}/audit?${searchParams.toString()}`);
  },

  async getByRecordId(toolId: string, recordId: string): Promise<{ data: AuditLog[] }> {
    return request(`/tools/${toolId}/records/${recordId}/audit`);
  },
};

// Users API
export const usersApi = {
  async getAll(): Promise<{ data: User[] }> {
    return request('/users');
  },

  async getById(id: string): Promise<User> {
    return request(`/users/${id}`);
  },

  async create(data: { email: string; password: string; name: string; role?: string }): Promise<User> {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: { name?: string; role?: string; isActive?: boolean }): Promise<User> {
    return request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    await request(`/users/${id}`, { method: 'DELETE' });
  },
};

export { ApiError };
