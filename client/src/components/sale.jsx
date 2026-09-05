import { useState } from "react";

function SellProduct({ product, onClose, onSold }) {
  const [quantity, setQuantity] = useState(1);

  const totalPrice = quantity * product.rate;

  const handleSell = async () => {
    if (quantity > product.quantity) {
      alert("Not enough stock available");
      return;
    }

    try {
      const response = await fetch(`/api/products/${product._id}/sell`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      onSold(data.product);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            Sell Product
          </h2>

          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-black"
          >
            ×
          </button>
        </div>

        <div className="mb-5 flex gap-4">
          <img
            src={product.image}
            alt={product.name}
            className="h-20 w-20 rounded-xl object-cover"
          />

          <div>
            <h3 className="font-semibold">
              {product.name}
            </h3>

            <p className="text-sm text-gray-500">
              Rate: ₹{product.rate}
            </p>

            <p className="text-sm text-gray-500">
              Available: {product.quantity}
            </p>
          </div>
        </div>

        {/* Quantity */}
        <label className="mb-2 block text-sm font-medium">
          How much do you want?
        </label>

        <input
          type="number"
          min="1"
          max={product.quantity}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
        />

        {/* Total */}
        <div className="mt-5 rounded-xl bg-gray-100 p-4">
          <div className="flex justify-between text-sm">
            <span>Rate</span>
            <span>₹{product.rate}</span>
          </div>

          <div className="mt-2 flex justify-between text-sm">
            <span>Quantity</span>
            <span>{quantity}</span>
          </div>

          <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold">
            <span>Total</span>
            <span>₹{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={handleSell}
          disabled={
            quantity < 1 ||
            quantity > product.quantity
          }
          className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          Confirm Sale
        </button>

      </div>
    </div>
  );
}

export default SellProduct;