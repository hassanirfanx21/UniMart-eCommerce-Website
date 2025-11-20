"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PurchaseModal from "../components/PurchaseModal";

export default function RecommendationsPage() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  function fetchRecommendations() {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    
    if (!token) {
      setError("Please log in to see recommendations");
      setLoading(false);
      return;
    }

    fetch("http://localhost:5000/buyer/recommendations?top=10&min_rating=1.5", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Server error (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        const recs = data.recommendations || [];
        setAllRecommendations(recs);
        setRecommendations(recs);
      })
      .catch((err) => {
        console.error("❌ Recommendations error:", err);
        setError(err.message || "Failed to load recommendations");
      })
      .finally(() => setLoading(false));
  }

  function handleProductClick(product) {
    setSelectedProduct(product);
    setShowModal(true);
  }

  function handleCategoryChange(category) {
    setSelectedCategory(category);
    if (category === "All") {
      setRecommendations(allRecommendations);
    } else {
      const filtered = allRecommendations.filter(
        (p) => p.section.toLowerCase() === category.toLowerCase()
      );
      setRecommendations(filtered);
    }
  }

  function closeModal() {
    setShowModal(false);
    setSelectedProduct(null);
  }

  function handleBookmark() {
    if (!selectedProduct) return;
    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/bookmark-product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id: selectedProduct.product_id }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message || "Bookmarked successfully!");
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to bookmark");
      });
  }

  function handleLike() {
    if (!selectedProduct) return;
    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/rate-product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id: selectedProduct.product_id, rating: "up" }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message || "Liked successfully!");
        // Update upvotes properly (convert to number first)
        setSelectedProduct((prev) => ({
          ...prev,
          upvotes: Number(prev.upvotes) + 1,
        }));
        setRecommendations((prev) =>
          prev.map((p) =>
            p.product_id === selectedProduct.product_id
              ? { ...p, upvotes: Number(p.upvotes) + 1 }
              : p
          )
        );
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to like");
      });
  }

  function handleDislike() {
    if (!selectedProduct) return;
    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/rate-product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id: selectedProduct.product_id, rating: "down" }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message || "Disliked successfully!");
        // Update downvotes properly (convert to number first)
        setSelectedProduct((prev) => ({
          ...prev,
          downvotes: Number(prev.downvotes) + 1,
        }));
        setRecommendations((prev) =>
          prev.map((p) =>
            p.product_id === selectedProduct.product_id
              ? { ...p, downvotes: Number(p.downvotes) + 1 }
              : p
          )
        );
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to dislike");
      });
  }

  function handlePurchase() {
    if (!selectedProduct) return;
    // Hide product details modal and show Stripe purchase modal
    setShowModal(false);
    setShowPurchaseModal(true);
  }

  function openFeedbackModal() {
    setShowFeedbackModal(true);
  }

  function closeFeedbackModal() {
    setShowFeedbackModal(false);
    setFeedback("");
  }

  function handleSubmitFeedback() {
    if (!selectedProduct || !feedback.trim()) {
      alert("Please enter feedback");
      return;
    }
    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: selectedProduct.product_id,
        message: feedback,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message || "Feedback submitted successfully!");
        setFeedback("");
        closeFeedbackModal();
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to submit feedback");
      });
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#0b0f14 0%,#10171f 55%,#121e29 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 72,
            height: 72,
            border: "3px solid rgba(148,163,184,0.15)",
            borderTopColor: "#94a3b8",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px"
          }} />
          <p style={{ fontSize: 16, fontWeight: 500, color: "#9ca3af", letterSpacing: "0.3px" }}>
            Loading your personalized recommendations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#0b0f14 0%,#10171f 55%,#121e29 100%)",
        padding: "42px 24px 60px",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <h1 style={{
                margin: 0,
                fontSize: 40,
                lineHeight: 1.1,
                fontWeight: 800,
                letterSpacing: "-.5px",
                background: "linear-gradient(90deg,#d1d5db 0%,#9ca3af 50%,#6b7280 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>Recommended Products</h1>
              <p style={{ margin: 0, fontSize: 15, color: "#6b7280" }}>Smart suggestions based on your activity.</p>
            </div>
            {recommendations.length > 0 && (
              <div style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                background: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                fontSize: 13,
                fontWeight: 600,
                color: "#9ca3af"
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{opacity:.8}}>
                  <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" />
                </svg>
                {recommendations.length} picks
              </div>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div style={{ 
            display: "flex", 
            gap: 10, 
            marginTop: 24,
            flexWrap: "wrap"
          }}>
            {["All", "Clothes", "Food", "Study Tools"].map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                style={{
                  padding: "11px 22px",
                  background: selectedCategory === category 
                    ? "linear-gradient(135deg, #4b5563 0%, #374151 100%)" 
                    : "rgba(255,255,255,0.03)",
                  border: selectedCategory === category
                    ? "1px solid rgba(209,213,219,0.25)"
                    : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  color: selectedCategory === category ? "#e5e7eb" : "#9ca3af",
                  fontSize: 14,
                  fontWeight: selectedCategory === category ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.25s",
                  boxShadow: selectedCategory === category 
                    ? "0 4px 12px rgba(0,0,0,0.2)" 
                    : "none"
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  }
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 16,
            padding: "18px 22px",
            marginBottom: 28,
            color: "#fca5a5",
            fontSize: 14,
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        {recommendations.length === 0 && !error ? (
          <div style={{
            background: "rgba(17,25,32,0.7)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "70px 40px",
            textAlign: "center",
            backdropFilter: "blur(10px)"
          }}>
            <div style={{ fontSize: 68, marginBottom: 20, opacity: 0.8 }}>🎯</div>
            <h3 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: "#e5e7eb", letterSpacing: "-0.5px" }}>
              No Recommendations Yet
            </h3>
            <p style={{ color: "#6b7280", marginTop: 14, fontSize: 15, maxWidth: 400, margin: "14px auto 0" }}>
              Start purchasing products to unlock personalized AI-powered recommendations tailored just for you.
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
            gap: 28
          }}>
            {recommendations.map(product => (
              <div
                key={product.product_id}
                onClick={() => handleProductClick(product)}
                style={{
                  background: "rgba(17,25,32,0.85)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 18,
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "background .25s, border-color .25s, transform .3s",
                  position: "relative"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(22,32,41,0.92)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                  e.currentTarget.style.transform = "translateY(-6px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(17,25,32,0.85)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ position:"absolute", top:10, right:10, display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
                  <div style={{
                    background:"linear-gradient(90deg,#4b5563,#374151)",
                    color:"#e5e7eb",
                    padding:"4px 10px",
                    borderRadius:12,
                    fontSize:12,
                    fontWeight:600,
                    letterSpacing:".5px",
                    display:"flex",
                    alignItems:"center",
                    gap:4,
                    boxShadow:"0 0 0 1px rgba(255,255,255,0.05)"
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{opacity:.8}}>
                      <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" />
                    </svg>
                    {product.predicted_rating.toFixed(1)}
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <div style={{ fontSize:11, color:"#9ca3af", background:"rgba(255,255,255,0.05)", padding:"4px 8px", borderRadius:10 }}>👍 {product.upvotes}</div>
                    <div style={{ fontSize:11, color:"#9ca3af", background:"rgba(255,255,255,0.05)", padding:"4px 8px", borderRadius:10 }}>👎 {product.downvotes}</div>
                  </div>
                </div>
                <div style={{ width:"100%", height:200, background:"#0d1217", display:"grid", placeItems:"center", overflow:"hidden" }}>
                  {product.picture_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.picture_url} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  ) : (
                    <span style={{ fontSize:46, opacity:.55 }}>📦</span>
                  )}
                </div>
                <div style={{ padding:"18px 18px 20px" }}>
                  <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"1px", color:"#6b7280", marginBottom:6 }}>{product.section}</div>
                  <h3 style={{ margin:"0 0 6px", fontSize:17, fontWeight:600, color:"#f3f4f6", lineHeight:1.35, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{product.name}</h3>
                  {product.brand_name && (
                    <div style={{ fontSize:12, color:"#848c94", marginBottom:10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{product.brand_name}</div>
                  )}
                  <div style={{ fontSize:20, fontWeight:700, color:"#d1d5db" }}>Rs {Number(product.price).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showModal && selectedProduct && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(180deg, #16202b 0%, #0f1820 100%)",
              borderRadius: 24,
              maxWidth: 680,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)"
            }}
          >
            <div style={{ position: "relative" }}>
              {/* Close Button */}
              <button
                onClick={closeModal}
                style={{
                  position: "absolute",
                  top: 18,
                  right: 18,
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "rgba(17,24,32,0.8)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#d1d5db",
                  fontSize: 22,
                  cursor: "pointer",
                  zIndex: 10,
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
                  e.currentTarget.style.color = "#fca5a5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(17,24,32,0.8)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  e.currentTarget.style.color = "#d1d5db";
                }}
              >
                ×
              </button>

              {/* Image */}
              <div style={{ width: "100%", height: 320, background: "#0d1217", position: "relative", overflow: "hidden" }}>
                {selectedProduct.picture_url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedProduct.picture_url}
                      alt={selectedProduct.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to bottom, transparent 0%, rgba(15,24,32,0.4) 60%, rgba(15,24,32,0.8) 100%)"
                    }} />
                  </>
                ) : (
                  <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
                    <span style={{ fontSize: 64, opacity: 0.5 }}>📦</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: "28px 32px 32px" }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: 600 }}>
                  {selectedProduct.section}
                </div>
                <h2 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 10px 0", color: "#f3f4f6", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                  {selectedProduct.name}
                </h2>
                {selectedProduct.brand_name && (
                  <div style={{ fontSize: 15, color: "#6b7280", marginBottom: 18 }}>
                    Brand: <span style={{ color: "#9ca3af", fontWeight: 500 }}>{selectedProduct.brand_name}</span>
                  </div>
                )}
                <div style={{ fontSize: 34, fontWeight: 800, color: "#d1d5db", marginBottom: 18, letterSpacing: "-0.5px" }}>
                  Rs {Number(selectedProduct.price).toLocaleString()}
                </div>

                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  background: "rgba(148,163,184,0.12)",
                  border: "1px solid rgba(148,163,184,0.2)",
                  borderRadius: 12,
                  marginBottom: 22
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#94a3b8">
                    <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" />
                  </svg>
                  <span style={{ color: "#d1d5db", fontWeight: 600, fontSize: 14 }}>
                    Predicted Rating: {selectedProduct.predicted_rating.toFixed(2)}
                  </span>
                </div>

                {selectedProduct.description && (
                  <div style={{ marginBottom: 22 }}>
                    <h4 style={{ fontSize: 13, color: "#6b7280", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Description</h4>
                    <p style={{ color: "#9ca3af", lineHeight: 1.7, fontSize: 14 }}>{selectedProduct.description}</p>
                  </div>
                )}

                <div style={{ display: "flex", gap: 20, marginBottom: 22, paddingBottom: 22, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Upvotes</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#6ee7b7" }}>
                      👍 {selectedProduct.upvotes}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Downvotes</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#fca5a5" }}>
                      👎 {selectedProduct.downvotes}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
                  Sold by: <span style={{ color: "#d1d5db", fontWeight: 500 }}>{selectedProduct.seller_name}</span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={handleBookmark}
                    style={{
                      flex: 1,
                      minWidth: 120,
                      padding: "13px 20px",
                      background: "rgba(96,165,250,0.08)",
                      border: "1px solid rgba(96,165,250,0.2)",
                      borderRadius: 12,
                      color: "#93c5fd",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      transition: "all 0.25s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(96,165,250,0.15)";
                      e.currentTarget.style.borderColor = "rgba(96,165,250,0.35)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(96,165,250,0.08)";
                      e.currentTarget.style.borderColor = "rgba(96,165,250,0.2)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    🔖 Bookmark
                  </button>

                  <button
                    onClick={handleLike}
                    style={{
                      flex: 1,
                      minWidth: 120,
                      padding: "13px 20px",
                      background: "rgba(110,231,183,0.08)",
                      border: "1px solid rgba(110,231,183,0.2)",
                      borderRadius: 12,
                      color: "#6ee7b7",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      transition: "all 0.25s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(110,231,183,0.15)";
                      e.currentTarget.style.borderColor = "rgba(110,231,183,0.35)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(110,231,183,0.08)";
                      e.currentTarget.style.borderColor = "rgba(110,231,183,0.2)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    👍 Like
                  </button>

                  <button
                    onClick={handleDislike}
                    style={{
                      flex: 1,
                      minWidth: 120,
                      padding: "13px 20px",
                      background: "rgba(252,165,165,0.08)",
                      border: "1px solid rgba(252,165,165,0.2)",
                      borderRadius: 12,
                      color: "#fca5a5",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      transition: "all 0.25s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(252,165,165,0.15)";
                      e.currentTarget.style.borderColor = "rgba(252,165,165,0.35)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(252,165,165,0.08)";
                      e.currentTarget.style.borderColor = "rgba(252,165,165,0.2)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    👎 Dislike
                  </button>

                  <button
                    onClick={handlePurchase}
                    style={{
                      flex: "1 1 100%",
                      padding: "16px 24px",
                      background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
                      border: "1px solid rgba(209,213,219,0.2)",
                      borderRadius: 12,
                      color: "#e5e7eb",
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: "pointer",
                      transition: "all 0.25s",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.4)";
                      e.currentTarget.style.background = "linear-gradient(135deg, #4b5563 0%, #374151 100%)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
                      e.currentTarget.style.background = "linear-gradient(135deg, #374151 0%, #1f2937 100%)";
                    }}
                  >
                    🛒 Purchase Now
                  </button>

                  <button
                    onClick={openFeedbackModal}
                    style={{
                      flex: "1 1 100%",
                      padding: "13px 20px",
                      background: "rgba(167,139,250,0.08)",
                      border: "1px solid rgba(167,139,250,0.2)",
                      borderRadius: 12,
                      color: "#c4b5fd",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      transition: "all 0.25s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(167,139,250,0.15)";
                      e.currentTarget.style.borderColor = "rgba(167,139,250,0.35)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(167,139,250,0.08)";
                      e.currentTarget.style.borderColor = "rgba(167,139,250,0.2)";
                    }}
                  >
                    💬 Give Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedProduct && (
        <div
          onClick={closeFeedbackModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(180deg, #16202b 0%, #0f1820 100%)",
              borderRadius: 20,
              maxWidth: 540,
              width: "100%",
              padding: "32px 36px",
              border: "1px solid rgba(167,139,250,0.2)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)"
            }}
          >
            <h3 style={{ fontSize: 26, fontWeight: 700, color: "#f3f4f6", marginBottom: 10, letterSpacing: "-0.5px" }}>
              Give Feedback
            </h3>
            <p style={{ color: "#6b7280", marginBottom: 26, fontSize: 14, lineHeight: 1.6 }}>
              Share your thoughts about <span style={{ color: "#c4b5fd", fontWeight: 500 }}>{selectedProduct.name}</span>
            </p>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter your feedback..."
              style={{
                width: "100%",
                minHeight: 130,
                padding: "14px 16px",
                background: "rgba(17,24,32,0.6)",
                border: "1px solid rgba(167,139,250,0.2)",
                borderRadius: 12,
                color: "#e5e7eb",
                fontSize: 14,
                lineHeight: 1.6,
                resize: "vertical",
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "rgba(167,139,250,0.4)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(167,139,250,0.2)"}
            />

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                onClick={closeFeedbackModal}
                style={{
                  flex: 1,
                  padding: "13px 20px",
                  background: "rgba(107,114,128,0.12)",
                  border: "1px solid rgba(107,114,128,0.25)",
                  borderRadius: 12,
                  color: "#9ca3af",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(107,114,128,0.2)";
                  e.currentTarget.style.borderColor = "rgba(107,114,128,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(107,114,128,0.12)";
                  e.currentTarget.style.borderColor = "rgba(107,114,128,0.25)";
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                style={{
                  flex: 1,
                  padding: "13px 20px",
                  background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)",
                  border: "none",
                  borderRadius: 12,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(167,139,250,0.3)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(167,139,250,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(167,139,250,0.3)";
                }}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Purchase Modal */}
      {showPurchaseModal && selectedProduct && (
        <PurchaseModal
          product={selectedProduct}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={() => {
            alert("✅ Purchase successful!");
            setShowPurchaseModal(false);
            setShowModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
