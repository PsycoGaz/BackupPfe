import api from './api';
import { TrainingRequest } from '../types';

export const trainingRequestService = {
  async getAll(): Promise<TrainingRequest[]> {
    const { data } = await api.get('/training-requests');
    return data;
  },

  async getById(id: string): Promise<TrainingRequest> {
    const { data } = await api.get(`/training-requests/${id}`);
    return data;
  },

  async create(payload: {
    requestType: string;
    formationId?: string;
    customFormationName?: string;
    domain?: string;
    desiredStartDate: string;
    desiredEndDate?: string;
    justification?: string;
  }): Promise<TrainingRequest> {
    const { data } = await api.post('/training-requests', payload);
    return data;
  },

  async createTeamRequest(payload: {
    requestType: string;
    formationId?: string;
    customFormationName?: string;
    domain?: string;
    desiredStartDate: string;
    desiredEndDate?: string;
    justification?: string;
    participantIds: string[];
  }): Promise<TrainingRequest> {
    const { data } = await api.post('/training-requests/team', payload);
    return data;
  },

  async cancel(id: string): Promise<TrainingRequest> {
    const { data } = await api.patch(`/training-requests/${id}/cancel`);
    return data;
  },
};
