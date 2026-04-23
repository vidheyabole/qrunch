import axios from 'axios';

const BASE = '/api/orders';
const h = (token) => ({ Authorization: `Bearer ${token}` });

export const getOrders = async (restaurantId, token, status = '') => {
  const url = status ? `${BASE}/${restaurantId}?status=${status}` : `${BASE}/${restaurantId}`;
  const { data } = await axios.get(url, { headers: h(token) });
  return data;
};

export const updateOrderStatus = async (id, status, token) => {
  const { data } = await axios.patch(`${BASE}/${id}/status`, { status }, { headers: h(token) });
  return data;
};