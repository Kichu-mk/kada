import axiosInstance from './axiosInstance';

export const loginUser = async (username, password) => {
  const { data } = await axiosInstance.post('/api/auth/login', { username, password });
  return data;
};

export const registerUser = async (userData) => {
  const { data } = await axiosInstance.post('/api/auth/register', userData);
  return data;
};
