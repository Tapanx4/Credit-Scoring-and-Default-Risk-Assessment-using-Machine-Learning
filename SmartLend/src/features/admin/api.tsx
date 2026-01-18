import { api } from '../../lib/api';
import { ApplicationResponse } from '../application/types';

export interface PortfolioOverview {
  total_applications: number;
  approval_rate: number;
  total_funded_volume: number;
}

export const adminApi = {
  getOverview: async (): Promise<PortfolioOverview> => {
    const { data } = await api.get<PortfolioOverview>(
      '/api/v1/portfolio/overview'
    );
    return data;
  },

  getTiers: async (): Promise<Record<string, number>> => {
    const { data } = await api.get<Record<string, number>>(
      '/api/v1/portfolio/tiers'
    );
    return data;
  },

  getActivity: async (limit = 20): Promise<ApplicationResponse[]> => {
    const { data } = await api.get<ApplicationResponse[]>(
      `/api/v1/portfolio/activity?limit=${limit}`
    );
    return data;
  },
};

