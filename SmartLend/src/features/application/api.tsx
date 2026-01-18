import { api } from '../../lib/api';
import { ApplicationResponse, CreateApplicationPayload } from './types';

export const applicationApi = {
  submit: async (
    payload: CreateApplicationPayload
  ): Promise<ApplicationResponse> => {
    const { data } = await api.post<ApplicationResponse>(
      '/api/v1/applications',
      payload
    );
    return data;
  },

  get: async (id: string): Promise<ApplicationResponse> => {
    const { data } = await api.get<ApplicationResponse>(
      `/api/v1/applications/${id}`
    );
    return data;
  },

  listMine: async (): Promise<ApplicationResponse[]> => {
    const { data } = await api.get<ApplicationResponse[]>(
      '/api/v1/applications'
    );
    return data;
  },
};
