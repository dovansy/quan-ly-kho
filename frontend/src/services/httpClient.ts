import axios from 'axios';
import { store } from '@/shared/redux/store';
import { logout, setAccessToken } from '@/store/auth';

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token
httpClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle errors
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const requestUrl: string = error.config?.url || '';
      const isLoginRequest = requestUrl.includes('/auth/login');

      // If unauthorized (and not from the login request itself), logout user
      if (status === 401 && !isLoginRequest) {
        store.dispatch(logout());
        store.dispatch(setAccessToken(null));
        window.location.href = '/login';
      }

      // Return the error in the format the frontend expects
      return Promise.reject({
        status,
        data: data || { code: status, message: 'Đã có lỗi xảy ra', data: null },
      });
    }

    return Promise.reject({
      status: 0,
      data: { code: 9999, message: 'Lỗi kết nối mạng', data: null },
    });
  },
);

export default httpClient;
