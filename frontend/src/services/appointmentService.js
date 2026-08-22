import apiClient from './apiClient';

const appointmentService = {
  async book(payload) {
    const { data } = await apiClient.post('/appointments', payload);
    return data.data;
  },
  async getById(id) {
    const { data } = await apiClient.get(`/appointments/${id}`);
    return data.data;
  },
  async getByPatient(patientId, params = {}) {
    const { data } = await apiClient.get(`/appointments/patient/${patientId}`, { params });
    return data.data;
  },
  async getByDoctor(doctorId, params = {}) {
    const { data } = await apiClient.get(`/appointments/doctor/${doctorId}`, { params });
    return data.data;
  },
  async getDoctorScheduleForDate(doctorId, date) {
    const { data } = await apiClient.get(`/appointments/doctor/${doctorId}/schedule`, { params: { date } });
    return data.data;
  },
  async updateStatus(id, status) {
    const { data } = await apiClient.patch(`/appointments/${id}/status`, { status });
    return data.data;
  },
  async getTodaysAppointments() {
    const { data } = await apiClient.get('/appointments/today');
    return data.data;
  },
  async cancel(id, reason) {
    const { data } = await apiClient.patch(`/appointments/${id}/cancel`, null, { params: { reason } });
    return data.data;
  },
};

export default appointmentService;
