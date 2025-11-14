"use client";

import { useEffect, useState } from "react";

// Component: Shows all unrated purchases for a buyer and allows 1-5 star rating
export default function UnratedPurchaseRatings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purchases, setPurchases] = useState([]); // { purchase_id, product_id, product_name, picture_url, amount, purchase_date }
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState({}); // purchase_id -> star index hover
  const [selected, setSelected] = useState({}); // purchase_id -> chosen rating
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchUnrated();
  }, []);

  function fetchUnrated() {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    fetch("http://localhost:5000/buyer/unrated-purchases", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setPurchases(data.purchases || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function ratePurchase(purchase_id, rating) {
    if (saving) return;
    setSaving(true);
    setMessage(null);
    const token = localStorage.getItem("token");
    fetch("http://localhost:5000/buyer/rate-purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ purchase_id, rating }),
    })
      .then((res) => res.json().then((j) => ({ ok: res.ok, body: j })))
      .then(({ ok, body }) => {
        if (!ok) throw new Error(body.message || "Rating failed");
        setMessage("Rating saved");
        // Remove purchase from list
        setPurchases((prev) => prev.filter((p) => p.purchase_id !== purchase_id));
        // cleanup selected/hovered
        setSelected((prev) => {
          const copy = { ...prev };
          delete copy[purchase_id];
          return copy;
        });
        setHovered((prev) => {
          const copy = { ...prev };
          delete copy[purchase_id];
          return copy;
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setSaving(false));
  }

  const Star = ({ active, onEnter, onLeave, onClick }) => (
    <span
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        cursor: "pointer",
        color: active ? "#fbbf24" : "#374151",
        transition: "color .15s",
        fontSize: 24,
      }}
    >
      ★
    </span>
  );

  return (
    <div
      style={{
        background: "linear-gradient(180deg,#0a0e1a 0%,#1a1f2e 100%)",
        minHeight: "100vh",
        padding: "32px 20px",
        color: "#e5e7eb",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: 32,
            margin: 0,
            fontWeight: 700,
            background: "linear-gradient(135deg,#fbbf24 0%,#f59e0b 60%,#fcd34d 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Rate Your Purchases
        </h1>
        <p style={{ marginTop: 8, color: "#94a3b8" }}>
          Help sellers improve by leaving a quick star rating.
        </p>

        {message && (
          <div
            style={{
              marginTop: 12,
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.4)",
              padding: "10px 14px",
              borderRadius: 12,
              fontSize: 14,
              color: "#10b981",
            }}
          >
            {message}
          </div>
        )}
        {error && (
          <div
            style={{
              marginTop: 12,
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.4)",
              padding: "10px 14px",
              borderRadius: 12,
              fontSize: 14,
              color: "#f87171",
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ marginTop: 40, color: "#94a3b8" }}>Loading purchases...</p>
        ) : purchases.length === 0 ? (
          <div
            style={{
              marginTop: 40,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 18,
              padding: 40,
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>All caught up! 🎉</h3>
            <p style={{ color: "#64748b", marginTop: 8 }}>
              You have no unrated purchases right now.
            </p>
          </div>
        ) : (
          <div
            style={{
              marginTop: 32,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: 24,
            }}
          >
            {purchases.map((p) => {
              const hoverValue = hovered[p.purchase_id] || 0;
              const selectedValue = selected[p.purchase_id] || 0;
              return (
                <div
                  key={p.purchase_id}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 20,
                    padding: 20,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", gap: 12 }}>
                    <div
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 16,
                        overflow: "hidden",
                        background: "#0f172a",
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {p.picture_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.picture_url}
                          alt={p.product_name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span style={{ fontSize: 28 }}>📦</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.3 }}>
                        {p.product_name}
                      </div>
                      <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                        {new Date(p.purchase_date).toLocaleDateString()} · {p.section}
                      </div>
                      <div style={{ fontSize: 14, marginTop: 4, color: "#fbbf24", fontWeight: 600 }}>
                        Rs {Number(p.amount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Your Rating</div>
                    <div>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          active={star <= (hoverValue || selectedValue)}
                          onEnter={() => setHovered((h) => ({ ...h, [p.purchase_id]: star }))}
                          onLeave={() => setHovered((h) => ({ ...h, [p.purchase_id]: 0 }))}
                          onClick={() => setSelected((s) => ({ ...s, [p.purchase_id]: star }))}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    disabled={!selectedValue || saving}
                    onClick={() => ratePurchase(p.purchase_id, selectedValue)}
                    style={{
                      marginTop: 4,
                      padding: "10px 14px",
                      background: selectedValue
                        ? "linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%)"
                        : "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(247, 186, 31, 0.4)",
                      color: selectedValue ? "#1a1f2e" : "#64748b",
                      fontWeight: 600,
                      borderRadius: 12,
                      cursor: selectedValue ? "pointer" : "not-allowed",
                      transition: "all .2s",
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    {saving && selectedValue === 0 ? "Saving..." : "Save Rating"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
