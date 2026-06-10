import api from './api';
import { AnalyticsDashboard } from '../types';

export const analyticsService = {
  async getDashboard(): Promise<AnalyticsDashboard> {
    const { data } = await api.get('/analytics/dashboard');
    return data;
  },

  async exportCsv(status?: string, domain?: string): Promise<void> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (domain) params.append('domain', domain);

    const { data } = await api.get(`/analytics/export/csv?${params.toString()}`, {
      responseType: 'blob',
    });

    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'demandes-formation.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  },
};
