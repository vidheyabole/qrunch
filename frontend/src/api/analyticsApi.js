import axios from 'axios';

export const getAnalytics = async (restaurantId, from, to, token) => {
  const { data } = await axios.get(`/api/analytics/${restaurantId}`, {
    params:  { from, to },
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};