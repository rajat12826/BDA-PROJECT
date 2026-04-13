import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export const getProducts = () => api.get('/products').then(res => res.data);
export const addProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const updateStock = (prodId, data) => api.put(`/stock/${prodId}`, data);
export const getTransactions = () => api.get('/transactions').then(res => res.data);
export const getAlerts = () => api.get('/alerts').then(res => res.data);
export const getProductHistory = (id) => api.get(`/history/${id}`).then(res => res.data);
export const restoreProductVersion = (id, data) => api.post(`/history/${id}/restore`, data).then(res => res.data);
export const getRawData = (table) => api.get(`/raw/${table}`).then(res => res.data);

export default api;
