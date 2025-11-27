// Servicio API para comunicarse con el backend Spring Boot

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface VoterDTO {
  dni: string;
  fullName: string;
  address?: string;
  district?: string;
  province?: string;
  department?: string;
  birthDate?: string;
  photoUrl?: string;
  hasVoted?: boolean;
}

export interface CandidateDTO {
  id: string;
  name: string;
  photoUrl?: string;
  description?: string;
  partyName?: string;
  partyLogoUrl?: string;
  partyDescription?: string;
  category: string;
  academicFormation?: string;
  professionalExperience?: string;
  campaignProposal?: string;
  voteCount?: number;
}

export interface VoteSelection {
  candidateId: string;
  candidateName: string;
  category: 'presidencial' | 'distrital' | 'regional';
}

export interface VoteRequest {
  voterDni: string;
  selections: VoteSelection[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Función auxiliar para hacer peticiones
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Si es un error 401, incluir información específica
      if (response.status === 401) {
        return {
          success: false,
          error: data.error || data.message || `Error ${response.status}: No autorizado. Por favor, inicia sesión nuevamente.`,
        };
      }
      return {
        success: false,
        error: data.error || data.message || `Error ${response.status}`,
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión',
    };
  }
}

// API de Votantes
export const voterApi = {
  /**
   * Verifica y registra un votante usando DNI
   */
  verify: async (dni: string): Promise<ApiResponse<VoterDTO>> => {
    return fetchApi<VoterDTO>('/voters/verify', {
      method: 'POST',
      body: JSON.stringify({ dni }),
    });
  },

  /**
   * Obtiene un votante por DNI
   */
  getByDni: async (dni: string): Promise<ApiResponse<VoterDTO>> => {
    return fetchApi<VoterDTO>(`/voters/${dni}`);
  },

  /**
   * Obtiene listado de votantes (solo para administradores)
   */
  getList: async (dni?: string): Promise<ApiResponse<VoterDTO[]>> => {
    const token = sessionStorage.getItem('adminToken');
    const url = dni ? `/voters/list?dni=${dni}` : '/voters/list';
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `Error ${response.status}`,
        };
      }

      // El backend devuelve { success: true, data: [voters], count: number }
      return {
        success: true,
        data: data.data || [],
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
      };
    }
  },
};

// API de Candidatos
export const candidateApi = {
  /**
   * Obtiene todos los candidatos
   */
  getAll: async (): Promise<ApiResponse<CandidateDTO[]>> => {
    return fetchApi<CandidateDTO[]>('/candidates');
  },

  /**
   * Obtiene candidatos por categoría
   */
  getByCategory: async (
    category: string
  ): Promise<ApiResponse<CandidateDTO[]>> => {
    return fetchApi<CandidateDTO[]>(`/candidates/category/${category}`);
  },
};

// API de Votos
export const voteApi = {
  /**
   * Registra los votos de un votante
   */
  register: async (
    voteRequest: VoteRequest
  ): Promise<ApiResponse<{ message: string }>> => {
    return fetchApi<{ message: string }>('/votes', {
      method: 'POST',
      body: JSON.stringify(voteRequest),
    });
  },

  /**
   * Obtiene las categorías ya votadas por un votante
   */
  getVotedCategories: async (
    dni: string
  ): Promise<ApiResponse<string[]>> => {
    return fetchApi<string[]>(`/votes/voter/${dni}/categories`);
  },

  /**
   * Invalida los votos de un votante
   */
  invalidate: async (dni: string): Promise<ApiResponse<{ invalidatedCount: number }>> => {
    return fetchApi<{ invalidatedCount: number }>(`/votes/invalidate/${dni}`, {
      method: 'POST',
    });
  },
};

// API de Dashboard
export interface DashboardStatsDTO {
  totalVotes: number;
  totalVoters: number;
  participationRate: number;
  presidentialVotes: number;
  distritalVotes: number;
  regionalVotes: number;
  candidates: CandidateDTO[];
}

export const dashboardApi = {
  /**
   * Obtiene las estadísticas del dashboard
   */
  getStats: async (): Promise<ApiResponse<DashboardStatsDTO>> => {
    return fetchApi<DashboardStatsDTO>('/dashboard/stats');
  },
};

// API de Admin
export interface LoginResponse {
  token: string;
  message: string;
}

// API de Chatbot
export const chatbotApi = {
  /**
   * Envía un mensaje al chatbot y recibe una respuesta
   */
  sendMessage: async (message: string): Promise<ApiResponse<{ response: string }>> => {
    return fetchApi<{ response: string }>('/chatbot/message', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
};

export const adminApi = {
  /**
   * Inicia sesión como administrador
   */
  login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    return fetchApi<LoginResponse>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Verifica si el token es válido
   */
  verify: async (token: string): Promise<ApiResponse<{ valid: boolean }>> => {
    return fetchApi<{ valid: boolean }>('/admin/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  /**
   * Elimina valores nulos
   */
  deleteNullValues: async (): Promise<ApiResponse<{ deletedCount: number }>> => {
    const token = sessionStorage.getItem('adminToken');
    return fetchApi<{ deletedCount: number }>('/admin/clean/null-values', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  /**
   * Elimina duplicados
   */
  deleteDuplicates: async (): Promise<ApiResponse<{ deletedCount: number }>> => {
    const token = sessionStorage.getItem('adminToken');
    return fetchApi<{ deletedCount: number }>('/admin/clean/duplicates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  /**
   * Valida DNIs
   */
  validateDNIs: async (): Promise<ApiResponse<{ invalidDNIs: string[]; count: number }>> => {
    const token = sessionStorage.getItem('adminToken');
    return fetchApi<{ invalidDNIs: string[]; count: number }>('/admin/clean/validate-dnis', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  /**
   * Normaliza datos
   */
  normalizeData: async (): Promise<ApiResponse<{ normalizedCount: number }>> => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
      return {
        success: false,
        error: 'No hay token de autenticación. Por favor, inicia sesión nuevamente.',
      };
    }
    return fetchApi<{ normalizedCount: number }>('/admin/clean/normalize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  /**
   * Analiza tendencias electorales
   */
  analyzeTrends: async (): Promise<ApiResponse<any>> => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
      return {
        success: false,
        error: 'No hay token de autenticación. Por favor, inicia sesión nuevamente.',
      };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/admin/training/trends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // Manejar 401 antes de parsear JSON
      if (response.status === 401) {
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminEmail');
        const errorData = await response.json().catch(() => ({ message: 'Sesión expirada' }));
        return {
          success: false,
          error: errorData.message || 'Sesión expirada. Por favor, inicia sesión nuevamente.',
        };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `Error ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
      };
    }
  },

  /**
   * Detecta anomalías en los datos
   */
  detectAnomalies: async (): Promise<ApiResponse<any>> => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
      return {
        success: false,
        error: 'No hay token de autenticación. Por favor, inicia sesión nuevamente.',
      };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/admin/training/anomalies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // Si es 401, limpiar sesión y redirigir
      if (response.status === 401) {
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminEmail');
        window.location.href = '/admin';
        return {
          success: false,
          error: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
        };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `Error ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
      };
    }
  },

  /**
   * Analiza participación por región y demografía
   */
  analyzeParticipation: async (): Promise<ApiResponse<any>> => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
      return {
        success: false,
        error: 'No hay token de autenticación. Por favor, inicia sesión nuevamente.',
      };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/admin/training/participation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // Si es 401, limpiar sesión y redirigir
      if (response.status === 401) {
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminEmail');
        window.location.href = '/admin';
        return {
          success: false,
          error: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
        };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `Error ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
      };
    }
  },
};

// API de Super Admin
export const superAdminApi = {
  /**
   * Inicia sesión como super administrador
   */
  login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    return fetchApi<LoginResponse>('/superadmin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Verifica si el token es válido
   */
  verify: async (token: string): Promise<ApiResponse<{ valid: boolean }>> => {
    return fetchApi<{ valid: boolean }>('/superadmin/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  /**
   * Exporta todos los datos para migración
   */
  exportData: async (): Promise<ApiResponse<any>> => {
    const token = sessionStorage.getItem('superAdminToken');
    if (!token) {
      return {
        success: false,
        error: 'No hay token de autenticación. Por favor, inicia sesión nuevamente.',
      };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/superadmin/migration/export`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `Error ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
      };
    }
  },

  /**
   * Importa datos
   */
  importData: async (data: any): Promise<ApiResponse<any>> => {
    const token = sessionStorage.getItem('superAdminToken');
    if (!token) {
      return {
        success: false,
        error: 'No hay token de autenticación. Por favor, inicia sesión nuevamente.',
      };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/superadmin/migration/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || result.message || `Error ${response.status}`,
        };
      }

      return {
        success: true,
        data: result.data || result,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
      };
    }
  },

  /**
   * Obtiene el log de auditoría de seguridad
   */
  getSecurityAudit: async (): Promise<ApiResponse<any>> => {
    const token = sessionStorage.getItem('superAdminToken');
    if (!token) {
      return {
        success: false,
        error: 'No hay token de autenticación. Por favor, inicia sesión nuevamente.',
      };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/superadmin/audit/security`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `Error ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
      };
    }
  },
};

