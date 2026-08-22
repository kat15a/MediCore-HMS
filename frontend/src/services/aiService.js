import apiClient from './apiClient';

const aiService = {
  async checkSymptoms(payload) {
    const { data } = await apiClient.post('/ai/symptom-check', payload);
    return data.data;
  },
  async summarizeReportText(payload) {
    const { data } = await apiClient.post('/ai/reports/summarize-text', payload);
    return data.data;
  },
  async summarizeReportPdf(file, labReportId) {
    const form = new FormData();
    form.append('file', file);
    if (labReportId) form.append('labReportId', labReportId);
    const { data } = await apiClient.post('/ai/reports/summarize-pdf', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
  async explainPrescription(prescriptionId) {
    const { data } = await apiClient.get(`/ai/prescriptions/${prescriptionId}/explain`);
    return data.data;
  },
  async chat(payload) {
    const { data } = await apiClient.post('/ai/chat', payload);
    return data.data;
  },
};

export default aiService;
