import apiClient from './apiClient';

const billingService = {
  async create(payload) {
    const { data } = await apiClient.post('/bills', payload);
    return data.data;
  },
  async getById(id) {
    const { data } = await apiClient.get(`/bills/${id}`);
    return data.data;
  },
  async getByPatient(patientId, params = {}) {
    const { data } = await apiClient.get(`/bills/patient/${patientId}`, { params });
    return data.data;
  },
  async getAll(params = {}) {
    const { data } = await apiClient.get('/bills', { params });
    return data.data;
  },
  async recordPayment(payload) {
    const { data } = await apiClient.post('/bills/payments', payload);
    return data.data;
  },
  async cancel(id) {
    const { data } = await apiClient.patch(`/bills/${id}/cancel`);
    return data.data;
  },
};

export default billingService;
