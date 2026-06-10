import api from './api';
import { ChatResponse } from '../types';

export const chatService = {
  async sendMessage(message: string): Promise<ChatResponse> {
    const { data } = await api.post('/chat/message', { message });
    return data;
  },

  async recommendFormations(need: string): Promise<ChatResponse> {
    const { data } = await api.post('/chat/recommend-formations', { need });
    return data;
  },

  async generateJustification(
    formationName: string,
    domain: string,
    context?: string,
  ): Promise<ChatResponse> {
    const { data } = await api.post('/chat/generate-justification', {
      formationName,
      domain,
      context,
    });
    return data;
  },
};
