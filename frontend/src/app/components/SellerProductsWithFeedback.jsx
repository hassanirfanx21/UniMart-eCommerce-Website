"use client";
import React, { useEffect, useMemo, useState } from "react";

export default function SellerProductsWithFeedback() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  // Local filters
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/seller/products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Failed to load products (${res.status})`);
        }
        const data = await res.json();
        setProducts(data.products || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQ = !q || p.name?.toLowerCase().includes(q) || p.section?.toLowerCase().includes(q);
      const matchesS = section === "all" || p.section?.toLowerCase() === section;
      return matchesQ && matchesS;
    });
  }, [products, query, section]);

  const openFeedback = async (product) => {
    setActiveProduct(product);
    setModalOpen(true);
    setFeedback([]);
    setFeedbackError("");
    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/seller/products/${product.product_id}/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed to load feedback (${res.status})`);
      }
      const data = await res.json();
      setFeedback(data.feedback || []);
    } catch (e) {
      setFeedbackError(e.message);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveProduct(null);
    setFeedback([]);
    setFeedbackError("");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0b1220 0%, #111827 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#e5e7eb" }}>
          <div style={{ width: 60, height: 60, border: "4px solid rgba(59,130,246,0.15)", borderTop: "4px solid #60a5fa", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 1s linear infinite" }}></div>
          <p style={{ fontSize: 18, fontWeight: 600 }}>Loading your products...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0b1220 0%, #111827 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "#0f172a", padding: 40, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.4)", textAlign: "center", maxWidth: 480, border: "1px solid #1f2937" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
          <h3 style={{ fontSize: 24, fontWeight: 800, color: "#e5e7eb", marginBottom: 10 }}>Couldn’t load products</h3>
          <p style={{ color: "#ef4444", fontSize: 16 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0b1220 0%, #111827 100%)", padding: "32px 20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header & Filters */}
        <div style={{ background: "#0b1220", border: "1px solid #1f2937", borderRadius: 20, padding: 24, marginBottom: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "#111827", display: "grid", placeItems: "center", boxShadow: "inset 0 0 0 1px #1f2937" }}>🛒</div>
              <div>
                <h1 style={{ fontSize: 28, margin: 0, background: "linear-gradient(90deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800 }}>My Products</h1>
                <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 14 }}>Click a product to view buyer feedback</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                style={{ background: "#0f172a", border: "1px solid #1f2937", color: "#e5e7eb", padding: "10px 12px", borderRadius: 10, outline: "none", minWidth: 220 }}
              />
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                style={{ background: "#0f172a", border: "1px solid #1f2937", color: "#e5e7eb", padding: "10px 12px", borderRadius: 10 }}
              >
                <option value="all">All Sections</option>
                <option value="clothes">Clothes</option>
                <option value="food">Food</option>
                <option value="study tools">Study Tools</option>
              </select>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 ? (
          <div style={{ background: "#0b1220", border: "1px solid #1f2937", borderRadius: 20, padding: 60, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
            <div style={{ fontSize: 80, marginBottom: 20 }}>📭</div>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: "#e5e7eb", marginBottom: 10 }}>No products found</h3>
            <p style={{ color: "#9ca3af", fontSize: 16 }}>Try adjusting your search or section filter.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {filtered.map((p, idx) => (
              <div
                key={`${p.product_id}-${idx}`}
                style={{ background: "#0b1220", border: "1px solid #1f2937", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.25)", transition: "all 0.25s", display: "flex", flexDirection: "column" }}
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
                <div style={{ position: "relative" }}>
                  <img src={p.picture_url || "/placeholder.png"} alt={p.name} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                  <span style={{ position: "absolute", top: 10, left: 10, fontSize: 12, fontWeight: 700, padding: "6px 10px", borderRadius: 999, background: "#0f172a", border: "1px solid #1f2937", color: "#e5e7eb" }}>
                    {p.section}
                  </span>
                </div>
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 8 }}>
                    <h3 style={{ margin: 0, color: "#e5e7eb", fontWeight: 800, fontSize: 16 }}>{p.name}</h3>
                    <div style={{ fontWeight: 900, background: "linear-gradient(90deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      PKR {Number(p.price).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", color: "#9ca3af", fontSize: 12 }}>
                    {typeof p.ups !== "undefined" && (
                      <span style={{ padding: "4px 10px", borderRadius: 999, background: "rgba(34,197,94,0.1)", border: "1px solid #22c55e", color: "#22c55e", fontWeight: 700 }}>👍 {p.ups}</span>
                    )}
                    {typeof p.downs !== "undefined" && (
                      <span style={{ padding: "4px 10px", borderRadius: 999, background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", color: "#ef4444", fontWeight: 700 }}>👎 {p.downs}</span>
                    )}
                    {typeof p.feedback_count !== "undefined" && (
                      <span style={{ padding: "4px 10px", borderRadius: 999, background: "rgba(96,165,250,0.1)", border: "1px solid #60a5fa", color: "#60a5fa", fontWeight: 700 }}>💬 {p.feedback_count}</span>
                    )}
                    {typeof p.sales !== "undefined" && (
                      <span style={{ padding: "4px 10px", borderRadius: 999, background: "rgba(167,139,250,0.1)", border: "1px solid #a78bfa", color: "#a78bfa", fontWeight: 700 }}>🧾 {p.sales}</span>
                    )}
                  </div>
                  <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <button
                      onClick={() => openFeedback(p)}
                      style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #1f2937", background: "#0f172a", color: "#e5e7eb", fontWeight: 700, cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#60a5fa")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1f2937")}
                    >
                      View Feedback
                    </button>
                    {/* <a
                      href={`/product/${p.product_id}`}
                      style={{ textDecoration: "none", flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #1f2937", background: "linear-gradient(90deg, #60a5fa, #a78bfa)", color: "#0b1220", fontWeight: 900, textAlign: "center" }}
                    >
                      Open Product
                    </a> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "grid", placeItems: "center", padding: 16, zIndex: 50 }}>
          <div style={{ width: "min(860px, 96vw)", maxHeight: "85vh", overflow: "auto", background: "#0b1220", border: "1px solid #1f2937", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottom: "1px solid #1f2937" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={activeProduct?.picture_url || "/placeholder.png"} alt={activeProduct?.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }} />
                <div>
                  <div style={{ color: "#e5e7eb", fontWeight: 800 }}>{activeProduct?.name}</div>
                  <div style={{ color: "#9ca3af", fontSize: 12 }}>{activeProduct?.section}</div>
                </div>
              </div>
              <button onClick={closeModal} style={{ background: "#0f172a", border: "1px solid #1f2937", color: "#e5e7eb", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 700 }}>Close</button>
            </div>

            <div style={{ padding: 16 }}>
              {feedbackLoading && (
                <div style={{ color: "#9ca3af", padding: 12 }}>Loading feedback...</div>
              )}
              {feedbackError && (
                <div style={{ color: "#ef4444", padding: 12 }}>{feedbackError}</div>
              )}
              {!feedbackLoading && !feedbackError && feedback.length === 0 && (
                <div style={{ color: "#9ca3af", padding: 12 }}>No feedback yet for this product.</div>
              )}
              {!feedbackLoading && !feedbackError && feedback.length > 0 && (
                <div style={{ display: "grid", gap: 12 }}>
                  {feedback.map((f) => (
                    <div key={f.feedback_id} style={{ border: "1px solid #1f2937", borderRadius: 12, padding: 12, background: "#0f172a" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0b1220", border: "1px solid #1f2937", color: "#e5e7eb", display: "grid", placeItems: "center", fontWeight: 800 }}>
                          {f.buyer_name?.[0]?.toUpperCase() || "B"}
                        </div>
                        <div style={{ color: "#e5e7eb", fontWeight: 700 }}>{f.buyer_name}</div>
                        <div style={{ color: "#6b7280", fontSize: 12 }}>{new Date(f.created_at).toLocaleString()}</div>
                      </div>
                      <div style={{ color: "#9ca3af" }}>{f.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
