import axiosInstance from './axiosInstance';

export const loginUser = async (username, password) => {
  const { data } = await axiosInstance.post('/api/auth/login', { username, password });
  return data;
};

export const registerUser = async (userData) => {
  const { data } = await axiosInstance.post('/api/auth/register', userData);
  return data;
};

export const verifyRegistrationOtp = async (registrationId, otp) => {
  const { data } = await axiosInstance.post('/api/auth/register/verify', { registrationId, otp });
  return data;
};

export const resendRegistrationOtp = async (registrationId) => {
  const { data } = await axiosInstance.post('/api/auth/register/resend-otp', { registrationId });
  return data;
};

export const requestPasswordReset = async (email) => {
  const { data } = await axiosInstance.post('/api/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (token, password, confirmPassword) => {
  const { data } = await axiosInstance.post(`/api/auth/reset-password/${token}`, {
    password,
    confirmPassword
  });
  return data;
};

export const updateProfile = async (profileData) => {
  const { data } = await axiosInstance.put('/api/auth/profile', profileData);
  return data;
};

export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  const { data } = await axiosInstance.put('/api/auth/change-password', {
    currentPassword,
    newPassword,
    confirmPassword,
  });
  return data;
};
