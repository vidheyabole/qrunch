import axios from 'axios';

const BASE = '/api/restaurants';

export const createRestaurant = async (name, token) => {
  const { data } = await axios.post(BASE, { name }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};