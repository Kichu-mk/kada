import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProductById } from '../api';
import { IoChevronBack } from "react-icons/io5";

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 flex items-center flex-col p-6 md:p-12">
      <Link to="/products" className="text-blue-600 hover:underline h-10 w-full flex items-center justify-start">
        <IoChevronBack className='h-7 w-fit hover:h-8 hover:bg-blue-300 rounded p-0.5'/> 
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="bg-slate-200 min-h-75 flex items-center justify-center p-2 border border-slate-300 rounded-2xl shadow-sm ">
            {product.image ? (
              <img src={product.image} alt={product.name} className="aspect-auto max-h-100 object-cover rounded-2xl border-2 border-slate-500 transition-transform duration-300 hover:scale-103" />
            ) : (
              <div className="text-slate-400 text-lg">No image available</div>
            )}
          </div>

          <div className="p-8 space-y-5 bg-white border border-slate-300 rounded-2xl">
            <div className="">
              <span className="inline-block bg-slate-200 px-2 py-1 rounded-full text-xs font-medium text-slate-600 transition-transform duration-300 hover:scale-110">
                {product.type || 'General'}
              </span>
              <h1 className="mt-3 bg-linear-to-r from-blue-500 via-indigo-600 to-purple-500 bg-clip-text text-3xl font-bold text-transparent">{product.name}</h1>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-200 p-4 rounded-xl transition-transform duration-300 hover:scale-103">
                <p className="text-slate-500 text-md">Quantity</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">{product.quantity}</p>
              </div>
              <div className="bg-slate-200 p-4 rounded-xl transition-transform duration-300 hover:scale-103">
                <p className="text-slate-500 text-md">Price</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">${product.prize}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-700 ">Location:</span> {product.place || 'Not set'}</p>
              <p><span className="font-semibold text-slate-700">Stock:</span> {product.stock || 'In Stock'}</p>
            </div>

          </div>
        </div>
         <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-700 mb-2 bg-white p-2 text-xl w-20 text-center rounded-2xl border border-slate-200">About</p>
              </div>
              <p className="text-slate-600">{product.about || 'No description available for this product.'}</p>
            </div>
      </div>
    </motion.div>
  );
};

export default ProductDetail;
