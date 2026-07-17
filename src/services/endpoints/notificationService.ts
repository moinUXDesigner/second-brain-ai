import apiClient from '../apiClient';
import type { ApiResponse, AppNotification, NotificationList } from '@/types';

export const notificationService = {
  async getNotifications(): Promise<ApiResponse<NotificationList>> {
    const { data } = await apiClient.get('/notifications');
    return data;
  },

  async markRead(id: string): Promise<ApiResponse<AppNotification>> {
    const { data } = await apiClient.patch(`/notifications/${id}/read`);
    return data;
  },

  async markAllRead(): Promise<ApiResponse<{ unreadCount: number }>> {
    const { data } = await apiClient.patch('/notifications/read-all');
    return data;
  },

  async checkReminders(): Promise<ApiResponse<{ created: number }>> {
    const { data } = await apiClient.post('/notifications/check-reminders');
    return data;
  },
};
