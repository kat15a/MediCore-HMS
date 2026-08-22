import apiClient from './apiClient';

const doctorService = {
  async getAll(params = {}) {
    const { data } = await apiClient.get('/doctors', { params });
    return data.data; // PageResponse
  },
  async getById(id) {
    const { data } = await apiClient.get(`/doctors/${id}`);
    return data.data;
  },
  async getByUserId(userId) {
    const { data } = await apiClient.get(`/doctors/by-user/${userId}`);
    return data.data;
  },
  async getByDepartment(departmentId) {
    const { data } = await apiClient.get(`/doctors/department/${departmentId}`);
    return data.data;
  },
  async search(keyword) {
    const { data } = await apiClient.get('/doctors/search', { params: { keyword } });
    return data.data;
  },
  async create(payload) {
    const { data } = await apiClient.post('/doctors', payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await apiClient.put(`/doctors/${id}`, payload);
    return data.data;
  },
  async setAvailability(id, available) {
    const { data } = await apiClient.patch(`/doctors/${id}/availability`, null, { params: { available } });
    return data.data;
  },
  async remove(id) {
    await apiClient.delete(`/doctors/${id}`);
  },
};

export default doctorService;
