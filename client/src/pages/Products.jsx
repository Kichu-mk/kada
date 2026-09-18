import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigationType } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import CameraCapture from "../components/uploadImage";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api";
import Loading from "../components/Loading";

const Products = () => {
  const { user } = useAuth();
  const navigationType = useNavigationType();
  const productsPageRef = useRef(null);
  const restoreScrollRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [productTypes, setProductTypes] = useState(["All"]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
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

  const pageSize = 18;
  const scrollStateKey = "products-page-scroll";

  useEffect(() => {
    if (navigationType !== "POP") {
      return;
    }

    try {
      const savedState = sessionStorage.getItem(scrollStateKey);
      if (savedState) {
        restoreScrollRef.current = JSON.parse(savedState);
        if (restoreScrollRef.current.search !== undefined) {
          setSearch(restoreScrollRef.current.search);
        }
        if (restoreScrollRef.current.filterType) {
          setFilterType(restoreScrollRef.current.filterType);
        }
        if (restoreScrollRef.current.page) {
          setPage(restoreScrollRef.current.page);
        }
      }
    } catch (error) {
      console.error("Could not restore products page position", error);
    }
  }, [navigationType]);

  useEffect(() => {
    if (
      loading ||
      !restoreScrollRef.current ||
      restoreScrollRef.current.page !== page ||
      !productsPageRef.current
    ) {
      return;
    }

    const scrollState = restoreScrollRef.current;
    const scrollContainer = productsPageRef.current.closest("main");
    if (scrollContainer) {
      requestAnimationFrame(() => {
        scrollContainer.scrollTo({ top: scrollState.scrollTop, behavior: "auto" });
        restoreScrollRef.current = null;
      });
    }
  }, [loading, page]);

  const fetchProducts = async (requestedPage = page) => {
    try {
      setLoading(true);
      const productData = await getProducts({
        page: requestedPage,
        limit: pageSize,
        search,
        type: filterType,
      });
      setProducts(productData.products || []);
      setTotalProducts(productData.total || 0);
      setTotalPages(productData.totalPages || 0);
      setProductTypes(productData.types?.length ? productData.types : ["All"]);
    } catch (error) {
      console.error("Error fetching products", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      const timeoutId = setTimeout(() => fetchProducts(page), 250);
      return () => clearTimeout(timeoutId);
    }
  }, [user?.token, page, search, filterType]);

  useEffect(() => {
    if (restoreScrollRef.current) {
      return;
    }
    setPage(1);
  }, [search, filterType]);

  const handleOpenModal = (product = null) => {
    setFormError("");
    if (product) {
      setCurrentProduct(product);
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
    } else {
      setCurrentProduct(null);
      setFormData({
        name: "",
        quantity: 1,
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

    if (Number(formData.quantity) < 0) {
      setFormError("Quantity cannot be negative.");
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

      if (currentProduct) {
        await updateProduct(currentProduct._id, submitData);
      } else {
        await createProduct(submitData);
      }

      await fetchProducts(page);
      handleCloseModal();
    } catch (error) {
      console.error("Error saving product", error);
      setFormError(error?.response?.data?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e, id, productName) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      try {
        await deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p._id !== id));
        setTotalProducts((prev) => Math.max(prev - 1, 0));
        if (products.length === 1 && page > 1) {
          setPage((prev) => prev - 1);
        } else {
          fetchProducts(page);
        }
      } catch (error) {
        console.error("Error deleting product", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  const visiblePages = Array.from(
    { length: Math.min(totalPages, 10) },
    (_, index) => index + 1
  );

  return (
    <motion.div
      ref={productsPageRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 sm:space-y-6 relative"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage inventory catalogue, stock status, and pricing
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="self-start sm:self-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center font-semibold text-sm transition-all duration-200 shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
        >
          <Plus size={18} className="mr-1.5" /> Add Product
        </button>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200/80 space-y-3">
        <div className="relative flex items-center bg-slate-50 rounded-xl px-3.5 py-2 border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <Search className="text-slate-400 mr-2.5 shrink-0" size={18} />
          <input
            type="text"
            placeholder="Search by name, location, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Pills (Touch scrollable) */}
        <div className="flex space-x-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
          {productTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                filterType === type
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <Loading text="Loading products..." size="md" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
          {products.map((product) => (
            <Link
              to={`/products/${product._id}`}
              key={product._id}
              onClick={() => {
                const scrollContainer = productsPageRef.current?.closest("main");
                try {
                  sessionStorage.setItem(
                    scrollStateKey,
                    JSON.stringify({
                      scrollTop: scrollContainer?.scrollTop || 0,
                      page,
                      search,
                      filterType,
                    }),
                  );
                } catch (error) {
                  console.error("Could not save products page position", error);
                }
              }}
              className="block group h-full"
            >
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 relative flex flex-col h-full hover:shadow-md hover:border-slate-300 transition-all duration-200">
                {/* Product Image & Title */}
                <div className="flex items-start space-x-3.5">
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        width="88"
                        height="88"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <ImageIcon className="text-slate-300" size={32} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {product.type || "General"}
                      </span>
                      {product.place && (
                        <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 truncate max-w-[120px]">
                          📍 {product.place}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-base sm:text-lg font-bold text-blue-600">
                      ₹{Number(product.price).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Card Footer Details */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="flex items-center space-x-1.5 text-xs">
                    <span className="text-slate-500 font-medium">Qty:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded ${
                        product.quantity <= 0
                          ? "bg-red-50 text-red-600"
                          : product.quantity < 5
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {product.quantity}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
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

                {/* Touch/Mobile & Desktop Action Buttons */}
                <div className="absolute top-3 right-3 flex space-x-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenModal(product);
                    }}
                    title="Edit Product"
                    aria-label="Edit Product"
                    className="p-1.5 sm:p-2 bg-white/90 backdrop-blur-xs text-slate-600 hover:text-blue-600 rounded-xl shadow border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, product._id, product.name)}
                    title="Delete Product"
                    aria-label="Delete Product"
                    className="p-1.5 sm:p-2 bg-white/90 backdrop-blur-xs text-slate-600 hover:text-red-600 rounded-xl shadow border border-slate-200 hover:border-red-300 transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </Link>
          ))}

          {products.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
              <p className="text-base font-medium text-slate-700">No products found</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Try adjusting your search filter or add a new product.
              </p>
              <button
                onClick={() => handleOpenModal()}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
              >
                <Plus size={16} /> Add First Product
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && totalPages > 0 && (
        <nav
          aria-label="Products pagination"
          className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-4"
        >
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
            <span className="hidden sm:inline"> ({totalProducts} products)</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page === 1}
              className="px-2.5 py-2 text-sm font-medium text-blue-600 disabled:text-slate-300 disabled:cursor-not-allowed"
            >
              PREV
            </button>
            {visiblePages.map((pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                aria-current={page === pageNumber ? "page" : undefined}
                className={`h-10 min-w-10 rounded-full px-2 text-sm font-semibold transition-colors ${
                  page === pageNumber
                    ? "bg-blue-600 text-white"
                    : "text-slate-800 hover:bg-blue-50"
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              disabled={page === totalPages}
              className="px-2.5 py-2 text-sm font-medium text-blue-600 disabled:text-slate-300 disabled:cursor-not-allowed"
            >
              NEXT
            </button>
          </div>
        </nav>
      )}

      {/* Add / Edit Product Modal */}
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
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 shrink-0">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                    {currentProduct ? "Edit Product" : "Add New Product"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {currentProduct ? "Update item information" : "Create a new inventory listing"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  aria-label="Close dialog"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="overflow-y-auto p-5 sm:p-6 flex-1">
                {formError && (
                  <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs sm:text-sm text-red-600 border border-red-200 flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form id="productForm" onSubmit={handleSave} className="space-y-4">
                  {/* Image Upload / Capture Section */}
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
                          <ImageIcon className="mx-auto mb-1 text-slate-400" size={28} />
                          <span className="text-[11px] font-medium block">Add Photo</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Change photo"
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

                  {/* Product Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      placeholder="e.g. Wireless Mouse, Cotton Shirt"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>

                  {/* Category & Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                        Category / Type
                      </label>
                      <input
                        list="productTypeDatalist"
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        placeholder="e.g. Electronics, Clothing"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                      />
                      <datalist id="productTypeDatalist">
                        {productTypes
                          .filter((t) => t !== "All")
                          .map((t, idx) => (
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
                            price: e.target.value === "" ? "" : Number(e.target.value),
                          })
                        }
                        required
                        placeholder="0.00"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                  </div>

                  {/* Quantity & Stock Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                        Quantity in Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => {
                          const val = e.target.value === "" ? "" : Number(e.target.value);
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

                  {/* Storage Location */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                      Storage Place / Shelf
                    </label>
                    <input
                      type="text"
                      value={formData.place}
                      onChange={(e) =>
                        setFormData({ ...formData, place: e.target.value })
                      }
                      placeholder="e.g. Shelf A3, Top Rack, Warehouse B"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                      Description & Notes
                    </label>
                    <textarea
                      value={formData.about}
                      onChange={(e) =>
                        setFormData({ ...formData, about: e.target.value })
                      }
                      placeholder="Add details, serial numbers, warranty, or product specifications..."
                      rows="3"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                </form>
              </div>

              {/* Modal Actions Footer */}
              <div className="flex items-center justify-end space-x-3 px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  form="productForm"
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-md shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? "Saving..." : currentProduct ? "Update Product" : "Save Product"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Products;
