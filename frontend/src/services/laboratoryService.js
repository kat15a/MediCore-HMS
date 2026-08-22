import apiClient from './apiClient';

const laboratoryService = {
  async getAll() {
    const { data } = await apiClient.get('/laboratories');
    return data.data;
  },
  async create(payload) {
    const { data } = await apiClient.post('/laboratories', payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await apiClient.put(`/laboratories/${id}`, payload);
    return data.data;
  },
  async remove(id) {
    await apiClient.delete(`/laboratories/${id}`);
  },
};

export default laboratoryService;
