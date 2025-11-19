"use client";
import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

// Center-text plugin to draw total revenue inside the donut
const centerTextPlugin = {
  id: "centerText",

  beforeDraw: (chart) => {

    const {
      ctx,
      chartArea: { width, height, left, top },
    } = chart;
    const datasets = chart.data.datasets;
    if (!datasets || datasets.length === 0) return;
    const total = datasets[0].data.reduce((a, b) => a + (Number(b) || 0), 0);

    const centerX = left + width / 2;
    const centerY = top + height / 2;

    ctx.save();

    // small label
    ctx.fillStyle = "#94a3b8"; // cool muted slate
    ctx.font = `600 ${Math.round(Math.min(width, height) * 0.07)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "Total",
      centerX,
      centerY - Math.round(Math.min(width, height) * 0.06)
    );

    // big total value
    ctx.fillStyle = "#e6f0ff";
    ctx.font = `700 ${Math.round(Math.min(width, height) * 0.12)}px sans-serif`;
    const display = typeof total === "number" ? total.toLocaleString() : total;
    ctx.fillText(
      display,
      centerX,
      centerY + Math.round(Math.min(width, height) * 0.06)
    );

    ctx.restore();
  },
};

// Do NOT register globally to avoid affecting other charts.

export default function SectionRevenuePie() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/admin/section-revenue")
      .then((res) => res.json())
      .then((data) => {
        const labels = data.map((item) => item.section);
        const totals = data.map((item) => item.total);

        // Exact color mapping per section
        const COLOR_MAP = {
          clothes: "rgba(135, 206, 250, 0.85)", // Light Sky Blue
          food: "rgba(0, 77, 77, 0.85)", // Dark Teal
          "study tools": "rgba(255, 140, 0, 0.85)", // Burnt Orange
        };
        const FALLBACK = "rgba(203, 213, 225, 0.5)"; // slate-300 fallback
        const backgroundColors = labels.map((lbl) =>
          COLOR_MAP[lbl?.toLowerCase?.() || lbl] || FALLBACK
        );
        const hoverColors = backgroundColors.map((c) => c.replace(/0\.85\)/, "1)"));

        setChartData({
          labels,
          datasets: [
            {
              data: totals,
              backgroundColor: backgroundColors,
              hoverBackgroundColor: hoverColors,
              borderColor: "#0a0e1a",
              borderWidth: 2,
              hoverOffset: 16,
              borderRadius: 8,
              spacing: 4,
            },
          ],
        });
      })
      .catch((err) => console.error("Pie chart fetch failed:", err));
  }, []);

  if (!chartData) return <p className="text-slate-400">Loading pie chart...</p>;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid rgba(100,116,139,0.2)",
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
          Revenue by Section
        </h3>
        <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: 500 }}>This year</div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 420, height: 350 }}>
          <Pie
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "62%", // donut
              plugins: {
                legend: {
                  display: true,
                  position: "right",
                  labels: {
                    color: "#cbd5e1",
                    font: { size: 13, weight: 500 },
                    usePointStyle: true,
                    pointStyle: "circle",
                    padding: 14,
                    boxWidth: 12,
                    boxHeight: 12,
                  },
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const value = Number(context.parsed || 0);
                      const sum = context.chart.data.datasets[0].data.reduce(
                        (a, b) => a + Number(b || 0),
                        0
                      );
                      const pct = sum
                        ? ((value / sum) * 100).toFixed(1)
                        : "0.0";
                      return `${
                        context.label
                      }: ${value.toLocaleString()} (${pct}%)`;
                    },
                  },
                  backgroundColor: "rgba(10,14,26,0.95)",
                  titleColor: "#e5e7eb",
                  bodyColor: "#cbd5e1",
                  borderColor: "rgba(100,116,139,0.4)",
                  borderWidth: 1,
                  padding: 14,
                  boxPadding: 6,
                },
                centerText: {},
              },
              animation: {
                duration: 1000,
                easing: "easeOutCubic",
              },
            }}
            // Register plugin only for this chart instance
            plugins={[centerTextPlugin]}
          />
        </div>
      </div>
    </div>
  );
}
