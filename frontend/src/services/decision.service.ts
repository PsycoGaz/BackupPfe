import api from './api';
import { TrainingRequest } from '../types';

export const decisionService = {
  // Manager
  async getManagerTasks(): Promise<TrainingRequest[]> {
    const { data } = await api.get('/manager/tasks');
    return data;
  },

  async approveAsManager(requestId: string, comment?: string): Promise<TrainingRequest> {
    const { data } = await api.post(`/manager/tasks/${requestId}/approve`, { comment });
    return data;
  },

  async rejectAsManager(requestId: string, comment?: string): Promise<TrainingRequest> {
    const { data } = await api.post(`/manager/tasks/${requestId}/reject`, { comment });
    return data;
  },

  // RH
  async getRhTasks(): Promise<TrainingRequest[]> {
    const { data } = await api.get('/rh/tasks');
    return data;
  },

  async approveAsRh(requestId: string, comment?: string): Promise<TrainingRequest> {
    const { data } = await api.post(`/rh/tasks/${requestId}/approve`, { comment });
    return data;
  },

  async rejectAsRh(requestId: string, comment?: string): Promise<TrainingRequest> {
    const { data } = await api.post(`/rh/tasks/${requestId}/reject`, { comment });
    return data;
  },
};
