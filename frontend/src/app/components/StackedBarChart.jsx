"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Chart.js animation state flag (stagger only on first draw)
let delayed = false;
const MONTH_LABELS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

const SECTIONS = ["clothes", "food", "study tools"];

// Softer fills with matching borders/hover for dark background
const COLORS = [
  "rgba(135, 206, 250, 0.85)",  // Light Sky Blue
  "rgba(0, 77, 77, 0.85)",      // Dark Teal
  "rgba(255, 140, 0, 0.85)",    // Burnt Orange
];

const COLORS_HOVER = [
  "rgba(135, 206, 250, 1)",
  "rgba(0, 77, 77, 1)",
  "rgba(255, 140, 0, 1)",
];

const COLORS_BORDER = [
  "#87CEFA", // Light Sky Blue
  "#004D4D", // Dark Teal
  "#FF8C00", // Burnt Orange
];


export default function StackedBarChart() {
  const [data, setData] = useState([]);
  const [viewMode, setViewMode] = useState("yearly");
  const [chartYear, setChartYear] = useState(new Date().getFullYear());

  // Fetch revenue chart data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/admin/revenue-chart?year=${chartYear}&viewMode=${viewMode}`
        );
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching revenue chart:", err);
      }
    };
    fetchData();
  }, [chartYear, viewMode]);

  // Format data for Chart.js
  const chartObj = useMemo(() => {
    if (!data || !data.length) return { labels: [], datasets: [] };

    if (viewMode === "yearly") {
      // Build 12 months zeroed
      const monthly = Array.from({ length: 12 }, () => ({
        clothes: 0, food: 0, "study tools": 0
      }));

      data.forEach(d => {
        const month = Number(d.month) - 1; // 0-indexed
        const section = d.section;
        const total = Number(d.total || 0);

        if (month >= 0 && month < 12 && SECTIONS.includes(section)) {
          monthly[month][section] = total;
        }
      });

      const datasets = SECTIONS.map((sec, idx) => ({
        label: sec,
        data: monthly.map(m => m[sec]),
        backgroundColor: COLORS[idx],
        hoverBackgroundColor: COLORS_HOVER[idx],
        borderColor: COLORS_BORDER[idx],
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      }));

      return { labels: MONTH_LABELS, datasets };
    } else {
      // All-time per year
      const yearsSet = new Set(data.map(d => Number(d.year)));
      if (!yearsSet.has(chartYear)) yearsSet.add(chartYear); // ensure selected year included
      const years = Array.from(yearsSet).sort((a,b) => a-b);

      const datasets = SECTIONS.map((sec, idx) => ({
        label: sec,
        data: years.map(y => {
          const row = data.find(d => Number(d.year) === y && d.section === sec);
          return row ? Number(row.total) : 0;
        }),
        backgroundColor: COLORS[idx],
        hoverBackgroundColor: COLORS_HOVER[idx],
        borderColor: COLORS_BORDER[idx],
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      }));

      return { labels: years, datasets };
    }
  }, [data, viewMode, chartYear]);

  // Year dropdown options: last 6 years + ensure selected year included
  const defaultYears = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  const yearOptions = Array.from(new Set([...defaultYears, chartYear])).sort((a,b) => b-a);

  return (
    <div style={{ width: "100%" }}>
      {/* Filters */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 16, gap: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500 }}>Mode</label>
          <select
            value={viewMode}
            onChange={e => setViewMode(e.target.value)}
            style={{ 
              padding: "8px 12px", 
              background: "rgba(10,14,26,0.8)", 
              color: "#e5e7eb", 
              border: "1px solid rgba(100,116,139,0.3)", 
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            <option value="yearly">Monthly (selected year)</option>
            <option value="allTime">All-time (per year)</option>
          </select>
        </div>

        {viewMode === "yearly" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500 }}>Year</label>
            <select
              value={chartYear}
              onChange={e => setChartYear(Number(e.target.value))}
              style={{ 
                padding: "8px 12px", 
                background: "rgba(10,14,26,0.8)", 
                color: "#e5e7eb", 
                border: "1px solid rgba(100,116,139,0.3)", 
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height: 400 }}>
        <Bar
          data={chartObj}
          options={{
            maintainAspectRatio: false,
            responsive: true,
            animation: {
              duration: 1500,
              easing: "easeOutQuart",
              onComplete: () => {
                delayed = true;
              },
              delay: (context) => {
                let delayMs = 0;
                if (context.type === "data" && context.mode === "default" && !delayed) {
                  delayMs = context.dataIndex * 300 + context.datasetIndex * 100;
                }
                return delayMs;
              },
            },
            layout: { padding: 8 },
            datasets: {
              bar: {
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 50,
                categoryPercentage: 0.75,
                barPercentage: 0.9,
              },
            },
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  color: "#cbd5e1",
                  usePointStyle: true,
                  pointStyle: "roundedRect",
                  boxWidth: 12,
                  padding: 18,
                  font: { size: 13, weight: 500 },
                },
              },
              tooltip: {
                mode: "index",
                intersect: false,
                backgroundColor: "rgba(10,14,26,0.95)",
                titleColor: "#e5e7eb",
                bodyColor: "#cbd5e1",
                borderColor: "rgba(100,116,139,0.4)",
                borderWidth: 1,
                padding: 14,
                displayColors: true,
                boxPadding: 6,
              },
            },
            scales: {
              x: {
                stacked: true,
                ticks: { color: "#94a3b8", font: { size: 12 } },
                grid: { color: "rgba(255,255,255,0.05)", drawBorder: false },
              },
              y: {
                stacked: true,
                ticks: { color: "#94a3b8", font: { size: 12 } },
                grid: { color: "rgba(255,255,255,0.05)", drawBorder: false },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
