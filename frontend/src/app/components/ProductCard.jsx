// src/app/components/ProductCard.jsx
"use client";
import React, { useState } from "react";
import PurchaseModal from "./PurchaseModal";

export default function ProductCard({ product, onPurchaseSuccess }) {
  const [open, setOpen] = useState(false);

  // Safeguard: product fields
  const img = product.picture_url || "/placeholder.png";

  return (
    <>
      <div
        className="bg-gray-700 rounded-lg p-4 shadow-lg cursor-pointer transform transition duration-200 hover:scale-105"
        onClick={() => setOpen(true)}
      >
        <div className="relative overflow-hidden rounded">
          <img src={img} alt={product.name} className="w-full h-40 object-cover rounded" />
        </div>

        <div className="mt-3">
          <h3 className="text-white text-lg font-semibold">{product.name}</h3>
          <p className="text-gray-300 text-sm">{product.brand_name || "No Brand"}</p>
          <p className="text-blue-400 font-semibold mt-2">₨ {product.price}</p>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent opening modal twice
              setOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Buy Now
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              // toggle bookmark / cart etc. placeholder
              alert("Bookmark functionality coming soon");
            }}
            className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded"
          >
            🔖
          </button>
        </div>
      </div>

      {open && (
        <PurchaseModal
          product={product}
          onClose={() => setOpen(false)}
          onSuccess={() => {
            onPurchaseSuccess && onPurchaseSuccess();
          }}
        />
      )}
    </>
  );
}
