import axios from 'axios';

const BASE = '/api/customer';

export const getRestaurantInfo = async (restaurantId, tableId) => {
  const { data } = await axios.get(`${BASE}/info/${restaurantId}/${tableId}`);
  return data;
};

export const getPublicMenu = async (restaurantId, lang = 'en') => {
  const { data } = await axios.get(`${BASE}/menu/${restaurantId}`, { params: { lang } });
  return data;
};

export const getRecommendations = async (restaurantId, phone, lang = 'en') => {
  if (!phone) return [];
  const { data } = await axios.get(`${BASE}/recommendations/${restaurantId}/${phone}`, { params: { lang } });
  return data;
};

export const placeOrder = async (payload) => {
  const { data } = await axios.post(`${BASE}/order`, payload);
  return data;
};