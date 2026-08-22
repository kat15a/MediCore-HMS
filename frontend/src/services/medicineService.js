import apiClient from './apiClient';

const medicineService = {
  async getAll() {
    const { data } = await apiClient.get('/medicines');
    return data.data;
  },
  async getById(id) {
    const { data } = await apiClient.get(`/medicines/${id}`);
    return data.data;
  },
  async search(name) {
    const { data } = await apiClient.get('/medicines/search', { params: { name } });
    return data.data;
  },
  async getLowStock() {
    const { data } = await apiClient.get('/medicines/low-stock');
    return data.data;
  },
  async create(payload) {
    const { data } = await apiClient.post('/medicines', payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await apiClient.put(`/medicines/${id}`, payload);
    return data.data;
  },
  /** delta: positive to restock, negative to deduct — matches InventoryAdjustRequest */
  async adjustStock(id, payload) {
    const { data } = await apiClient.patch(`/medicines/${id}/stock`, payload);
    return data.data;
  },
  async remove(id) {
    await apiClient.delete(`/medicines/${id}`);
  },
};

export default medicineService;
