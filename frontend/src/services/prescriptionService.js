import apiClient from './apiClient';

const prescriptionService = {
  async create(payload) {
    const { data } = await apiClient.post('/prescriptions', payload);
    return data.data;
  },
  async getById(id) {
    const { data } = await apiClient.get(`/prescriptions/${id}`);
    return data.data;
  },
  async getByAppointment(appointmentId) {
    const { data } = await apiClient.get(`/prescriptions/appointment/${appointmentId}`);
    return data.data;
  },
  async getByPatient(patientId, params = {}) {
    const { data } = await apiClient.get(`/prescriptions/patient/${patientId}`, { params });
    return data.data;
  },
  async getByDoctor(doctorId, params = {}) {
    const { data } = await apiClient.get(`/prescriptions/doctor/${doctorId}`, { params });
    return data.data;
  },
};

export default prescriptionService;
