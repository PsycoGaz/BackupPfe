import api from './api';
import { Formation } from '../types';

export const formationService = {
  async getAll(): Promise<Formation[]> {
    const { data } = await api.get('/formations');
    return data;
  },

  async getDomains(): Promise<string[]> {
    const { data } = await api.get('/formations/domains');
    return data;
  },

  async createDomain(name: string): Promise<{ domain: string }> {
    const { data } = await api.post('/formations/domains', { name });
    return data;
  },

  async renameDomain(oldName: string, newName: string): Promise<{ affected: number }> {
    const { data } = await api.patch('/formations/domains/rename', { oldName, newName });
    return data;
  },

  async deleteDomain(name: string): Promise<void> {
    await api.delete(`/formations/domains/${encodeURIComponent(name)}`);
  },

  async create(payload: {
    name: string;
    domain: string;
    description?: string;
    estimatedCost?: number;
  }): Promise<Formation> {
    const { data } = await api.post('/formations', payload);
    return data;
  },

  async update(
    id: string,
    payload: Partial<Formation>,
  ): Promise<Formation> {
    const { data } = await api.patch(`/formations/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/formations/${id}`);
  },
};
