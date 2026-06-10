import api from './api';
import { AuthResponse } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  async register(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    managerId?: string;
  }): Promise<AuthResponse> {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },
};
