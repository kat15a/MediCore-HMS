import apiClient from './apiClient';

const patientService = {
  async getAll(params = {}) {
    const { data } = await apiClient.get('/patients', { params });
    return data.data;
  },
  async getById(id) {
    const { data } = await apiClient.get(`/patients/${id}`);
    return data.data;
  },
  async getByUserId(userId) {
    const { data } = await apiClient.get(`/patients/by-user/${userId}`);
    return data.data;
  },
  async search(keyword) {
    const { data } = await apiClient.get('/patients/search', { params: { keyword } });
    return data.data;
  },
  async register(payload) {
    const { data } = await apiClient.post('/patients', payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await apiClient.put(`/patients/${id}`, payload);
    return data.data;
  },
  async remove(id) {
    await apiClient.delete(`/patients/${id}`);
  },
};

export default patientService;
