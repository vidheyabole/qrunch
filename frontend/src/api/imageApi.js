import axios from 'axios';

export const generateDishImage = async (dishName, token) => {
  const { data } = await axios.post('/api/images/generate', { dishName }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};