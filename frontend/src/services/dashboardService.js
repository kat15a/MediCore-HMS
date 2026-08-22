import apiClient from './apiClient';

const dashboardService = {
  async getAdminDashboard() {
    const { data } = await apiClient.get('/dashboard/admin');
    return data.data;
  },
  async getDoctorDashboard(doctorId) {
    const { data } = await apiClient.get(`/dashboard/doctor/${doctorId}`);
    return data.data;
  },
};

export default dashboardService;
