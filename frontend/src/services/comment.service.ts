import api from './api';
import { Comment } from '../types';

export const commentService = {
  async getByRequest(requestId: string): Promise<Comment[]> {
    const { data } = await api.get(`/comments/${requestId}`);
    return data;
  },

  async create(requestId: string, content: string): Promise<Comment> {
    const { data } = await api.post(`/comments/${requestId}`, { content });
    return data;
  },
};
