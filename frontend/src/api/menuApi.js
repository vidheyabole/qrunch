import axios from 'axios';

const BASE = '/api/menu';
const h = (token) => ({ Authorization: `Bearer ${token}` });

export const getCategories = async (restaurantId, token) => {
  const { data } = await axios.get(`${BASE}/categories/${restaurantId}`, { headers: h(token) });
  return data;
};
export const addCategory = async (restaurantId, name, token) => {
  const { data } = await axios.post(`${BASE}/categories`, { restaurantId, name }, { headers: h(token) });
  return data;
};
export const updateCategory = async (id, name, token) => {
  const { data } = await axios.put(`${BASE}/categories/${id}`, { name }, { headers: h(token) });
  return data;
};
export const deleteCategory = async (id, token) => {
  const { data } = await axios.delete(`${BASE}/categories/${id}`, { headers: h(token) });
  return data;
};
export const getItems = async (categoryId, token) => {
  const { data } = await axios.get(`${BASE}/items/${categoryId}`, { headers: h(token) });
  return data;
};
export const addItem = async (formData, token) => {
  const { data } = await axios.post(`${BASE}/items`, formData, {
    headers: { ...h(token), 'Content-Type': 'multipart/form-data' }
  });
  return data;
};
export const updateItem = async (id, formData, token) => {
  const { data } = await axios.put(`${BASE}/items/${id}`, formData, {
    headers: { ...h(token), 'Content-Type': 'multipart/form-data' }
  });
  return data;
};
export const deleteItem = async (id, token) => {
  const { data } = await axios.delete(`${BASE}/items/${id}`, { headers: h(token) });
  return data;
};
export const toggleItemAvailability = async (id, token) => {
  const { data } = await axios.patch(`${BASE}/items/${id}/toggle`, {}, { headers: h(token) });
  return data;
};