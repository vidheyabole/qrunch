import axios from 'axios';

const BASE = '/api/ai';

export const generateDescription = async (itemName, token) => {
  const { data } = await axios.post(`${BASE}/describe`, { itemName }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

export const suggestDietaryTags = async (itemName, token) => {
  const { data } = await axios.post(`${BASE}/suggest-tags`, { itemName }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

export const getUpsells = async (itemName, restaurantId) => {
  const { data } = await axios.post(`${BASE}/upsell`, { itemName, restaurantId });
  return data;
};