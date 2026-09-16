import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit2, Trash2, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import CameraCapture from "../components/uploadImage";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api";

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [saving, setSaving] = useState(false);
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

  const fetchProducts = async () => {
    try {
      const productData = await getProducts();
      setProducts(productData);
    } catch (error) {
      console.error("Error fetching products", error);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchProducts();
    }
  }, [user?.token]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({
        name: product.name,
        quantity: product.quantity,
        place: product.place,
        type: product.type || "General",
        price: product.price,
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
        price: 0,
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
      submitData.append("price", String(formData.price));
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
      } catch (error) {
        console.error("Error deleting product", error);
      }
    }
  };

  // const updateQuantity = async (e, product, delta) => {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     const newQuantity = Math.max(0, product.quantity + delta);
  //     if (newQuantity === product.quantity) return;

  //     try {
  //         await updateProduct(product._id, { quantity: newQuantity });
  //         setProducts((currentProducts) =>
  //             currentProducts.map((p) =>
  //                 p._id === product._id ? { ...p, quantity: newQuantity } : p
  //             )
  //         );
  //     } catch (error) {
  //         console.error('Error updating quantity', error);
  //     }
  // };

  const productTypes = [
    "All",
    ...new Set(products.map((p) => p.type || "General")),
  ];

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchType =
      filterType === "All" || (p.type || "General") === filterType;
    return matchSearch && matchType;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 relative"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Products</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm"
        >
          <Plus size={20} className="mr-2" /> Add Product
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center">
          <Search className="text-slate-400 mr-3" size={20} />
          <input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none text-slate-700"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2">
          {productTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filterType === type
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Link to={`/products/${product._id}`} key={product._id}>
            <motion.div
              layoutId={product._id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative group overflow-hidden hover:shadow-md transition-all cursor-pointer h-full flex flex-col"
            >
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="text-slate-300" size={32} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1">
                      {product.name}
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                    {product.type || "General"}
                  </span>
                  <div className="mt-2 text-sm text-slate-600">
                    <div className="font-medium text-blue-600">
                      ₹{product.price}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <div className="flex items-center space-x-3 bg-slate-50 p-1 rounded-lg border border-slate-200">
                  <span className="text-sm text-slate-500">Available :</span>
                  <span className="font-bold w-6">{product.quantity}</span>
                </div>

                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock === "In Stock" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {product.stock}
                </span>
              </div>

              <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpenModal(product);
                  }}
                  className="p-2 bg-white text-slate-600 hover:text-blue-600 rounded-full shadow border border-slate-100 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => handleDelete(e, product._id)}
                  className="p-2 bg-white text-slate-600 hover:text-red-600 rounded-full shadow border border-slate-100 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          </Link>
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
            No products found matching your criteria.
          </div>
        )}
      </div>

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
              <h2 className="text-2xl font-bold text-blue-600 mb-6">
                {currentProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                {/* IMAGE SECTION */}
                <div className="flex flex-col items-center mb-6">

                {/* IMAGE PREVIEW */}
                <div
                    className="
                        w-32 h-32
                        rounded-xl
                        bg-slate-100
                        border-2 border-dashed
                        border-slate-300
                        flex items-center
                        justify-center
                        overflow-hidden
                        relative group
                    "
                >
                    {imagePreview ? (
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="
                                w-full h-full
                                object-cover
                            "
                        />
                    ) : (
                        <div className="text-center text-slate-400">
                            <ImageIcon
                                className="mx-auto mb-1"
                            />

                            <span className="text-xs">
                                Upload Photo
                            </span>
                        </div>
                    )}

                    <div
                        className="
                            absolute inset-0
                            bg-black/40
                            flex items-center
                            justify-center
                            opacity-0
                            group-hover:opacity-100
                            transition-opacity
                        "
                    >
                        <span className="text-white text-xs">
                            Change Image
                        </span>
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="
                            absolute inset-0
                            w-full h-full
                            opacity-0 cursor-pointer
                        "
                    />
                </div>

                {/* BUTTONS */}
                <div className="flex gap-2 mt-3">

                    {/* UPLOAD */}
                    <label
                        className="
                            flex items-center gap-2
                            px-4 py-2
                            bg-slate-100
                            text-slate-700
                            rounded-lg
                            text-sm font-medium
                            cursor-pointer
                            hover:bg-slate-200
                        "
                    >
                        <ImageIcon size={16} />

                        Upload

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </label>

                    {/* CAMERA */}
                    <CameraCapture
                        onCapture={(file, preview) => {
                            setFormData((previousFormData) => ({
                              ...previousFormData,
                              image: file,
                            }));
                            setImagePreview(preview);
                        }}
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
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
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
                    type="submit"
                    disabled={saving}
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

export default Products;
