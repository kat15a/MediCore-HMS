import apiClient from './apiClient';

const receptionistService = {
  async getAll(params = {}) {
    const { data } = await apiClient.get('/receptionists', { params });
    return data.data;
  },
  async getById(id) {
    const { data } = await apiClient.get(`/receptionists/${id}`);
    return data.data;
  },
  async create(payload) {
    const { data } = await apiClient.post('/receptionists', payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await apiClient.put(`/receptionists/${id}`, payload);
    return data.data;
  },
  async remove(id) {
    await apiClient.delete(`/receptionists/${id}`);
  },
};

export default receptionistService;
