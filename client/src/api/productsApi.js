import axiosInstance from './axiosInstance';

export const getProducts = async () => {
  const { data } = await axiosInstance.get('/api/products');
  return data;
};

export const getProductById = async (productId) => {
  const { data } = await axiosInstance.get(`/api/products/${productId}`);
  return data;
};

export const createProduct = async (productData) => {
  const { data } = await axiosInstance.post('/api/products', productData, {
    headers: productData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return data;
};

export const updateProduct = async (productId, productData) => {
  const { data } = await axiosInstance.put(`/api/products/${productId}`, productData, {
    headers: productData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return data;
};

export const deleteProduct = async (productId) => {
  const { data } = await axiosInstance.delete(`/api/products/${productId}`);
  return data;
};
