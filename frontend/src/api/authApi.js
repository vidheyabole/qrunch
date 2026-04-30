import axios from 'axios';

const BASE = '/api/auth';

export const loginUser = async (email, password) => {
  const { data } = await axios.post(`${BASE}/login`, { email, password });
  return data;
};

export const registerUser = async (form) => {
  const { data } = await axios.post(`${BASE}/register`, form);
  return data;
};

export const getMe = async (token) => {
  const { data } = await axios.get(`${BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

export const updateProfile = async (data, token) => {
  const { data: res } = await axios.put(`${BASE}/profile`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res;
};

export const updateProfilePicture = async (file, token) => {
  const fd = new FormData();
  fd.append('image', file);
  const { data } = await axios.post(`${BASE}/profile/picture`, fd, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

export const updateRestaurantLogo = async (file, restaurantId, token) => {
  const fd = new FormData();
  fd.append('image', file);
  fd.append('restaurantId', restaurantId);
  const { data } = await axios.post(`${BASE}/restaurant/logo`, fd, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

export const connectGoogleAccount = async (googleId, avatar, token) => {
  const { data } = await axios.post(`${BASE}/connect-google`, { googleId, avatar }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

export const disconnectGoogleAccount = async (token) => {
  const { data } = await axios.post(`${BASE}/disconnect-google`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

export const initiateGoogleLogin = () => {
  window.location.href = '/api/auth/google';
};