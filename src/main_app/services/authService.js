import apiClient from './apiClient';

const authService = {
  async register(fullName, email, password, onboardingData = {}) {
    const response = await apiClient.post('/api/auth/register', {
      full_name: fullName,
      email: email.toLowerCase(),
      password,
      ...onboardingData,
    });
    if (response.data.access_token) {
      localStorage.setItem('apex_token', response.data.access_token);
    }
    if (response.data?.user?.has_done_onboarding || response.data?.user?.user_type) {
      localStorage.setItem('apex_has_done_onboarding', 'true');
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
    if (response.data?.user?.has_done_onboarding || response.data?.user?.user_type) {
      localStorage.setItem('apex_has_done_onboarding', 'true');
    }
    return response.data;
  },

  async googleAuth(token) {
    const response = await apiClient.post('/api/auth/google', {
      token,
    });
    if (response.data.access_token) {
      localStorage.setItem('apex_token', response.data.access_token);
    }
    if (response.data?.user?.has_done_onboarding || response.data?.user?.user_type) {
      localStorage.setItem('apex_has_done_onboarding', 'true');
    }
    return response.data;
  },

  async logout() {
    // We can call the logout endpoint if needed, but primarily clear local state
    try {
      await apiClient.post('/api/auth/logout');
    } catch (e) {
      console.error('Logout API error:', e.message);
    } finally {
      localStorage.removeItem('apex_token');
      localStorage.removeItem('apex_has_done_onboarding');
    }
  },

  async me() {
    const response = await apiClient.get('/api/auth/me');
    if (response.data?.has_done_onboarding) {
      localStorage.setItem('apex_has_done_onboarding', 'true');
    } else {
      localStorage.removeItem('apex_has_done_onboarding');
    }
    return response.data;
  },

  async saveOnboarding(onboardingData) {
    localStorage.setItem('apex_has_done_onboarding', 'true');
    const response = await apiClient.patch('/api/auth/onboarding', onboardingData);
    if (response.data?.user) {
      localStorage.setItem('apex_has_done_onboarding', 'true');
    }
    return response.data;
  },

  hasDoneOnboarding() {
    return localStorage.getItem('apex_has_done_onboarding') === 'true';
  },

  // Send forgot password request
  async forgotPassword(email) {
    const response = await apiClient.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  // Submit new password with token
  async resetPassword(token, newPassword) {
    const response = await apiClient.post('/api/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },

  async verifyEmail(token) {
    const response = await apiClient.post('/api/auth/verify-email', {
      token
    });
    // If verification returns a fresh access token, store it
    if (response.data.access_token) {
      localStorage.setItem('apex_token', response.data.access_token);
    }
    if (response.data?.user?.has_done_onboarding || response.data?.user?.user_type) {
      localStorage.setItem('apex_has_done_onboarding', 'true');
    }
    return response.data;
  },

  async resendVerification() {
    const response = await apiClient.post(
      '/api/auth/resend-verification'
    );
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
