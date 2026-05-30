import useAuthStore from '../stores/authStore';

const BASE_URL = '/v1'; // Will be prefixed by Vite proxy in real setup

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
