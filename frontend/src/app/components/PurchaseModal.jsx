// src/app/components/PurchaseModal.jsx
"use client";

import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

export default function PurchaseModal({ product, onClose, onSuccess }) {
  // product expected shape: { product_id, name, price, seller_id, picture_url }
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  // Validation functions
  const validateProduct = () => {
    if (!product) return "⚠ Product information is missing";
    if (!product.product_id) return "⚠ Invalid product ID";
    if (!product.price || isNaN(product.price) || product.price <= 0) {
      return "⚠ Invalid product price";
    }
    if (!product.name) return "⚠ Product name is missing";
    if (!product.seller_id) return "⚠ Seller information is missing";
    return null;
  };

  const validateBuyerAuth = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) return "⚠ Please log in to make a purchase";
    if (role !== "buyer") return "⚠ Only buyers can purchase products";
    return null;
  };

  const validateStripeInitialization = () => {
    if (!stripe || !elements) {
      return "⚠ Payment system is loading. Please wait...";
    }
    return null;
  };

  const cardOptions = {
    style: {
      base: {
        color: "#ffffff",
        fontSize: "16px",
        "::placeholder": { color: "#9ca3af" },
      },
      invalid: { color: "#ff6b6b" },
    },
  };

  const handlePay = async () => {
    // Validate product
    const productError = validateProduct();
    if (productError) {
      alert(productError);
      return;
    }

    // Validate buyer authentication
    const authError = validateBuyerAuth();
    if (authError) {
      alert(authError);
      onClose && onClose();
      return;
    }

    // Validate Stripe initialization
    const stripeError = validateStripeInitialization();
    if (stripeError) {
      alert(stripeError);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return alert("Please log in as buyer to purchase.");

    setLoading(true);
    try {
      // 1) Create PaymentIntent on backend
      const createRes = await fetch("http://localhost:5000/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Backend expects productId; keep compatibility by sending both keys
        body: JSON.stringify({ productId: product.product_id, product_id: product.product_id }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create payment intent");
      }

      const { clientSecret } = await createRes.json();

      // Validate clientSecret
      if (!clientSecret) {
        throw new Error("⚠ Payment initialization failed. Please try again.");
      }

      // 2) Confirm card payment with Stripe
      const card = elements.getElement(CardElement);
      if (!card) {
        throw new Error("⚠ Card information is missing");
      }

      const confirm = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (confirm.error) throw new Error(confirm.error.message || "Payment failed");

      if (confirm.paymentIntent && confirm.paymentIntent.status === "succeeded") {
        // 3) Save purchase to backend (store PKR amount and stripe id)
        const saveRes = await fetch("http://localhost:5000/save-purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_id: product.product_id,
            seller_id: product.seller_id,
            amount: product.price, // PKR amount shown to user
            stripe_payment_id: confirm.paymentIntent.id,
            currency: "PKR",
          }),
        });

        if (!saveRes.ok) {
          const err = await saveRes.json().catch(() => ({}));
          // warn but still consider payment succeeded; you may retry saving
          throw new Error(err.message || "Payment succeeded but failed to save purchase");
        }

        alert("Payment successful — purchase saved!");
        onSuccess && onSuccess();
        onClose && onClose();
      } else {
        throw new Error("Payment not completed");
      }
    } catch (err) {
      console.error(err);
      alert("Payment error: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 px-4" style={{ zIndex: 2000 }}>
      <div className="bg-gray-900 w-full max-w-lg rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl text-white font-semibold">{product.name}</h3>
            <p className="text-gray-300 mt-1">₨ {product.price}</p>
          </div>
          <button
            onClick={() => onClose && onClose()}
            className="text-gray-300 hover:text-white text-xl"
            aria-label="Close"
          >
            ✖
          </button>
        </div>

        <div className="mt-4">
          <div className="bg-gray-800 p-3 rounded">
            <CardElement options={cardOptions} />
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => onClose && onClose()}
            className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={handlePay}
            disabled={loading}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            {loading ? "Processing..." : `Pay ₨ ${product.price}`}
          </button>
        </div>
      </div>
    </div>
  );
}
