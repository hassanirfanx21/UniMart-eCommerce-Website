// Admin Users Management Component
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AdminUsers = () => {
  const router = useRouter();
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("buyers");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;

  // Access check
  useEffect(() => {
    if (!token) {
      alert("Please log in first.");
      router.push("/login");
      return;
    }
    if (role !== "admin") {
      alert("Access denied! Only admin can access this page.");
      router.push("/");
    }
  }, []);

  // Fetch buyers
  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:5000/admin/buyers", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch buyers");
        return res.json();
      })
      .then((data) => setBuyers(data))
      .catch((err) => console.error("Error fetching buyers:", err));
  }, [token]);

  // Fetch sellers
  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:5000/admin/sellers", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sellers");
        return res.json();
      })
      .then((data) => setSellers(data))
      .catch((err) => console.error("Error fetching sellers:", err))
      .finally(() => setLoading(false));
  }, [token]);

  // Activate user
  const handleActivate = (type, id) => {
    if (!id) {
      alert("Error: User ID is missing");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to activate this ${type}?`)) return;

    fetch(`http://localhost:5000/admin/${type}/${id}/activate`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text().catch(() => "Unknown error");
          console.error("Activate failed:", res.status, errorText);
          throw new Error(`Failed to activate user (${res.status}): ${errorText}`);
        }
        return res.json();
      })
      .then(() => {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} activated successfully`);
        if (type === "buyer") {
          setBuyers((prev) =>
            prev.map((b) => (b.id === id ? { ...b, status: "active" } : b))
          );
        } else {
          setSellers((prev) =>
            prev.map((s) => (s.id === id ? { ...s, status: "active" } : s))
          );
        }
      })
      .catch((err) => {
        console.error("Error activating user:", err);
        alert(`Failed to activate user. ${err.message}`);
      });
  };

  // Deactivate user
  const handleDeactivate = (type, id) => {
    if (!id) {
      alert("Error: User ID is missing");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to deactivate this ${type}?`)) return;

    fetch(`http://localhost:5000/admin/${type}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text().catch(() => "Unknown error");
          console.error("Deactivate failed:", res.status, errorText);
          throw new Error(`Failed to deactivate user (${res.status}): ${errorText}`);
        }
        return res.json();
      })
      .then(() => {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deactivated successfully`);
        if (type === "buyer") {
          setBuyers((prev) =>
            prev.map((b) => (b.id === id ? { ...b, status: "inactive" } : b))
          );
        } else {
          setSellers((prev) =>
            prev.map((s) => (s.id === id ? { ...s, status: "inactive" } : s))
          );
        }
      })
      .catch((err) => {
        console.error("Error deactivating user:", err);
        alert(`Failed to deactivate user. ${err.message}`);
      });
  };

  const currentData = activeTab === "buyers" ? buyers : sellers;
  const currentType = activeTab === "buyers" ? "buyer" : "seller";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "#1f2937",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,.35)",
            }}
          >
            <span style={{ fontSize: 28 }}>👥</span>
          </div>
          <div>
            <h1 style={{ fontSize: 32, margin: 0, color: "#fff", fontWeight: 700 }}>
              User Management
            </h1>
            <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 14 }}>
              Manage buyers and sellers
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setActiveTab("buyers")}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "buyers" ? "#3b82f6" : "#1f2937",
              color: "#fff",
              transition: "all 0.2s",
            }}
          >
            Buyers ({buyers.length})
          </button>
          <button
            onClick={() => setActiveTab("sellers")}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "sellers" ? "#3b82f6" : "#1f2937",
              color: "#fff",
              transition: "all 0.2s",
            }}
          >
            Sellers ({sellers.length})
          </button>
        </div>

        {/* Table Card */}
        <div
          style={{
            background: "#0b1220",
            border: "1px solid #1f2937",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 10px 25px rgba(0,0,0,.25)",
          }}
        >
          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
              Loading users...
            </div>
          ) : currentData.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
              No {currentType}s found
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#1f2937" }}>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Joined</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((user, idx) => {
                    const userId = user.id;
                    const joinedDate = user.created_at || user.joined_date;
                    const status = user.status || "active";

                    return (
                      <tr
                        key={`${currentType}-${userId}-${idx}`}
                        style={{
                          borderBottom: "1px solid #1f2937",
                          background: idx % 2 === 0 ? "#0b1220" : "#111827",
                        }}
                      >
                        <td style={tdStyle}>{userId}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600, color: "#e5e7eb" }}>
                            {user.full_name || user.name}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ color: "#9ca3af", fontSize: 14 }}>{user.email}</div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ color: "#9ca3af", fontSize: 14 }}>
                            {joinedDate ? new Date(joinedDate).toLocaleDateString() : "N/A"}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 12px",
                              borderRadius: 12,
                              fontSize: 12,
                              fontWeight: 600,
                              background:
                                status === "active"
                                  ? "rgba(34, 197, 94, 0.2)"
                                  : "rgba(239, 68, 68, 0.2)",
                              color: status === "active" ? "#22c55e" : "#ef4444",
                            }}
                          >
                            {status}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {status === "inactive" ? (
                            <button
                              onClick={() => handleActivate(currentType, userId)}
                              style={{
                                padding: "8px 16px",
                                borderRadius: 6,
                                border: "none",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                                background: "#22c55e",
                                color: "#fff",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => (e.target.style.background = "#16a34a")}
                              onMouseLeave={(e) => (e.target.style.background = "#22c55e")}
                            >
                              Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeactivate(currentType, userId)}
                              style={{
                                padding: "8px 16px",
                                borderRadius: 6,
                                border: "none",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                                background: "#dc2626",
                                color: "#fff",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => (e.target.style.background = "#b91c1c")}
                              onMouseLeave={(e) => (e.target.style.background = "#dc2626")}
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const thStyle = {
  padding: "16px 20px",
  textAlign: "left",
  fontSize: 13,
  fontWeight: 700,
  color: "#cbd5e1",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle = {
  padding: "16px 20px",
  color: "#e5e7eb",
  fontSize: 14,
};

export default AdminUsers;