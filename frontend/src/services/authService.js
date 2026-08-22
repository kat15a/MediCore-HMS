import apiClient, { tokenStorage } from './apiClient';

const authService = {
  async register(payload) {
    const { data } = await apiClient.post('/auth/register', payload);
    return data.data;
  },

  async login({ email, password, rememberMe }) {
    const { data } = await apiClient.post('/auth/login', { email, password, rememberMe });
    const { accessToken, refreshToken, user } = data.data;
    tokenStorage.setTokens(accessToken, refreshToken);
    return user;
  },

  async logout() {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } finally {
      tokenStorage.clear();
    }
  },

  async verifyEmail(token) {
    const { data } = await apiClient.post('/auth/verify-email', { token });
    return data.message;
  },

  async resendVerification(email) {
    const { data } = await apiClient.post(`/auth/resend-verification?email=${encodeURIComponent(email)}`);
    return data.message;
  },

  async forgotPassword(email) {
    const { data } = await apiClient.post('/auth/forgot-password', { email });
    return data.message;
  },

  async resetPassword(token, newPassword) {
    const { data } = await apiClient.post('/auth/reset-password', { token, newPassword });
    return data.message;
  },

  async changePassword(currentPassword, newPassword) {
    const { data } = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
    return data.message;
  },

  async getCurrentUser() {
    const { data } = await apiClient.get('/auth/me');
    return data.data;
  },

  isAuthenticated() {
    return Boolean(tokenStorage.getAccessToken());
  },
};

export default authService;
