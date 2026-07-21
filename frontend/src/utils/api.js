import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    error.displayMessage = message;
    
    // Only clear session if error is about invalid/expired token
    if (error.response?.status === 401) {
      const errorMsg = error.response?.data?.error?.toLowerCase() || '';
      if (
        errorMsg.includes('invalid token') || 
        errorMsg.includes('authentication required') ||
        errorMsg.includes('user not found')
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
      }
    }
    return Promise.reject(error);
  }
);

export const API_BASE_URL = BASE_URL;

export const auth = {
  login: (email, password) => api.post('/users/login', { email, password }),
  checkRole: (email) => api.post('/users/check-role', { email }),
  verifyOtp: (email, otp) => api.post('/users/verify-otp', { email, otp }),
  resetPassword: (email, resetToken, newPassword) =>
    api.post('/users/reset-password', { email, resetToken, newPassword }),
  changePassword: (currentPassword, newPassword) =>
    api.post('/users/change-password', { currentPassword, newPassword }),
  getMe: () => api.get('/users/me'),
  setSession: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('activeMenu');
    sessionStorage.removeItem('resetEmail');
    sessionStorage.removeItem('resetToken');
  },
  getToken: () => localStorage.getItem('token'),
  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem('currentUser'));
    } catch {
      return null;
    }
  },
  setResetSession: (email, resetToken) => {
    sessionStorage.setItem('resetEmail', email);
    sessionStorage.setItem('resetToken', resetToken);
  },
  getResetSession: () => ({
    email: sessionStorage.getItem('resetEmail'),
    resetToken: sessionStorage.getItem('resetToken'),
  }),
  clearResetSession: () => {
    sessionStorage.removeItem('resetEmail');
    sessionStorage.removeItem('resetToken');
  },
};

export const employeesApi = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  getModuleData: (id) => api.get(`/employees/${id}/modules`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  remove: (id) => api.delete(`/employees/${id}`),
};

export const departmentsApi = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  remove: (id) => api.delete(`/departments/${id}`),
};

export const designationsApi = {
  getAll: () => api.get('/designations'),
  create: (data) => api.post('/designations', data),
  update: (id, data) => api.put(`/designations/${id}`, data),
  remove: (id) => api.delete(`/designations/${id}`),
};

export const usersApi = {
  getAll: () => api.get('/users'),
  getMe: () => api.get('/users/me'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
};

export const attendanceApi = {
  getAll: (params = {}) => api.get('/attendance', { params }),
  create: (data) => api.post('/attendance', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  remove: (id) => api.delete(`/attendance/${id}`),
};

export const stockApi = {
  getAll: () => api.get('/stock'),
  getLowStock: () => api.get('/stock/low-stock'),
  getById: (id) => api.get(`/stock/${id}`),
  getModuleData: (id) => api.get(`/stock/${id}/modules`),
  create: (data) => api.post('/stock', data),
  update: (id, data) => api.put(`/stock/${id}`, data),
  remove: (id) => api.delete(`/stock/${id}`),
  updateQuantity: (id, quantity, operation) =>
    api.patch(`/stock/${id}/quantity`, { quantity, operation }),
};

export const incomeApi = {
  getAll: (params = {}) => api.get('/income', { params }),
  getTotal: (params = {}) => api.get('/income/total', { params }),
  getByType: () => api.get('/income/by-type'),
  getById: (id) => api.get(`/income/${id}`),
  create: (data) => api.post('/income', data),
  update: (id, data) => api.put(`/income/${id}`, data),
  remove: (id) => api.delete(`/income/${id}`),
};

export const sparePartsApi = {
  getAll: (params = {}) => api.get('/spare-parts', { params }),
  getLowStock: () => api.get('/spare-parts/low-stock'),
  search: (query) => api.get('/spare-parts/search', { params: { query } }),
  getById: (id) => api.get(`/spare-parts/${id}`),
  getModuleData: (id) => api.get(`/spare-parts/${id}/modules`),
  create: (data) => api.post('/spare-parts', data),
  update: (id, data) => api.put(`/spare-parts/${id}`, data),
  remove: (id) => api.delete(`/spare-parts/${id}`),
  updateQuantity: (id, quantity, operation) =>
    api.patch(`/spare-parts/${id}/quantity`, { quantity, operation }),
};

export const customersApi = {
  getAll: (params = {}) => api.get('/customers', { params }),
  search: (query) => api.get('/customers/search', { params: { query } }),
  getById: (id) => api.get(`/customers/${id}`),
  getModuleData: (id) => api.get(`/customers/${id}/modules`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  remove: (id) => api.delete(`/customers/${id}`),
  updatePurchase: (id, amount, purchaseCount = 1) =>
    api.patch(`/customers/${id}/purchase`, { amount, purchaseCount }),
};

export const hrApi = {
  createUserWithRole: (employeeId, role) =>
    api.post('/hr/users/create', { employeeId, role }),
  generatePassword: (employeeId) =>
    api.post(`/hr/employees/${employeeId}/generate-password`),
  resetPassword: (userId) =>
    api.post(`/hr/users/${userId}/reset-password`),
};

export const erpApi = {
  getAll: (module, recordType) =>
    api.get('/erp', { params: { module, recordType } }),
  create: (data) => api.post('/erp', data),
  update: (id, data) => api.put(`/erp/${id}`, data),
  remove: (id) => api.delete(`/erp/${id}`),
};

export const suppliersApi = {
  getAll: () => api.get('/suppliers'),
  getModuleData: (id) => api.get(`/suppliers/${id}/modules`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  remove: (id) => api.delete(`/suppliers/${id}`),
};

export const reportsApi = {
  sales: () => api.get('/reports/sales'),
  purchase: () => api.get('/reports/purchase'),
  inventory: () => api.get('/reports/inventory'),
  payroll: () => api.get('/reports/payroll'),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getActivity: () => api.get('/dashboard/activity'),
  getAllModuleData: () => api.get('/dashboard/all-modules'),
};

export const accountsApi = {
  getAll: (module, recordType) => api.get('/erp', { params: { module, recordType } }),
  create: (data) => api.post('/erp', data),
  update: (id, data) => api.put(`/erp/${id}`, data),
  remove: (id) => api.delete(`/erp/${id}`),
};

export const ledgerApi = {
  getAll: () => api.get('/erp', { params: { module: 'accounts', recordType: 'ledger' } }),
  create: (data) => api.post('/erp', { ...data, module: 'accounts', recordType: 'ledger' }),
  update: (id, data) => api.put(`/erp/${id}`, { ...data, module: 'accounts', recordType: 'ledger' }),
  remove: (id) => api.delete(`/erp/${id}`),
};

export const gstApi = {
  getAll: () => api.get('/erp', { params: { module: 'accounts', recordType: 'gst' } }),
  create: (data) => api.post('/erp', { ...data, module: 'accounts', recordType: 'gst' }),
  update: (id, data) => api.put(`/erp/${id}`, { ...data, module: 'accounts', recordType: 'gst' }),
  remove: (id) => api.delete(`/erp/${id}`),
};

export const profitLossApi = {
  getAll: () => api.get('/erp', { params: { module: 'accounts', recordType: 'pl' } }),
  create: (data) => api.post('/erp', { ...data, module: 'accounts', recordType: 'pl' }),
  update: (id, data) => api.put(`/erp/${id}`, { ...data, module: 'accounts', recordType: 'pl' }),
  remove: (id) => api.delete(`/erp/${id}`),
};

export default api;
