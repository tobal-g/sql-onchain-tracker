import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create a separate axios instance for auth that doesn't include the Bearer token
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for refresh token
});

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export const login = async (password: string): Promise<LoginResponse> => {
  const { data } = await authApi.post<LoginResponse>('/auth/login', { password });
  return data;
};

export const refresh = async (): Promise<RefreshResponse> => {
  const { data } = await authApi.post<RefreshResponse>('/auth/refresh');
  return data;
};

export const logout = async (): Promise<LogoutResponse> => {
  const { data } = await authApi.post<LogoutResponse>('/auth/logout');
  return data;
};
