import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProductById } from '../api';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productData = await getProductById(id);
        setProduct(productData);
      } catch (error) {
        console.error('Error fetching product details', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-slate-500">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="p-8">
        <p className="text-slate-600">Product not found.</p>
        <Link to="/products" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Link to="/products" className="text-blue-600 hover:underline">
        ← Back to products
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="bg-slate-100 min-h-[280px] flex items-center justify-center p-6">
            {product.image ? (
              <img src={product.image} alt={product.name} className="max-h-[350px] object-cover rounded-xl" />
            ) : (
              <div className="text-slate-400 text-lg">No image available</div>
            )}
          </div>

          <div className="p-8 space-y-5">
            <div>
              <span className="inline-block bg-slate-100 px-2 py-1 rounded-full text-xs font-medium text-slate-600">
                {product.type || 'General'}
              </span>
              <h1 className="mt-3 text-3xl font-bold text-slate-800">{product.name}</h1>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-slate-500">Quantity</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">{product.quantity}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-slate-500">Price</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">${product.prize}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-700">Location:</span> {product.place || 'Not set'}</p>
              <p><span className="font-semibold text-slate-700">Stock:</span> {product.stock || 'In Stock'}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-700 mb-2">About</p>
              <p>{product.about || 'No description available for this product.'}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductDetail;
