import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getProductById,
  updateProduct,
  deleteProduct,
  getProducts,
} from "../api";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Image as ImageIcon,
  ShoppingCart,
  MapPin,
  Tag,
  Box,
  X,
  AlertCircle,
} from "lucide-react";
import Sale from "../components/sale";
import MonthlySalesGraph from "../components/MonthlySalesGraph";
import CameraCapture from "../components/uploadImage";
import Loading from "../components/Loading";

const ProductDetail = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSale, setShowSale] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [productTypes, setProductTypes] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    quantity: 0,
    place: "",
    about: "",
    type: "General",
    price: 0,
    stock: "In Stock",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const productData = await getProductById(id);
      setProduct(productData);
    } catch (error) {
      console.error("Error fetching product details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token && id) {
      fetchProduct();
    }
  }, [user?.token, id]);

  // Load product categories for datalist
  useEffect(() => {
    getProducts()
      .then((items) => {
        if (items) {
          const types = Array.from(
            new Set(items.map((p) => p.type || "General")),
          ).filter(Boolean);
          setProductTypes(types);
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenModal = () => {
    if (!product) return;
    setFormError("");
    setFormData({
      name: product.name || "",
      quantity: product.quantity ?? 0,
      place: product.place || "",
      type: product.type || "General",
      price: product.price ?? 0,
      stock: product.stock || "In Stock",
      image: null,
      about: product.about || "",
    });
    setImagePreview(product.image || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Product name is required.");
      return;
    }

    if (Number(formData.price) < 0) {
      setFormError("Price cannot be negative.");
      return;
    }

    setSaving(true);
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name.trim());
      submitData.append("quantity", String(Number(formData.quantity) || 0));
      submitData.append("place", formData.place.trim());
      submitData.append("type", formData.type.trim() || "General");
      submitData.append("price", String(Number(formData.price) || 0));
      submitData.append("stock", formData.stock);
      submitData.append("about", formData.about.trim());
      if (formData.image) {
        submitData.append("image", formData.image);
      }

      await updateProduct(product._id, submitData);
      await fetchProduct();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving product", error);
      setFormError(
        error?.response?.data?.message || "Failed to update product.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        await deleteProduct(product._id);
        navigate("/products");
      } catch (error) {
        console.error("Error deleting product", error);
        alert("Failed to delete product.");
      }
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loading text="Loading product details..." size="md" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8 max-w-lg mx-auto shadow-sm">
        <p className="text-base font-semibold text-slate-800">
          Product not found
        </p>
        <p className="text-xs text-slate-500 mt-1">
          The product may have been removed or deleted.
        </p>
        <Link
          to="/products"
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm"
        >
          <ArrowLeft size={16} /> Back to Products
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 shadow-xs text-xs sm:text-sm font-semibold transition-all duration-150"
        >
          <ArrowLeft size={16} /> Back to Products
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 hover:text-blue-600 rounded-xl border border-slate-200 hover:border-blue-300 shadow-xs text-xs sm:text-sm font-semibold transition"
          >
            <Edit2 size={15} /> Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 hover:text-red-600 rounded-xl border border-slate-200 hover:border-red-300 shadow-xs text-xs sm:text-sm font-semibold transition"
          >
            <Trash2 size={15} /> Delete
          </button>
          <button
            type="button"
            onClick={() => setShowSale(true)}
            disabled={product.quantity <= 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={16} />
            <span>
              {product.quantity <= 0 ? "Out of Stock" : "Sell Product"}
            </span>
          </button>
        </div>
      </div>

      {/* Main Product Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 sm:p-7">
          {/* Product Image Column */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-4 border border-slate-200/60 min-h-[220px] sm:min-h-[300px]">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="max-h-72 w-full object-contain rounded-xl"
              />
            ) : (
              <div className="text-center text-slate-400 py-12">
                <ImageIcon size={48} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">No photo uploaded</p>
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200/60 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  <Tag size={12} /> {product.type || "General"}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    product.stock === "In Stock"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : product.stock === "Low Stock"
                        ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                        : "bg-red-50 text-red-700 border border-red-200/60"
                  }`}
                >
                  {product.stock}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                {product.name}
              </h1>

              <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-blue-600">
                ₹{Number(product.price).toLocaleString()}
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Available Qty
                </span>
                <span className="text-lg sm:text-xl font-bold text-slate-800 mt-0.5 block">
                  {product.quantity}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Storage Place
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block truncate">
                  {product.place || "Not specified"}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Status
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block">
                  {product.quantity > 0 ? "Ready to sell" : "Needs restock"}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Product Description
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                {product.about ||
                  "No detailed description provided for this item."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Sales Performance Graph */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <MonthlySalesGraph productId={product._id} />
      </div>

      {/* Sale Modal */}
      {showSale && (
        <Sale
          product={product}
          onClose={() => setShowSale(false)}
          onSuccess={(updatedProduct) => {
            setProduct(updatedProduct);
          }}
        />
      )}

      {/* Edit Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3.5 sm:p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseModal();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-auto max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 shrink-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Edit Product Details
                </h2>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto p-5 sm:p-6 flex-1">
                {formError && (
                  <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs sm:text-sm text-red-600 border border-red-200 flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                <form
                  id="editProductForm"
                  onSubmit={handleSave}
                  className="space-y-4"
                >
                  {/* Photo Preview & Upload */}
                  <div className="flex flex-col items-center pb-2">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Product Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center text-slate-400 p-2">
                          <ImageIcon
                            className="mx-auto mb-1 text-slate-400"
                            size={28}
                          />
                          <span className="text-[11px] font-medium block">
                            Add Photo
                          </span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>

                    <div className="flex gap-2 mt-2.5">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-200 transition">
                        <ImageIcon size={14} />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>

                      <CameraCapture
                        onCapture={(file, preview) => {
                          setFormData((prev) => ({ ...prev, image: file }));
                          setImagePreview(preview);
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                        Category / Type
                      </label>
                      <input
                        list="detailTypeDatalist"
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                      />
                      <datalist id="detailTypeDatalist">
                        {productTypes.map((t, idx) => (
                          <option key={idx} value={t} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                        Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          })
                        }
                        required
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => {
                          const val =
                            e.target.value === "" ? "" : Number(e.target.value);
                          let autoStock = formData.stock;
                          if (val === 0) autoStock = "Out of Stock";
                          else if (val < 5) autoStock = "Low Stock";
                          else autoStock = "In Stock";

                          setFormData({
                            ...formData,
                            quantity: val,
                            stock: autoStock,
                          });
                        }}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                        Stock Status
                      </label>
                      <select
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData({ ...formData, stock: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition bg-white"
                      >
                        <option value="In Stock">In Stock</option>
                        <option value="Low Stock">Low Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                      Storage Location
                    </label>
                    <input
                      type="text"
                      value={formData.place}
                      onChange={(e) =>
                        setFormData({ ...formData, place: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.about}
                      onChange={(e) =>
                        setFormData({ ...formData, about: e.target.value })
                      }
                      rows="3"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                </form>
              </div>

              <div className="flex items-center justify-end space-x-3 px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  form="editProductForm"
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-md shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Update Product"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductDetail;
