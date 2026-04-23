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