import { useState } from "react";
import { sellProduct } from "../api/productsApi";

const Sale = ({ product, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalPrice = quantity * product.prize;

  const handleSell = async () => {
    if (!quantity || quantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    if (quantity > product.quantity) {
      alert(`Only ${product.quantity} items available`);
      return;
    }

    try {
      setLoading(true);

      const data = await sellProduct(
        product._id,
        quantity
      );

      onSuccess(data.product);
      onClose();

    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
        "Failed to complete sale"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">

          <h2 className="text-2xl font-bold">
            Sell Product
          </h2>

          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-700"
          >
            ×
          </button>

        </div>

        {/* Product */}
        <div className="mb-6 flex gap-4 rounded-xl bg-gray-50 p-4">

          <img
            src={product.image}
            alt={product.name}
            className="h-20 w-20 rounded-xl object-cover"
          />

          <div className="flex-1">

            <h3 className="font-semibold text-gray-800">
              {product.name}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Current Rate: ₹{product.prize}
            </p>

            <p className="text-sm text-gray-500">
              Available Quantity: {product.quantity}
            </p>

          </div>

        </div>

        {/* Quantity */}
        <label className="mb-2 block text-sm font-semibold">
          How much do you want?
        </label>

        <input
          type="number"
          min="1"
          max={product.quantity}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        {/* Total */}
        <div className="mt-5 rounded-xl bg-gray-100 p-4">

          <div className="flex justify-between text-sm text-gray-600">
            <span>Rate</span>
            <span>₹{product.prize}</span>
          </div>

          <div className="mt-2 flex justify-between text-sm text-gray-600">
            <span>Quantity</span>
            <span>{quantity || 0}</span>
          </div>

          <div className="mt-3 flex justify-between border-t border-gray-300 pt-3 text-lg font-bold">
            <span>Total Price</span>

            <span className="text-blue-600">
              ₹{totalPrice.toLocaleString()}
            </span>
          </div>

        </div>

        {/* Buttons */}
        <div className="mt-6 flex gap-3">

          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={handleSell}
            disabled={
              loading ||
              quantity <= 0 ||
              quantity > product.quantity
            }
            className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Confirm Sale"}
          </button>

        </div>

      </div>
    </div>
  );
};

export default Sale;