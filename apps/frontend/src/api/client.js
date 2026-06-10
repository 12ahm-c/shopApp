import useAuthStore from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const BASE_URL = API_BASE_URL ? `${API_BASE_URL}/v1` : '/v1';

/**
 * Standard API Client
 * Wraps fetch to handle the standard { success, data, error, meta } response
 * and automatically attaches the auth token.
 */
export async function apiClient(endpoint, options = {}) {
  const token = useAuthStore.getState().token;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return {
        success: true,
        data: null,
        error: null,
        meta: null
      };
    }
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw data.error || new Error('API Request Failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Client Error:', error);
    throw error;
  }
}
