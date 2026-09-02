import axiosInstance from './axiosInstance';

export const getDashboardSummary = async () => {
  const { data } = await axiosInstance.get('/api/dashboard');
  return data;
};

export const getHistory = async (params = {}) => {
  const { data } = await axiosInstance.get('/api/dashboard/history', { params });
  return data;
};
