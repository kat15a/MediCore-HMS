import apiClient from './apiClient';

const notificationService = {
  async getAll(params = {}) {
    const { data } = await apiClient.get('/notifications', { params });
    return data.data;
  },
  async getUnreadCount() {
    const { data } = await apiClient.get('/notifications/unread-count');
    return data.data;
  },
  async markAsRead(id) {
    await apiClient.patch(`/notifications/${id}/read`);
  },
  async markAllAsRead() {
    await apiClient.patch('/notifications/read-all');
  },
};

export default notificationService;
