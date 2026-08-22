import apiClient from './apiClient';

const departmentService = {
  async getAll() {
    const { data } = await apiClient.get('/departments');
    return data.data;
  },
  async getById(id) {
    const { data } = await apiClient.get(`/departments/${id}`);
    return data.data;
  },
  async create(payload) {
    const { data } = await apiClient.post('/departments', payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await apiClient.put(`/departments/${id}`, payload);
    return data.data;
  },
  async remove(id) {
    await apiClient.delete(`/departments/${id}`);
  },
};

export default departmentService;
