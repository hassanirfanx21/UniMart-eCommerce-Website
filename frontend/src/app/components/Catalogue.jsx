"use client";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import PurchaseModal from "../components/PurchaseModal";
import AdvertisementSlider from "../components/AdvertisementSlider";

import { useRouter } from "next/navigation"; //this is for redirection with const router = useRouter();
import { X } from "lucide-react"; //for close icon in modal popup
//this is the catalogue page where all products are displayed
// products are fetched from backend and displayed in a grid
// user can filter products by section using tabs
export default function Catalogue() {
  const [products, setProducts] = useState({
    //use object to store products by section
    study_tools: [],
    clothes: [],
    food: [],
  });

  const [activeTab, setActiveTab] = useState("study_tools");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null); // ✅ For modal
  const [searchQuery, setSearchQuery] = useState(""); // this is a state for search query
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  //----------------------------------------------
  //----------------------------------------------
  // Feedback UI states (add these near other useState declarations)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]); // array of feedback objects
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Add feedback sub-modal
  const [showAddFeedbackModal, setShowAddFeedbackModal] = useState(false);
  const [newFeedbackMessage, setNewFeedbackMessage] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  //----------------------------------------------
  //----------------------------------------------
  ///
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) {
      // this means user is not logged in
      alert("Please log in first.");
      router.push("/login");
      return;
    }
    if (!token || role !== "buyer") {
      alert("Access denied! Only buyer can add products.");
      router.push("/"); // redirect to homepage or login
    }
  }, []);
  //fetch products from backend on component mount
  useEffect(() => {
    const token = localStorage.getItem("token"); // ✅ Get token

    fetch("http://localhost:5000/products", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ Add auth header for buyer only route
      },
    })
      .then((res) => {
        if (!res.ok) {
          alert("Unauthorized or server error");
          router.push("/login"); // ✅ Redirect on invalid token
          throw new Error("Unauthorized");
        }
        return res.json();
      })

      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
  }, []);
  
  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  //-----------------------Rating function---    ----------------------------- ----------------- -----------------
  const handleRating = async (type) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("⚠ Please log in first");
    
    // Validate rating type
    if (type !== "up" && type !== "down") {
      return alert("⚠ Invalid rating type");
    }
    
    // Validate product
    if (!selectedProduct || !selectedProduct.product_id) {
      return alert("⚠ Invalid product selected");
    }

    try {
      // 1️⃣ Send the rating to backend
      const rateRes = await fetch("http://localhost:5000/rate-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: selectedProduct.product_id,
          rating: type,
        }),
      });
      
      if (!rateRes.ok) {
        const errorData = await rateRes.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit rating");
      }

      // 2️⃣ Fetch updated product counts
      const res = await fetch("http://localhost:5000/products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) throw new Error("Failed to fetch updated products");
      
      const updatedProducts = await res.json();

      // 3️⃣ Update both products grid & modal
      setProducts(updatedProducts);
      // Update modal product with new counts
      const updatedSelected = Object.values(updatedProducts)
        .flat()
        .find((p) => p.product_id === selectedProduct.product_id);
      
      if (updatedSelected) {
        setSelectedProduct(updatedSelected);
      }

      alert(`✅ You RATED this product`);
    } catch (err) {
      console.error("Rating error:", err);
      alert("⚠ " + (err.message || "Failed to rate product"));
    }
  };
  /////_____________________________________________________________________________-
  /////_____________________________________________________________________________-
  /////_____________________________________________________________________________-
  ///this function filters products based on search query based on name only for now.......
  const getFilteredProducts = () => {
    const items = products[activeTab] || [];
    if (!searchQuery) return items;
    
    // Sanitize search query to prevent XSS
    const sanitizedQuery = searchQuery.trim().toLowerCase();
    if (sanitizedQuery.length > 100) {
      alert("⚠ Search query is too long");
      return items;
    }
    
    return items.filter((p) =>
      p.name && p.name.toLowerCase().includes(sanitizedQuery)
    );
  };
  //bookmark
  const handleBookmark = async (productId) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("⚠ Please log in first");
    
    // Validate product ID
    if (!productId || isNaN(productId)) {
      return alert("⚠ Invalid product ID");
    }

    try {
      const res = await fetch("http://localhost:5000/bookmark-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to bookmark");
      }

      alert("✅ Product bookmarked!");
    } catch (err) {
      console.error("Bookmark error:", err);
      alert("⚠ " + (err.message || "Failed to bookmark product"));
    }
  };
  //-----
  const handlePurchase = async (product) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please log in first");

    try {
      const res = await fetch("http://localhost:5000/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: product.product_id,
        }),
      });

      const { clientSecret, publishableKey } = await res.json();
      if (!clientSecret || !publishableKey) {
        alert("Payment error: Missing Stripe credentials");
        return;
      }

      const stripe = await loadStripe(publishableKey);

      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: { token: "tok_visa" }, // ✅ Fake test card auto-used by Stripe popup
        },
      });

      if (error) {
        alert("Payment failed: " + error.message);
      } else {
        alert("✅ Payment successful!");
        setSelectedProduct(null); // Close modal after success
      }
    } catch (err) {
      console.error("Payment Error:", err);
      alert("Payment failed due to network/server issue.");
    }
  };
  /////this is feedback section-----------------------------------------------
  // Fetch feedbacks for a product
  const fetchFeedbacks = async (productId) => {
    const token = localStorage.getItem("token");
    setLoadingFeedback(true);
    try {
      const res = await fetch(`http://localhost:5000/feedback/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        console.error("Fetch feedback failed", await res.text());
        setFeedbackList([]);
        return;
      }
      const data = await res.json();
      setFeedbackList(data);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      setFeedbackList([]);
    } finally {
      setLoadingFeedback(false);
    }
  };

  // Open feedback modal for selected product
  const openFeedbackForProduct = (product) => {
    setSelectedProduct(product);
    setShowFeedbackModal(true);
    fetchFeedbacks(product.product_id);
  };

  // Submit a new feedback
  const submitFeedback = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("⚠ Please log in to add feedback");
    
    // Validate message
    const message = newFeedbackMessage.trim();
    if (!message) return alert("⚠ Please enter a message");
    if (message.length < 3) return alert("⚠ Feedback must be at least 3 characters long");
    if (message.length > 500) return alert("⚠ Feedback must not exceed 500 characters");
    
    // Validate product
    if (!selectedProduct || !selectedProduct.product_id) {
      return alert("⚠ Invalid product selected");
    }

    setSubmittingFeedback(true);
    try {
      const res = await fetch("http://localhost:5000/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: selectedProduct.product_id,
          message: message,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save feedback");

      // Refresh list & close add modal
      await fetchFeedbacks(selectedProduct.product_id);
      setNewFeedbackMessage("");
      setShowAddFeedbackModal(false);
      alert("✅ Feedback submitted successfully");
    } catch (err) {
      console.error("Submit feedback error:", err);
      alert("⚠ " + (err.message || "Failed to submit feedback"));
    } finally {
      setSubmittingFeedback(false);
    }
  };
  ////-------------------------------------
  ////-------------------------------
  ////-------------------------------
  //-----------------------Rating Frontend---    ----------------------------- ----------------- -----------------
  //this is for frontend protection only buyers can access catalogue
  //backend protection is done by buyerOnly middleware in routes

  const renderGrid = (items) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((product, idx) => (
          <div
            key={product.product_id}
            onClick={() => setSelectedProduct(product)}
            className="group relative bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-cyan-400/50 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-2"
          >
            {/* Image with Parallax Effect */}
            <div className="relative h-56 overflow-hidden bg-slate-900">
              <div
                className="absolute inset-0 transform transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-1"
                style={{
                  transformOrigin: "center center",
                  willChange: "transform",
                  transform: `translateY(${(scrollY * 10 * (idx % 4)) % 10}px)`,
                }}
              >
                <img
                  src={product.picture_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  style={{
                    transform: "translateZ(0)",
                    backfaceVisibility: "hidden",
                  }}
                />
              </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
            
            {/* Ratings Badge - Floating */}
            <div className="absolute top-3 right-3 flex gap-2">
              <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-xs font-semibold text-white border border-slate-700/50">
                <span>👍</span>
                <span>{product.upvotes || 0}</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-xs font-semibold text-white border border-slate-700/50">
                <span>👎</span>
                <span>{product.downvotes || 0}</span>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-5">
            <h2 className="text-lg font-bold text-white mb-1 truncate group-hover:text-cyan-400 transition-colors">
              {product.name}
            </h2>
            <p className="text-slate-400 text-sm mb-3 truncate">
              {product.brand_name || "No Brand"}
            </p>
            
            {/* Price with Gradient */}
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                ${product.price}
              </span>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12h14m-7-7l7 7-7 7" stroke="#0a0e1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{background: "linear-gradient(180deg, #0a0e1a 0%, #1a1f2e 100%)"}}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 mb-4"></div>
          <p className="text-white text-xl font-semibold">Loading Catalogue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{background: "linear-gradient(180deg, #0a0e1a 0%, #1a1f2e 100%)"}}>
      
      {/* Hero Section with Title */}
      <div className="relative pt-8 pb-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-3 tracking-tight">
            Product Catalogue
          </h1>
          <p className="text-slate-400 text-lg">Discover amazing products tailored for you</p>
        </div>
      </div>
      
      {/* ✅ Advertisement Slider with Enhanced Styling */}
      <div className="px-4 md:px-8 mb-12">
        <div className="max-w-7xl mx-auto">
          <AdvertisementSlider />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        
        {/* Search Bar with Enhanced Design */}
        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-2xl">
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition shadow-lg"
            />
          </div>
        </div>

        {/* Tab Navigation with Modern Pills */}
        <div className="flex justify-center gap-3 mb-10">
          {["study_tools", "clothes", "food"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeTab === tab
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 shadow-lg shadow-cyan-500/50 scale-105"
                  : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50"
              }`}
            >
              {tab.replace("_", " ").toUpperCase()}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "study_tools" && renderGrid(getFilteredProducts())}
        {activeTab === "clothes" && renderGrid(getFilteredProducts())}
        {activeTab === "food" && renderGrid(getFilteredProducts())}
      </div>

      {/* ✅ Modal Popup */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700/50 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col md:flex-row relative overflow-hidden animate-fadeIn">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700 hover:bg-red-600 hover:border-red-500 text-white transition-all duration-300 flex items-center justify-center group"
            >
              <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Left Side: Image with Parallax */}
            <div className="w-full md:w-1/2 relative bg-slate-950 overflow-hidden" style={{minHeight: "400px"}}>
              <img
                src={selectedProduct.picture_url}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
                style={{
                  position: "sticky",
                  top: 0,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-50" />
            </div>

            {/* Right Side: Details */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-between overflow-y-auto" style={{maxHeight: "600px"}}>
              <div>
                <h2 className="text-3xl font-black text-white mb-2">
                  {selectedProduct.name}
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                  Brand: <span className="text-cyan-400 font-semibold">{selectedProduct.brand_name || "No Brand"}</span>
                </p>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-6">
                  ${selectedProduct.price}
                </p>
                <p className="text-slate-300 leading-relaxed mb-6">
                  {selectedProduct.description || "No description available."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openFeedbackForProduct(selectedProduct);
                    }}
                    className="flex-1 bg-slate-700/60 backdrop-blur-sm px-5 py-3 rounded-xl text-white font-semibold hover:bg-slate-600 border border-slate-600 transition-all hover:scale-105"
                  >
                    💬 Feedback
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookmark(selectedProduct.product_id);
                    }}
                    className="flex-1 bg-blue-600/80 backdrop-blur-sm px-5 py-3 rounded-xl text-white font-semibold hover:bg-blue-500 border border-blue-500 transition-all hover:scale-105"
                  >
                    🔖 Bookmark
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPurchaseModal(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-3 rounded-xl text-white font-bold hover:brightness-110 transition-all hover:scale-105 shadow-lg shadow-green-500/30"
                  >
                    💳 Purchase
                  </button>
                </div>

                {/* Rating Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                  <button
                    onClick={() => handleRating("up")}
                    className={`flex-1 px-5 py-3 rounded-xl text-white font-semibold transition-all hover:scale-105 ${
                      selectedProduct.user_rating === "up"
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg shadow-green-500/40"
                        : "bg-slate-700/60 hover:bg-green-600/80 border border-slate-600"
                    }`}
                  >
                    👍 Like
                  </button>
                  <button
                    onClick={() => handleRating("down")}
                    className={`flex-1 px-5 py-3 rounded-xl text-white font-semibold transition-all hover:scale-105 ${
                      selectedProduct.user_rating === "down"
                        ? "bg-gradient-to-r from-red-600 to-rose-600 shadow-lg shadow-red-500/40"
                        : "bg-slate-700/60 hover:bg-red-600/80 border border-slate-600"
                    }`}
                  >
                    👎 Dislike
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Feedback Modal (centered overlay) ---------- */}
      {showFeedbackModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-[60] p-4">
          <div className="bg-slate-900 border border-slate-700/50 w-full max-w-3xl rounded-3xl shadow-2xl p-8 relative">
            <button
              onClick={() => {
                setShowFeedbackModal(false);
                setFeedbackList([]);
              }}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-slate-800 hover:bg-red-600 text-white transition-all duration-300 flex items-center justify-center group border border-slate-700"
            >
              <span className="group-hover:rotate-90 transition-transform duration-300">✖</span>
            </button>

            <h3 className="text-3xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Feedback — {selectedProduct.name}
            </h3>

            {/* Feedback list box */}
            <div className="max-h-72 overflow-y-auto bg-slate-800/40 backdrop-blur-sm p-5 rounded-2xl border border-slate-700/50 custom-scrollbar">
              {loadingFeedback ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400 mb-3"></div>
                  <p className="text-slate-300">Loading feedback...</p>
                </div>
              ) : feedbackList.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  No feedback yet. Be the first to write one! 💭
                </p>
              ) : (
                feedbackList.map((f) => (
                  <div
                    key={f.feedback_id}
                    className="mb-5 pb-4 border-b border-slate-700/50 last:border-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-white font-bold text-lg flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 grid place-items-center text-slate-900 text-sm font-black">
                          {(f.buyer_name || "B").charAt(0).toUpperCase()}
                        </span>
                        {f.buyer_name || "Buyer"}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {new Date(f.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-slate-200 ml-10 leading-relaxed whitespace-pre-wrap">
                      {f.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddFeedbackModal(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-cyan-500/30"
              >
                ✍️ Add Feedback
              </button>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackList([]);
                }}
                className="bg-slate-700/60 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold transition-all border border-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Add Feedback Modal (on top of feedback modal) ---------- */}
      {showAddFeedbackModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex justify-center items-center z-[70] p-4">
          <div className="bg-slate-900 border border-slate-700/50 w-full max-w-lg rounded-3xl shadow-2xl p-8 relative">
            <button
              onClick={() => setShowAddFeedbackModal(false)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-slate-800 hover:bg-red-600 text-white transition-all duration-300 flex items-center justify-center group border border-slate-700"
            >
              <span className="group-hover:rotate-90 transition-transform duration-300">✖</span>
            </button>

            <h4 className="text-2xl font-black mb-5 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Add Your Feedback
            </h4>

            <textarea
              value={newFeedbackMessage}
              onChange={(e) => setNewFeedbackMessage(e.target.value)}
              placeholder="Share your thoughts about this product..."
              rows={6}
              className="w-full p-4 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition resize-none"
            />

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowAddFeedbackModal(false)}
                className="bg-slate-700/60 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold transition-all border border-slate-600"
                disabled={submittingFeedback}
              >
                Cancel
              </button>
              <button
                onClick={submitFeedback}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:brightness-110 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30"
                disabled={submittingFeedback}
              >
                {submittingFeedback ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting...
                  </span>
                ) : (
                  "Post Feedback"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Stripe Purchase Modal */}
      {showPurchaseModal && (
        <PurchaseModal
          product={selectedProduct}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={() => {
            alert("Purchase saved!");
            setShowPurchaseModal(false);
            setSelectedProduct(null); // close Product Details modal too
            // optionally refresh products
          }}
        />
      )}
    </div>
  );
}
