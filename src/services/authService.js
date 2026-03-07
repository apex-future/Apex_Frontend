import apiClient from './apiClient';

const authService = {
  async register(fullName, email, password) {
    const response = await apiClient.post('/api/auth/register', {
      full_name: fullName,
      email: email.toLowerCase(),
      password,
    });
    if (response.data.access_token) {
      localStorage.setItem('apex_token', response.data.access_token);
    }
    return response.data;
  },

  async login(email, password) {
    const response = await apiClient.post('/api/auth/login', {
      email: email.toLowerCase(),
      password,
    });
    if (response.data.access_token) {
      localStorage.setItem('apex_token', response.data.access_token);
    }
    return response.data;
  },

  async logout() {
    // We can call the logout endpoint if needed, but primarily clear local state
    try {
      await apiClient.post('/api/auth/logout');
    } catch (e) {
      console.error('Logout API error:', e);
    } finally {
      localStorage.removeItem('apex_token');
    }
  },

  async me() {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  getToken() {
    return localStorage.getItem('apex_token');
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};

export default authService;
