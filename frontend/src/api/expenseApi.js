import axios from 'axios';

const BASE = '/api/expenses';
const h    = (token) => ({ Authorization: `Bearer ${token}` });

export const getExpenses   = async (restaurantId, period, token) => {
  const { data } = await axios.get(`${BASE}/${restaurantId}?period=${period}`, { headers: h(token) });
  return data;
};

export const addExpense    = async (body, token) => {
  const { data } = await axios.post(BASE, body, { headers: h(token) });
  return data;
};

export const deleteExpense = async (id, token) => {
  const { data } = await axios.delete(`${BASE}/${id}`, { headers: h(token) });
  return data;
};