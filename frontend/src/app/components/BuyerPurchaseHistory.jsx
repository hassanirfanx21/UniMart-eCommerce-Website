// src/components/BuyerPurchaseHistory.jsx
"use client";
import React, { useEffect, useState } from "react";

export default function BuyerPurchaseHistory() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, completed, pending, cancelled

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/buyerHistory", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to fetch purchases");
        }

        const data = await res.json();
        setPurchases(data.purchases);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "completed" || statusLower === "delivered") return { bg: "rgba(34, 197, 94, 0.1)", text: "#22c55e", border: "#22c55e" };
    if (statusLower === "pending" || statusLower === "processing") return { bg: "rgba(251, 191, 36, 0.1)", text: "#f59e0b", border: "#f59e0b" };
    if (statusLower === "cancelled" || statusLower === "refunded") return { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444", border: "#ef4444" };
    return { bg: "rgba(59, 130, 246, 0.1)", text: "#3b82f6", border: "#3b82f6" };
  };

  const getSectionIcon = (section) => {
    const sectionLower = section?.toLowerCase();
    if (sectionLower?.includes("clothes")) return "👕";
    if (sectionLower?.includes("food")) return "🍔";
    if (sectionLower?.includes("study") || sectionLower?.includes("books")) return "📚";
    return "🛍️";
  };

  const filteredPurchases = purchases.filter((p) => {
    if (filter === "all") return true;
    return p.purchase_status?.toLowerCase() === filter;
  });

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0b1220 0%, #111827 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#e5e7eb" }}>
          <div style={{ width: 60, height: 60, border: "4px solid rgba(59,130,246,0.15)", borderTop: "4px solid #60a5fa", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 1s linear infinite" }}></div>
          <p style={{ fontSize: 18, fontWeight: 600 }}>Loading your purchases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0b1220 0%, #111827 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "#0f172a", padding: 40, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.4)", textAlign: "center", maxWidth: 420, border: "1px solid #1f2937" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
          <h3 style={{ fontSize: 24, fontWeight: 800, color: "#e5e7eb", marginBottom: 10 }}>Something went wrong</h3>
          <p style={{ color: "#ef4444", fontSize: 16 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0b1220 0%, #111827 100%)", padding: "40px 20px" }}>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .grid-overlay { position: absolute; inset: 0; background-image: radial-gradient(rgba(96,165,250,0.06) 1px, transparent 1px); background-size: 24px 24px; pointer-events: none; }
        `}
      </style>

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <div style={{ background: "#0b1220", border: "1px solid #1f2937", borderRadius: 20, padding: 32, marginBottom: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#111827", display: "grid", placeItems: "center", boxShadow: "inset 0 0 0 1px #1f2937" }}>
              <span style={{ fontSize: 28 }}>📦</span>
            </div>
            <div>
              <h1 style={{ fontSize: 32, margin: 0, background: "linear-gradient(90deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800,color: "black" }}>
                Purchase History
              </h1>
              <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 14 }}>
                Track all your orders in one place
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { label: "All Orders", value: "all", icon: "📋" },
              { label: "Completed", value: "completed", icon: "✅" },
              { label: "Pending", value: "pending", icon: "⏳" },
              { label: "Cancelled", value: "cancelled", icon: "❌" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 12,
                  border: "1px solid #1f2937",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: filter === tab.value ? "linear-gradient(90deg, #60a5fa, #a78bfa)" : "#0b1220",
                  color: filter === tab.value ? "#0b1220" : "#9ca3af",
                  transition: "all 0.3s",
                  boxShadow: filter === tab.value ? "0 8px 24px rgba(96,165,250,0.2)" : "none",
                }}
              >
                {tab.icon} {tab.label} ({purchases.filter(p => tab.value === "all" || p.purchase_status?.toLowerCase() === tab.value).length})
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredPurchases.length === 0 ? (
          <div style={{ background: "#0b1220", border: "1px solid #1f2937", borderRadius: 20, padding: 60, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
            <div style={{ fontSize: 80, marginBottom: 20 }}>🛒</div>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: "#e5e7eb", marginBottom: 10 }}>No purchases found</h3>
            <p style={{ color: "#9ca3af", fontSize: 16 }}>Start shopping to see your order history here!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            {filteredPurchases.map((p, idx) => {
              const statusColors = getStatusColor(p.purchase_status);
              return (
                <div
                  key={p.purchase_id}
                  style={{
                    background: "#0b1220",
                    borderRadius: 16,
                    padding: 24,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                    transition: "all 0.3s",
                    animation: `slideUp 0.5s ease-out ${idx * 0.1}s backwards`,
                    border: "1px solid #1f2937",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.35)";
                    e.currentTarget.style.borderColor = "#60a5fa";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
                    e.currentTarget.style.borderColor = "#1f2937";
                  }}
                >
                  <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                    {/* Product Image */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img
                        src={p.picture_url || "/placeholder.png"}
                        alt={p.product_name}
                        style={{
                          width: 120,
                          height: 120,
                          objectFit: "cover",
                          borderRadius: 12,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
                        }}
                      />
                      <div style={{ position: "absolute", top: -8, right: -8, width: 32, height: 32, borderRadius: "50%", background: "#0f172a", border: "1px solid #1f2937", display: "grid", placeItems: "center", fontSize: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.35)", color: "#e5e7eb" }}>
                        {getSectionIcon(p.section)}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div style={{ flex: 1, minWidth: 250 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: "#e5e7eb", margin: "0 0 8px 0" }}>
                        {p.product_name}
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#9ca3af" }}>
                          <span style={{ fontWeight: 600 }}>📂 Section:</span>
                          <span style={{ background: "#0f172a", padding: "4px 12px", borderRadius: 6, fontWeight: 700, color: "#e5e7eb", border: "1px solid #1f2937" }}>
                            {p.section}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#9ca3af" }}>
                          <span style={{ fontWeight: 600 }}>👤 Seller:</span>
                          <span style={{ color: "#e5e7eb" }}>{p.seller_name}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#9ca3af" }}>
                          <span style={{ fontWeight: 600 }}>📅 Purchased:</span>
                          <span style={{ color: "#e5e7eb" }}>{new Date(p.purchase_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Status */}
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
                      <div style={{ fontSize: 28, fontWeight: 900, background: "linear-gradient(90deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {p.amount} {p.currency}
                      </div>
                      <div
                        style={{
                          padding: "8px 16px",
                          borderRadius: 12,
                          fontSize: 13,
                          fontWeight: 700,
                          background: statusColors.bg,
                          color: statusColors.text,
                          border: `2px solid ${statusColors.border}`,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {p.purchase_status}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Footer */}
        {filteredPurchases.length > 0 && (
          <div style={{ marginTop: 32, background: "#0b1220", border: "1px solid #1f2937", borderRadius: 16, padding: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", textAlign: "center" }}>
            <p style={{ fontSize: 16, color: "#9ca3af", margin: 0 }}>
              Showing <strong style={{ color: "#60a5fa" }}>{filteredPurchases.length}</strong> of <strong style={{ color: "#60a5fa" }}>{purchases.length}</strong> total purchases
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

