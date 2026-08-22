import apiClient from './apiClient';

const roomService = {
  async getAll() {
    const { data } = await apiClient.get('/rooms');
    return data.data;
  },
  async getAvailable() {
    const { data } = await apiClient.get('/rooms/available');
    return data.data;
  },
  async getById(id) {
    const { data } = await apiClient.get(`/rooms/${id}`);
    return data.data;
  },
  async create(payload) {
    const { data } = await apiClient.post('/rooms', payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await apiClient.put(`/rooms/${id}`, payload);
    return data.data;
  },
  async allocate(id) {
    const { data } = await apiClient.patch(`/rooms/${id}/allocate`);
    return data.data;
  },
  async release(id) {
    const { data } = await apiClient.patch(`/rooms/${id}/release`);
    return data.data;
  },
  async remove(id) {
    await apiClient.delete(`/rooms/${id}`);
  },
};

export default roomService;
