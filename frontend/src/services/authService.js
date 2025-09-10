import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data.user;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async updateProfile(userData) {
    const response = await api.put(`/users/${userData.id}`, userData);
    return response.data;
  },

  async changePassword(userId, passwordData) {
    const response = await api.put(`/users/${userId}/password`, passwordData);
    return response.data;
  }
};
