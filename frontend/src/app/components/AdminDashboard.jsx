"use client";

import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import StackedBarChart from "./StackedBarChart";
import SectionRevenuePie from "./SectionRevenuePie";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
// no external date adapter used; we'll pass string labels
ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

function formatDateIso(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [selectedSection, setSelectedSection] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); //for piechart
  
  // Stats data
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeUsers: 0,
    totalSales: 0,
    productsListed: 0,
  });

  // Range controls
  const [rangeType, setRangeType] = useState("day"); // day | month | year
  const [rangeValue, setRangeValue] = useState("7"); // for day: 7,30,90 ; for month: 1-12 ; for year: year value
  const [yearValue, setYearValue] = useState("2025");

  // prepare year options from 2023..2026 (you can expand)
  const yearOptions = useMemo(() => {
    const start = 2023;
    const end = 2026;
    const arr = [];
    for (let y = start; y <= end; y++) arr.push(String(y));
    return arr;
  }, []);

  // update rangeValue default when rangeType changes
  useEffect(() => {
    if (rangeType === "day") setRangeValue("7");
    else if (rangeType === "month")
      setRangeValue(String(new Date().getMonth() + 1));
    else if (rangeType === "year")
      setRangeValue(yearValue || String(new Date().getFullYear()));
  }, [rangeType]);

  // auth + initial fetch
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return (window.location.href = "/login");

    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      if (decoded.role !== "admin") return (window.location.href = "/");
      setAdmin(decoded);
    } catch {
      return (window.location.href = "/login");
    }

    // initial fetch using defaults
    fetchData();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch whenever filters change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeType, rangeValue, yearValue, selectedSection]);

  function buildUrl() {
    const base = "http://localhost:5000/admin/purchases";
    const params = new URLSearchParams();
    
    // Validate rangeType
    if (!["day", "month", "year"].includes(rangeType)) {
      console.error("Invalid range type:", rangeType);
      params.set("type", "day");
    } else {
      params.set("type", rangeType);
    }

    if (rangeType === "day") {
      // Validate day range value
      const validDayRanges = ["7", "30", "90"];
      if (!validDayRanges.includes(rangeValue)) {
        console.error("Invalid day range:", rangeValue);
        params.set("range", "7");
      } else {
        params.set("range", rangeValue);
      }
    } else if (rangeType === "month") {
      // Validate month (1-12)
      const monthNum = parseInt(rangeValue, 10);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        console.error("Invalid month:", rangeValue);
        params.set("month", "1");
      } else {
        params.set("month", rangeValue);
      }
      
      // Validate year
      const yearNum = parseInt(yearValue, 10);
      if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
        console.error("Invalid year:", yearValue);
        params.set("year", String(new Date().getFullYear()));
      } else {
        params.set("year", yearValue);
      }
    } else if (rangeType === "year") {
      // Validate year
      const yearNum = parseInt(rangeValue || yearValue, 10);
      if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
        console.error("Invalid year:", rangeValue);
        params.set("year", String(new Date().getFullYear()));
      } else {
        params.set("year", rangeValue || yearValue);
      }
    }

    // Validate section
    const validSections = ["all", "study tools", "clothes", "food"];
    if (selectedSection && validSections.includes(selectedSection)) {
      params.set("section", selectedSection);
    } else {
      console.error("Invalid section:", selectedSection);
      params.set("section", "all");
    }

    return `${base}?${params.toString()}`;
  }

  function fetchData() {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    const url = buildUrl();
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            alert("⚠ Session expired. Please log in again.");
            window.location.href = "/login";
          }
          throw new Error(`Failed to fetch data (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("Invalid data format received:", data);
          setSalesData([]);
          return;
        }
        setSalesData(data || []);
      })
      .catch((err) => {
        console.error("Error fetching sales:", err);
        alert("⚠ Failed to fetch sales data. Please try again.");
        setSalesData([]);
      });
  }

  function fetchStats() {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    fetch("http://localhost:5000/admin/dashboard-stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            alert("⚠ Session expired. Please log in again.");
            window.location.href = "/login";
          }
          throw new Error(`Failed to fetch stats (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        // Validate received data
        if (typeof data !== "object") {
          console.error("Invalid stats data format:", data);
          return;
        }
        
        setStats({
          totalRevenue: Number(data.totalRevenue) || 0,
          activeUsers: Number(data.activeUsers) || 0,
          totalSales: Number(data.totalSales) || 0,
          productsListed: Number(data.productsListed) || 0,
        });
      })
      .catch((err) => {
        console.error("Error fetching stats:", err);
        alert("⚠ Failed to fetch dashboard statistics. Please refresh the page.");
      });
  }

  // Grouping logic: produce labels and values array for chart depending on rangeType
  const { labels, values } = useMemo(() => {
    if (!salesData || salesData.length === 0) {
      return { labels: [], values: [] };
    }

    // convert rows to Date objects
    const rows = salesData.map((r) => {
      return { ...r, ts: new Date(r.purchase_date) };
    });

    if (rangeType === "day") {
      // rangeValue days back including today
      const days = parseInt(rangeValue, 10) || 7;
      const end = new Date(); // today
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(end.getDate() - (days - 1));
      start.setHours(0, 0, 0, 0);

      // create date labels array
      const labelsArr = [];
      const valuesMap = {};
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = formatDateIso(d);
        labelsArr.push(key);
        valuesMap[key] = 0;
      }

      rows.forEach((r) => {
        const key = formatDateIso(r.ts);
        if (key in valuesMap) valuesMap[key] += 1;
      });

      return {
        labels: labelsArr,
        values: labelsArr.map((l) => valuesMap[l] || 0),
      };
    } else if (rangeType === "month") {
      // month-day aggregation for the chosen month/year
      const m = parseInt(rangeValue, 10); // 1..12
      const y = parseInt(yearValue, 10) || new Date().getFullYear();
      const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const end = new Date(y, m, 0, 23, 59, 59, 999); // last day of month
      const labelsArr = [];
      const valuesMap = {};
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = formatDateIso(d);
        labelsArr.push(key);
        valuesMap[key] = 0;
      }
      rows.forEach((r) => {
        const key = formatDateIso(r.ts);
        if (key in valuesMap) valuesMap[key] += 1;
      });
      return {
        labels: labelsArr,
        values: labelsArr.map((l) => valuesMap[l] || 0),
      };
    } else if (rangeType === "year") {
      // month aggregation for the whole year
      const y =
        parseInt(rangeValue || yearValue, 10) || new Date().getFullYear();
      const labelsArr = [];
      const valuesMap = {};
      for (let m = 0; m < 12; m++) {
        // label like 2025-01
        const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`;
        labelsArr.push(monthKey);
        valuesMap[monthKey] = 0;
      }
      rows.forEach((r) => {
        const key = `${r.ts.getFullYear()}-${String(
          r.ts.getMonth() + 1
        ).padStart(2, "0")}`;
        if (key in valuesMap) valuesMap[key] += 1;
      });
      return {
        labels: labelsArr,
        values: labelsArr.map((l) => valuesMap[l] || 0),
      };
    }

    return { labels: [], values: [] };
  }, [salesData, rangeType, rangeValue, yearValue]);

  const chartData = {
    labels,
    datasets: [
      {
        label: `${
          selectedSection === "all" ? "All sections" : selectedSection
        } - ${rangeType}`,
        data: values,
        borderColor: "#87CEFA",
        backgroundColor: "transparent",
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0a0e1a 0%, #1a1f2e 100%)",
        padding: "40px 20px",
      }}
    >
       {/* Hero Header */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(192,38,211,0.1) 0%, rgba(124,58,237,0.1) 100%)",
            borderRadius: 24,
            padding: "32px 40px",
            marginBottom: 32,
            border: "1px solid rgba(192,38,211,0.2)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #c026d3 0%, #7c3aed 100%)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 10px 30px rgba(192,38,211,0.4)",
                }}
              >
                <span style={{ fontSize: 36 }}>🛡️</span>
              </div>
              <div>
                <h1
                  style={{
                    fontSize: 36,
                    margin: 0,
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #e879f9 0%, #a78bfa 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Admin Dashboard
                </h1>
                {admin && (
                  <p style={{ margin: "6px 0 0", color: "#cbd5e1", fontSize: 16 }}>
                    Welcome back, <span style={{ fontWeight: 600, color: "#e879f9" }}>{admin.full_name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div
                style={{
                  background: "rgba(14,165,233,0.1)",
                  border: "1px solid rgba(14,165,233,0.3)",
                  borderRadius: 12,
                  padding: "12px 20px",
                  minWidth: 100,
                }}
              >
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Total Sales</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#0ea5e9" }}>
                  {values.reduce((a, b) => a + b, 0)}
                </div>
              </div>
              <div
                style={{
                  background: "rgba(168,85,247,0.1)",
                  border: "1px solid rgba(168,85,247,0.3)",
                  borderRadius: 12,
                  padding: "12px 20px",
                  minWidth: 100,
                }}
              >
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Active Period</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#a855f7" }}>
                  {rangeType === "day" ? `${rangeValue}d` : rangeType === "month" ? "1m" : "1y"}
                </div>
              </div>
            </div>
          </div>
        </div>
      <div style={{ maxWidth: 1400, margin: "0 auto", color: "#e5e7eb" }}>
        {/* Stats Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20,
            marginBottom: 32,
          }}
        >
          {/* Total Revenue */}
          <div
            style={{
              background: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(6,182,212,0.3)",
              borderRadius: 20,
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              backdropFilter: "blur(10px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 8px 20px rgba(6,182,212,0.4)",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#10b981",
                  background: "rgba(16,185,129,0.1)",
                  padding: "4px 10px",
                  borderRadius: 8,
                }}
              >
                +12.5%
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              ${stats.totalRevenue.toLocaleString()}
            </div>
            <div style={{ fontSize: 14, color: "#94a3b8" }}>Total Revenue</div>
          </div>

          {/* Active Users */}
          <div
            style={{
              background: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 20,
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              backdropFilter: "blur(10px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 8px 20px rgba(16,185,129,0.4)",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#10b981",
                  background: "rgba(16,185,129,0.1)",
                  padding: "4px 10px",
                  borderRadius: 8,
                }}
              >
                +8.2%
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              {stats.activeUsers.toLocaleString()}
            </div>
            <div style={{ fontSize: 14, color: "#94a3b8" }}>Active Users</div>
          </div>

          {/* Total Sales */}
          <div
            style={{
              background: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: 20,
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              backdropFilter: "blur(10px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 8px 20px rgba(139,92,246,0.4)",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#10b981",
                  background: "rgba(16,185,129,0.1)",
                  padding: "4px 10px",
                  borderRadius: 8,
                }}
              >
                +15.3%
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              {stats.totalSales.toLocaleString()}
            </div>
            <div style={{ fontSize: 14, color: "#94a3b8" }}>Total Sales</div>
          </div>

          {/* Products Listed */}
          <div
            style={{
              background: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 20,
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              backdropFilter: "blur(10px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 8px 20px rgba(99,102,241,0.4)",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#10b981",
                  background: "rgba(16,185,129,0.1)",
                  padding: "4px 10px",
                  borderRadius: 8,
                }}
              >
                +5.7%
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              {stats.productsListed.toLocaleString()}
            </div>
            <div style={{ fontSize: 14, color: "#94a3b8" }}>Products Listed</div>
          </div>
        </div>

       

        {/* Controls */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(8px)",
            padding: "16px 24px",
            borderRadius: 16,
            border: "1px solid rgba(100,116,139,0.2)",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#e5e7eb",
              fontWeight: 600,
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>📊</span>
            Sales Overview
          </h3>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Range Type */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#9ca3af" }}>Range</label>
              <select
                value={rangeType}
                onChange={(e) => setRangeType(e.target.value)}
                style={{
                  padding: "8px 10px",
                  background: "#0b1220",
                  color: "#e5e7eb",
                  border: "1px solid #1f2937",
                  borderRadius: 8,
                }}
              >
                <option value="day">Day</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>

            {/* Range Value */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#9ca3af" }}>Value</label>

              {rangeType === "day" && (
                <select
                  value={rangeValue}
                  onChange={(e) => setRangeValue(e.target.value)}
                  style={{
                    padding: "8px 10px",
                    background: "#0b1220",
                    color: "#e5e7eb",
                    border: "1px solid #1f2937",
                    borderRadius: 8,
                  }}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              )}

              {rangeType === "month" && (
                <select
                  value={rangeValue}
                  onChange={(e) => setRangeValue(e.target.value)}
                  style={{
                    padding: "8px 10px",
                    background: "#0b1220",
                    color: "#e5e7eb",
                    border: "1px solid #1f2937",
                    borderRadius: 8,
                  }}
                >
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              )}

              {rangeType === "year" && (
                <select
                  value={rangeValue}
                  onChange={(e) => setRangeValue(e.target.value)}
                  style={{
                    padding: "8px 10px",
                    background: "#0b1220",
                    color: "#e5e7eb",
                    border: "1px solid #1f2937",
                    borderRadius: 8,
                  }}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Year selector - appears when month or year type to ensure month+year pairing */}
            {(rangeType === "month" || rangeType === "year") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: "#9ca3af" }}>Year</label>
                <select
                  value={yearValue}
                  onChange={(e) => setYearValue(e.target.value)}
                  style={{
                    padding: "8px 10px",
                    background: "#0b1220",
                    color: "#e5e7eb",
                    border: "1px solid #1f2937",
                    borderRadius: 8,
                  }}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Section selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#9ca3af" }}>Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                style={{
                  padding: "8px 10px",
                  background: "#0b1220",
                  color: "#e5e7eb",
                  border: "1px solid #1f2937",
                  borderRadius: 8,
                }}
              >
                <option value="all">All</option>
                <option value="study tools">Study Tools</option>
                <option value="clothes">Clothes</option>
                <option value="food">Food</option>
              </select>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: 24, marginBottom: 24 }}>
          {/* Line Chart - Sales Overview */}
          <div
            style={{
              background: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(100,116,139,0.3)",
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: "1px solid rgba(100,116,139,0.2)",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 18, marginBottom: 4 }}>
                  {selectedSection === "all"
                    ? "All sections"
                    : selectedSection.charAt(0).toUpperCase() +
                      selectedSection.slice(1)}{" "}
                  Sales Trend
                </div>
                <div style={{ color: "#94a3b8", fontSize: 13 }}>
                  {rangeType === "day"
                    ? `Last ${rangeValue} days`
                    : rangeType === "month"
                    ? `Month ${rangeValue} / ${yearValue}`
                    : `Year ${rangeValue || yearValue}`}
                </div>
              </div>
            </div>

            <div style={{ height: 340 }}>
              <Line
                data={chartData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      ticks: { color: "#cbd5e1", font: { size: 11 } },
                      grid: { color: "rgba(255,255,255,0.05)" },
                    },
                    y: {
                      ticks: { color: "#cbd5e1", font: { size: 11 } },
                      grid: { color: "rgba(255,255,255,0.05)" },
                    },
                  },
                  plugins: {
                    legend: { labels: { color: "#cbd5e1", font: { size: 12 } } },
                    tooltip: { mode: "index", intersect: false },
                  },
                }}
              />
            </div>
          </div>

          {/* Pie Chart - Section Revenue */}
          <div
            style={{
              background: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(100,116,139,0.3)",
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              backdropFilter: "blur(10px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SectionRevenuePie />
          </div>
        </div>

        {/* Bar Chart - Revenue Growth (Full Width) */}
        <div
          style={{
            background: "rgba(15,23,42,0.8)",
            border: "1px solid rgba(100,116,139,0.3)",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: "1px solid rgba(100,116,139,0.2)",
            }}
          >
            <span style={{ fontSize: 22 }}>📈</span>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
              Revenue Growth Analysis
            </h3>
          </div>
          <StackedBarChart />
        </div>
      </div>
    </div>
  );
}
