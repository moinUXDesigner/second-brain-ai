import apiClient from '../apiClient';
import type { ApiResponse, FinanceBucket, FinanceEntry, FinanceEntryPayload, FinanceListResponse, FinanceSummary } from '@/types';

export const financeService = {
  async getEntries(bucket?: FinanceBucket): Promise<FinanceListResponse> {
    const { data } = await apiClient.get('/finance', { params: bucket ? { bucket } : undefined });
    return data;
  },

  async createEntry(payload: FinanceEntryPayload): Promise<ApiResponse<FinanceEntry>> {
    const { data } = await apiClient.post('/finance', payload);
    return data;
  },

  async updateEntry(id: string, payload: Partial<FinanceEntryPayload>): Promise<ApiResponse<FinanceEntry>> {
    const { data } = await apiClient.put(`/finance/${id}`, payload);
    return data;
  },

  async deleteEntry(id: string): Promise<ApiResponse<{ deleted: boolean; entryId: string }>> {
    const { data } = await apiClient.delete(`/finance/${id}`);
    return data;
  },

  async getSummary(): Promise<ApiResponse<FinanceSummary>> {
    const { data } = await apiClient.get('/finance/summary');
    return data;
  },
};
