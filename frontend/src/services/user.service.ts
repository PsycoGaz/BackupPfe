import api from './api';
import { User } from '../types';

export const userService = {
  async getProfile(): Promise<User> {
    const { data } = await api.get('/users/me');
    return data;
  },

  async getTeam(): Promise<User[]> {
    const { data } = await api.get('/users/team');
    return data;
  },

  async getAll(): Promise<User[]> {
    const { data } = await api.get('/users');
    return data;
  },
};
