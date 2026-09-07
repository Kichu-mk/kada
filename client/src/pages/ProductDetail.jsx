import React, { useEffect, useState } from "react";
import { useAuth } from '../context/AuthContext';
import { useParams, Link, useNavigate  } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from "../api";
import { IoChevronBack } from "react-icons/io5";
import Sale from "../components/sale";
import { Edit2, Trash2, Image as ImageIcon } from 'lucide-react';

const ProductDetail = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSale, setShowSale] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    quantity: 0,
    place: "",
    about: "",
    type: "General",
    prize: 0,
    stock: "In Stock",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  const fetchProducts = async () => {
          try {
              const productData = await getProducts();
              setProducts(productData);
          } catch (error) {
              console.error('Error fetching products', error);
          }
  };
  const fetchProduct = async () => {
      try {
        const productData = await getProductById(id);
        setProduct(productData);
      } catch (error) {
        console.error("Error fetching product details", error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchProducts();
    fetchProduct();
  }, [user?.token, id]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({
        name: product.name,
        quantity: product.quantity,
        place: product.place,
        type: product.type || "General",
        prize: product.prize,
        stock: product.stock,
        image: null,
        about: product.about || "",
      });
      setImagePreview(product.image || null);
    } else {
      setCurrentProduct(null);
      setFormData({
        name: "",
        quantity: 0,
        place: "",
        type: "General",
        prize: 0,
        stock: "In Stock",
        image: null,
        about: "",
      });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setFormData({ ...formData, image: e.target.files[0] });
            setImagePreview(URL.createObjectURL(e.target.files[0]));
        }
    };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("quantity", String(formData.quantity));
      submitData.append("place", formData.place);
      submitData.append("type", formData.type);
      submitData.append("prize", String(formData.prize));
      submitData.append("stock", formData.stock);
      submitData.append("about", formData.about);
      if (formData.image) {
        submitData.append("image", formData.image);
      }
      if (currentProduct) {
        await updateProduct(currentProduct._id, submitData);
      } else {
        await createProduct(submitData);
      }
      await fetchProduct();
      await fetchProducts();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving product", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        await fetchProducts();
        navigate("/products"); 
      } catch (error) {
        console.error("Error deleting product", error);
      }
    }
  };

  const productTypes = ['All', ...new Set(products.map((p) => p.type || 'General'))];

  if (loading) {
    return <div className="p-8 text-slate-500">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="p-8">
        <p className="text-slate-600">Product not found.</p>
        <Link
          to="/products"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative space-y-6 flex items-center flex-col p-6 md:p-12 rounded-2xl min-h-1/2 overflow-hidden"
    >
      {product?.image && (
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center scale-110 blur-2xl opacity-40 pointer-events-none"
          style={{ backgroundImage: `url(${product.image})` }}
        />
      )}


      <Link
        to="/products"
        className="text-blue-600 hover:underline h-10 w-full flex items-center justify-start"
      >
        <IoChevronBack className="h-7 w-fit hover:h-8 hover:bg-blue-300 rounded p-0.5" />
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="bg-slate-200 min-h-75 flex items-center justify-center p-2 border border-slate-300 rounded-2xl shadow-sm ">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="aspect-auto max-h-100 object-cover rounded-2xl border-2 border-slate-500 transition-transform duration-300 hover:scale-103"
              />
            ) : (
              <div className="text-slate-400 text-lg">No image available</div>
            )}
          </div>

          <div className="p-8 space-y-5 bg-white border border-slate-300 rounded-2xl">
            <div className="">
              <span className="inline-block bg-slate-200 px-2 py-1 rounded-full text-xs font-medium text-slate-600 transition-transform duration-300 hover:scale-110">
                {product.type || "General"}
              </span>
              
              <h1 className="mt-3 bg-linear-to-r from-blue-500 via-indigo-600 to-purple-500 bg-clip-text text-3xl font-bold text-transparent">
                {product.name}
              </h1>
            </div>
            <div className="flex space-x-2 transition-opacity">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpenModal(product);
                  }}
                  className="p-2 bg-white text-slate-600 hover:text-blue-600 rounded-full shadow border border-slate-100 transition-colors"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={(e) => handleDelete(e, product._id)}
                  className="p-2 bg-white text-slate-600 hover:text-red-600 rounded-full shadow border border-slate-100 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-200 p-4 rounded-xl transition-transform duration-300 hover:scale-103">
                <p className="text-slate-500 text-md">Quantity</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">
                  {product.quantity}
                </p>
              </div>
              <div className="bg-slate-200 p-4 rounded-xl transition-transform duration-300 hover:scale-103">
                <p className="text-slate-500 text-md">Price</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">
                  ₹{product.prize}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-700 ">Location:</span>{" "}
                {product.place || "Not set"}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Stock:</span>{" "}
                {product.stock || "In Stock"}
              </p>
            </div>
            <button
              onClick={() => setShowSale(true)}
              disabled={product.quantity <= 0}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {product.quantity <= 0 ? "Out of Stock" : "Sell"}
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 text-sm text-slate-600">
          <div>
            <p className="font-semibold text-slate-700 mb-2 bg-white p-2 text-xl w-20 text-center rounded-2xl border border-slate-200">
              About
            </p>
          </div>
          <p className="text-slate-600 whitespace-pre-line">
            {product.about || "No description available for this product."}
          </p>
        </div>
      </div>
      {showSale && (
        <Sale
          product={product}
          onClose={() => setShowSale(false)}
          onSuccess={(updatedProduct) => {
            setProduct(updatedProduct);
          }}
        />
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl my-8"
            >
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                {currentProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-32 h-32 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <ImageIcon className="mx-auto mb-1" />
                        <span className="text-xs">Upload Photo</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-medium">
                        Change Image
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Type/Category
                    </label>
                    <input
                      list="typeData"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      placeholder="e.g. Electronics, Clothing"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <datalist id="typeData">
                      {productTypes
                        .filter((type) => type !== "All")
                        .map((type, index) => (
                          <option key={index} value={type} />
                        ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.prize}
                      onChange={(e) =>
                        setFormData({ ...formData, prize: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Stock Status
                    </label>
                    <select
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Low Stock">Low Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Storage Location (Place)
                  </label>
                  <input
                    type="text"
                    value={formData.place}
                    onChange={(e) =>
                      setFormData({ ...formData, place: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Product Description
                  </label>
                  <textarea
                    value={formData.about}
                    onChange={(e) =>
                      setFormData({ ...formData, about: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows="3"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={saving}
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {saving ? "Saving..." : "Save Product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductDetail;
