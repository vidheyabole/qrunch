import axios from 'axios';

const BASE = '/api/tables';
const h = (token) => ({ Authorization: `Bearer ${token}` });

export const getTables = async (restaurantId, token) => {
  const { data } = await axios.get(`${BASE}/${restaurantId}`, { headers: h(token) });
  return data;
};
export const addTable = async (payload, token) => {
  const { data } = await axios.post(BASE, payload, { headers: h(token) });
  return data;
};
export const updateTable = async (id, payload, token) => {
  const { data } = await axios.put(`${BASE}/${id}`, payload, { headers: h(token) });
  return data;
};
export const deleteTable = async (id, token) => {
  const { data } = await axios.delete(`${BASE}/${id}`, { headers: h(token) });
  return data;
};
export const updateTableStatus = async (id, status, token) => {
  const { data } = await axios.patch(`${BASE}/${id}/status`, { status }, { headers: h(token) });
  return data;
};