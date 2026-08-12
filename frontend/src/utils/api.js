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
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
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

// Helper to create FormData for file uploads
export const createFormData = (data, files = {}) => {
  const formData = new FormData();
  
  // Append text fields
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      if (Array.isArray(data[key])) {
        data[key].forEach(item => formData.append(key, item));
      } else {
        formData.append(key, data[key]);
      }
    }
  });
  
  // Append files
  Object.keys(files).forEach(key => {
    if (files[key]) {
      formData.append(key, files[key]);
    }
  });
  
  return formData;
};

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
  create: (data, imageFile, docImageFile) => {
    const files = {};
    if (imageFile) files.image = imageFile;
    if (docImageFile) files.docImage = docImageFile;
    const formData = createFormData(data, files);
    return api.post('/employees', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data, imageFile, docImageFile) => {
    const files = {};
    if (imageFile) files.image = imageFile;
    if (docImageFile) files.docImage = docImageFile;
    const formData = createFormData(data, files);
    return api.put(`/employees/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
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
  getMy: (params = {}) => api.get('/attendance/my', { params }),
  create: (data) => api.post('/attendance', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  remove: (id) => api.delete(`/attendance/${id}`),
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: () => api.post('/attendance/check-out'),
  scan: (data) => api.post('/attendance/scan', data),
  getToday: () => api.get('/attendance/today'),
  getReport: (params = {}) => api.get('/attendance/report', { params }),
  getEmployee: (id) => api.get(`/attendance/employee/${id}`),
  manual: (data) => api.put('/attendance/manual', data),
  generateQr: (employeeId) => api.post(`/employees/${employeeId}/generate-qr`),
  // Leave
  getLeave: (params = {}) => api.get('/attendance/leave', { params }),
  createLeave: (data) => api.post('/attendance/leave', data),
  updateLeave: (id, data) => api.put(`/attendance/leave/${id}`, data),
  deleteLeave: (id) => api.delete(`/attendance/leave/${id}`),
  // Late Entries
  getLateEntries: (params = {}) => api.get('/attendance/late-entries', { params }),
};

export const stockApi = {
  getAll: () => api.get('/stock'),
  getLowStock: () => api.get('/stock/low-stock'),
  getById: (id) => api.get(`/stock/${id}`),
  getModuleData: (id) => api.get(`/stock/${id}/modules`),
  create: (data, images = []) => {
    const formData = createFormData(data);
    images.forEach(img => formData.append('images', img));
    return api.post('/stock', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data, images = []) => {
    const formData = createFormData(data);
    images.forEach(img => formData.append('images', img));
    return api.put(`/stock/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
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
  create: (data, images = []) => {
    const formData = createFormData(data);
    images.forEach(img => formData.append('images', img));
    return api.post('/spare-parts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data, images = []) => {
    const formData = createFormData(data);
    images.forEach(img => formData.append('images', img));
    return api.put(`/spare-parts/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  remove: (id) => api.delete(`/spare-parts/${id}`),
  updateQuantity: (id, quantity, operation) =>
    api.patch(`/spare-parts/${id}/quantity`, { quantity, operation }),
};

export const customersApi = {
  getAll: (params = {}) => api.get('/customers', { params }),
  search: (query) => api.get('/customers/search', { params: { query } }),
  getById: (id) => api.get(`/customers/${id}`),
  getModuleData: (id) => api.get(`/customers/${id}/modules`),
  create: (data, imageFile) => {
    const formData = createFormData(data, imageFile ? { image: imageFile } : {});
    return api.post('/customers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data, imageFile) => {
    const formData = createFormData(data, imageFile ? { image: imageFile } : {});
    return api.put(`/customers/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  remove: (id) => api.delete(`/customers/${id}`),
  updatePurchase: (id, amount, purchaseCount = 1) =>
    api.patch(`/customers/${id}/purchase`, { amount, purchaseCount }),
};

export const hrApi = {
  createUserWithRole: (employeeId, role, password) =>
    api.post('/hr/users/create', { employeeId, role, password }),
  getEmployeeUserStatus: (employeeId) =>
    api.get(`/hr/employees/${employeeId}/user-status`),
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
  getProducts: (id) => api.get(`/suppliers/${id}/products`),
  addProduct: (id, data) => api.post(`/suppliers/${id}/products`, data),
  removeProduct: (id, productId, data = {}) => api.delete(`/suppliers/${id}/products/${productId}`, { data }),
  create: (data, imageFile) => {
    const formData = createFormData(data, imageFile ? { image: imageFile } : {});
    return api.post('/suppliers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data, imageFile) => {
    const formData = createFormData(data, imageFile ? { image: imageFile } : {});
    return api.put(`/suppliers/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  remove: (id) => api.delete(`/suppliers/${id}`),
};

export const rawMaterialsApi = {
  getAll: (params = {}) => api.get('/raw-materials', { params }),
  getLowStock: () => api.get('/raw-materials/low-stock'),
  getById: (id) => api.get(`/raw-materials/${id}`),
  create: (data) => api.post('/raw-materials', data),
  update: (id, data) => api.put(`/raw-materials/${id}`, data),
  remove: (id) => api.delete(`/raw-materials/${id}`),
  deductStock: (data) => api.post('/raw-materials/deduct-stock', data),
  addStock: (data) => api.post('/raw-materials/add-stock', data),
  getBySupplier: (supplierId) => api.get(`/suppliers/${supplierId}/raw-materials`),
};

export const rawMaterialPurchasesApi = {
  getAll: (params = {}) => api.get('/raw-material-purchases', { params }),
  getById: (id) => api.get(`/raw-material-purchases/${id}`),
  create: (data) => api.post('/raw-material-purchases', data),
  update: (id, data) => api.put(`/raw-material-purchases/${id}`, data),
  remove: (id) => api.delete(`/raw-material-purchases/${id}`),
  updateQualityCheck: (purchaseId, itemId, data) =>
    api.patch(`/raw-material-purchases/${purchaseId}/items/${itemId}/quality-check`, data),
};

export const reportsApi = {
  sales: () => api.get('/reports/sales'),
  purchase: () => api.get('/reports/purchase'),
  inventory: () => api.get('/reports/inventory'),
  payroll: () => api.get('/reports/payroll'),
};

export const purchaseOrdersApi = {
  getAll: (params = {}) => api.get('/purchase/orders', { params }),
  getById: (id) => api.get(`/purchase/orders/${id}`),
  create: (data) => api.post('/purchase/orders', data),
  update: (id, data) => api.put(`/purchase/orders/${id}`, data),
  remove: (id) => api.delete(`/purchase/orders/${id}`),
};

export const purchaseReturnsApi = {
  getAll: (params = {}) => api.get('/purchase/returns', { params }),
  create: (data) => api.post('/purchase/returns', data),
  update: (id, data) => api.put(`/purchase/returns/${id}`, data),
  remove: (id) => api.delete(`/purchase/returns/${id}`),
};

export const grnApi = {
  create: (data) => api.post('/purchase/grn', data),
  update: (id, data) => api.put(`/purchase/grn/${id}`, data),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getActivity: () => api.get('/dashboard/activity'),
  getAttendanceStats: () => api.get('/dashboard/attendance-stats'),
  getAllModuleData: () => api.get('/dashboard/all-modules'),
};

export const searchApi = {
  global: (query) => api.get('/search', { params: { query } }),
};

// ──────────────────────────────────────────────────────────────
// RBAC API
// ──────────────────────────────────────────────────────────────
export const rolesApi = {
  getAll: () => api.get('/roles'),
  getById: (id) => api.get(`/roles/${id}`),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  remove: (id) => api.delete(`/roles/${id}`),
};

export const permissionsApi = {
  getAll: () => api.get('/permissions'),
  getByModule: (module) => api.get(`/permissions/module/${module}`),
  create: (data) => api.post('/permissions', data),
  update: (id, data) => api.put(`/permissions/${id}`, data),
  remove: (id) => api.delete(`/permissions/${id}`),
};

export const rolePermissionsApi = {
  getByRole: (roleId) => api.get(`/role-permissions/${roleId}`),
  getRoleWithPermissions: (roleId) => api.get(`/role-permissions/role/${roleId}`),
  assign: (data) => api.post('/role-permissions', data),
  remove: (roleId, permissionId) => api.delete(`/role-permissions/${roleId}/${permissionId}`),
  bulkAssign: (data) => api.post('/role-permissions/bulk', data),
  getMyPermissions: () => api.get('/my-permissions'),
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




