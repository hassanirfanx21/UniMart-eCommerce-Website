"use client";
import React, { useState } from "react";

export default function HomeHero({
  heroImage = "https://res.cloudinary.com/dy20mrrq9/image/upload/v1763217241/nust_eawxu3.png",
}) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <section
      style={{
        minHeight: "100vh",
        background: "radial-gradient(1200px 600px at 20% -10%, rgba(59,130,246,.12), transparent), radial-gradient(1000px 500px at 110% 10%, rgba(167,139,250,.12), transparent), linear-gradient(180deg, #0b1220 0%, #111827 100%)",
        padding: "72px 24px",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div style={{ width: "min(1200px, 100%)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: 32,
            alignItems: "center",
          }}
        >
          {/* Left: Text */}
          <div>
            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 14px",
                borderRadius: 999,
                background: "rgba(17,24,39,.7)",
                border: "1px solid #1f2937",
                color: "#cbd5e1",
                marginBottom: 18,
                boxShadow: "0 6px 20px rgba(0,0,0,.25)",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#60a5fa", boxShadow: "0 0 0 4px rgba(96,165,250,.2)" }} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Built for Students</span>
            </div>

            {/* Heading */}
            <h1
              style={{
                margin: 0,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "#e5e7eb",
                fontSize: 64,
              }}
            >
              The Marketplace
              <br />
              for
              {" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #60a5fa, #22d3ee)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Students
              </span>
              , by
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #60a5fa, #22d3ee)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Students.
              </span>
            </h1>

            {/* Subtext */}
            <p
              style={{
                marginTop: 18,
                color: "#93a3b8",
                fontSize: 18,
                maxWidth: 640,
              }}
            >
              Join thousands of students buying, selling, and trading everything
              from textbooks to tech. Built for your campus community, designed
              for trust and convenience.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 14, marginTop: 26, flexWrap: "wrap" }}>
              <a
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 22px",
                  borderRadius: 999,
                  fontWeight: 800,
                  textDecoration: "none",
                  background: "linear-gradient(90deg, #3b82f6, #22d3ee)",
                  color: "#0b1220",
                  boxShadow: "0 12px 40px rgba(59,130,246,.35)",
                }}
              >
                LOGIN
                <span style={{ display: "grid", placeItems: "center", width: 22, height: 22, background: "#0b1220", color: "#fff", borderRadius: "50%" }}>
                  ➜
                </span>
              </a>

              {/* <a
                href="#signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 22px",
                  borderRadius: 999,
                  fontWeight: 800,
                  textDecoration: "none",
                  background: "transparent",
                  color: "#cbd5e1",
                  border: "1px solid #334155",
                }}
              >
                Sign Up Free
              </a> */}
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 40, marginTop: 36, flexWrap: "wrap" }}>
              {[
                { value: "10K+", label: "Students" },
                { value: "50+", label: "Universities" },
                { value: "25K+", label: "Items" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ color: "#e5e7eb", fontSize: 32, fontWeight: 900 }}>{s.value}</div>
                  <div style={{ color: "#93a3b8", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Image */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                borderRadius: 24,
                overflow: "hidden",
                border: "1px solid #1f2937",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,.02), 0 30px 80px rgba(0,0,0,.45)",
                background: imageError 
                  ? "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(34,211,238,0.1) 100%)"
                  : "linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,0))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 520,
              }}
            >
              {!imageError ? (
                <img
                  src={heroImage}
                  alt="Campus building"
                  style={{ width: "100%", height: 520, objectFit: "cover", display: "block" }}
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              ) : (
                <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 16px" }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#94a3b8" }}>UniMart</div>
                  <div style={{ fontSize: 14, marginTop: 8 }}>Student Marketplace</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
