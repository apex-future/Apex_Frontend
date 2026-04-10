import axios from 'axios';

const apiClient = axios.create({
  baseURL: '',  // relative — proxied by Vite (dev) and Vercel (prod)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('apex_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401s
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('apex_token');
      // Use window.location as we might be outside of a React component/hook
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
