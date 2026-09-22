import React, { useState } from "react";
import { sellProduct } from "../api/productsApi";
import { X, ShoppingBag, Plus, Minus, AlertCircle, CheckCircle2 } from "lucide-react";

const Sale = ({ product, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const parsedQty = Math.max(0, Number(quantity) || 0);
  const totalPrice = parsedQty * (product?.price || 0);

  const incrementQty = () => {
    if (parsedQty < (product?.quantity || 0)) {
      setQuantity(parsedQty + 1);
      setError("");
    }
  };

  const decrementQty = () => {
    if (parsedQty > 1) {
      setQuantity(parsedQty - 1);
      setError("");
    }
  };

  const handleSell = async () => {
    setError("");

    if (!parsedQty || parsedQty <= 0) {
      setError("Please enter a valid quantity of at least 1.");
      return;
    }

    if (parsedQty > product.quantity) {
      setError(`Only ${product.quantity} items available in stock.`);
      return;
    }

    try {
      setLoading(true);
      const data = await sellProduct(product._id, parsedQty);
      onSuccess(data.product);
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to complete sale."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl my-auto overflow-hidden">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800">
            <ShoppingBag size={20} className="text-blue-600" />
            <h2 className="text-lg sm:text-xl font-bold">Sell Product</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sale modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs sm:text-sm text-red-600 border border-red-200 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Product Summary Card */}
        <div className="mb-5 flex items-center gap-3.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-200/70">
          <div className="h-16 w-16 rounded-xl bg-white p-1 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <ShoppingBag size={24} className="text-slate-300" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-slate-800 truncate">
              {product.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Price per unit: <strong className="text-blue-600">₹{product.price}</strong>
            </p>
            <p className="text-[11px] text-slate-400">
              In Stock: {product.quantity}
            </p>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="mb-5">
          <label className="mb-2 block text-xs sm:text-sm font-semibold text-slate-700">
            Quantity to Sell
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={decrementQty}
              disabled={parsedQty <= 1}
              className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition font-bold"
            >
              <Minus size={16} />
            </button>

            <input
              type="number"
              min="1"
              max={product.quantity}
              value={quantity}
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Number(e.target.value);
                setQuantity(val);
                setError("");
              }}
              className="flex-1 h-11 text-center font-bold text-base sm:text-lg rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />

            <button
              type="button"
              onClick={incrementQty}
              disabled={parsedQty >= product.quantity}
              className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition font-bold"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Total Summary */}
        <div className="mb-6 rounded-2xl bg-slate-50 p-4 border border-slate-200/70 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Rate</span>
            <span className="font-semibold text-slate-700">₹{product.price}</span>
          </div>

          <div className="flex justify-between text-slate-500">
            <span>Quantity</span>
            <span className="font-semibold text-slate-700">{parsedQty}</span>
          </div>

          <div className="flex justify-between border-t border-slate-200 pt-2.5 text-sm sm:text-base font-bold text-slate-800">
            <span>Total Amount</span>
            <span className="text-blue-600 text-lg font-extrabold">
              ₹{totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSell}
            disabled={loading || parsedQty <= 0 || parsedQty > product.quantity}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Confirm Sale"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sale;
