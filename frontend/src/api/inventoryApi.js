import axios from 'axios';

const BASE = '/api/inventory';
const h = (token) => ({ Authorization: `Bearer ${token}` });

export const getInventory = async (restaurantId, token) => {
  const { data } = await axios.get(`${BASE}/${restaurantId}`, { headers: h(token) });
  return data;
};
export const addInventoryItem = async (payload, token) => {
  const { data } = await axios.post(BASE, payload, { headers: h(token) });
  return data;
};
export const updateInventoryItem = async (id, payload, token) => {
  const { data } = await axios.put(`${BASE}/${id}`, payload, { headers: h(token) });
  return data;
};
export const deleteInventoryItem = async (id, token) => {
  const { data } = await axios.delete(`${BASE}/${id}`, { headers: h(token) });
  return data;
};