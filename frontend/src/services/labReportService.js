import apiClient from './apiClient';

const labReportService = {
  async request(payload) {
    const { data } = await apiClient.post('/lab-reports', payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await apiClient.patch(`/lab-reports/${id}`, payload);
    return data.data;
  },
  async getById(id) {
    const { data } = await apiClient.get(`/lab-reports/${id}`);
    return data.data;
  },
  async getByPatient(patientId, params = {}) {
    const { data } = await apiClient.get(`/lab-reports/patient/${patientId}`, { params });
    return data.data;
  },
  async getByDoctor(doctorId, params = {}) {
    const { data } = await apiClient.get(`/lab-reports/doctor/${doctorId}`, { params });
    return data.data;
  },
};

export default labReportService;
