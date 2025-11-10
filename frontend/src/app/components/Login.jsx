"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("buyer"); // default role
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return alert("Fill all fields!");

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Logged in as ${role}`);
        localStorage.setItem("token", data.token); // store JWT
        // Trust the selected role from the UI to drive navbar
        localStorage.setItem("role", role);
        // router.push("/");
        // ✅ Redirect based on role
        if (role === "buyer") {
          router.push("/catalogue"); // or "/CataloguePage" based on your route
        } else if (role === "seller") {
          router.push("/add-product"); // Placeholder for seller dashboard route
        } else if (role === "admin") {
          router.push("/admin-dashboard"); // Placeholder for admin dashboard route
          // router.push("/admin-dashboard"); // Placeholder for admin dashboard route
        } else {
          router.push("/"); //i have to change this after login and add a dashboard for seller and admin
          ///keep in minds for later that i have to create a dashboard for seller and admin
          //
        }
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <section
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#0b1220 0%, #111827 100%)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
      }}
      className="w-full"
    >
      {/* Left: Form Panel */}
      <div className="flex items-center justify-center px-6 py-10">
        <div
          style={{
            background: "#0b1220",
            border: "1px solid #1f2937",
            borderRadius: 20,
            width: "100%",
            maxWidth: 520,
            padding: 40,
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(90deg,#60a5fa,#38bdf8)",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                color: "#0b1220",
                fontSize: 20,
              }}
            >
              U
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#e5e7eb", letterSpacing: "-0.02em" }}>UniMart</h1>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#e5e7eb" }}>Login to UniMart</h2>
          <p style={{ marginTop: 6, fontSize: 14, color: "#9ca3af" }}>Please enter your login info</p>

          {/* Role segmented control */}
            <div
              style={{
                marginTop: 28,
                display: "flex",
                background: "#0f172a",
                border: "1px solid #1f2937",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {["buyer","seller","admin"].map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    fontWeight: 700,
                    background: role===r?"linear-gradient(90deg,#60a5fa,#38bdf8)":"transparent",
                    color: role===r?"#0b1220":"#9ca3af",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {r.charAt(0).toUpperCase()+r.slice(1)}
                </button>
              ))}
            </div>

          {/* Inputs grid */}
          <div style={{ display: "grid", gap: 18, marginTop: 32 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#9ca3af", marginBottom: 6 }}>Email</label>
              <input
                type="email"
                placeholder="JohnDoe@gmail.edu.pk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  background: "#0f172a",
                  border: "1px solid #1f2937",
                  color: "#e5e7eb",
                  padding: "12px 14px",
                  borderRadius: 10,
                  outline: "none",
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#9ca3af", marginBottom: 6 }}>Password</label>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  background: "#0f172a",
                  border: "1px solid #1f2937",
                  color: "#e5e7eb",
                  padding: "12px 14px",
                  borderRadius: 10,
                  outline: "none",
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 14, marginTop: 30 }}>
            <button
              onClick={() => router.back()}
              style={{
                flex: 1,
                background: "#fbbf24",
                color: "#0b1220",
                fontWeight: 700,
                padding: "12px 16px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(251,191,36,0.35)",
              }}
            >
              Back
            </button>
            <button
              onClick={handleLogin}
              style={{
                flex: 1,
                background: "#0f172a",
                border: "1px solid #1f2937",
                color: "#e5e7eb",
                fontWeight: 800,
                padding: "12px 16px",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              Next
            </button>
          </div>

          <p style={{ marginTop: 28, fontSize: 13, color: "#9ca3af", textAlign: "left" }}>
            Don't have an account? <a href="/signup" style={{ color: "#60a5fa", fontWeight: 600 }}>Sign up here</a>
          </p>
        </div>
      </div>

      {/* Right: Image panel with overlay and logo */}
      <div className="relative hidden md:block">
        <img
          src="https://res.cloudinary.com/dy20mrrq9/image/upload/v1763224150/log_je0pfs.jpg"
          alt="Forest inspiration"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(11,18,32,0.85) 0%, rgba(11,18,32,0.55) 40%, rgba(11,18,32,0.0) 100%), radial-gradient(800px 400px at 30% 45%, rgba(96,165,250,0.35), transparent)",
          }}
        />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div
            style={{
              background: "rgba(15,23,42,0.65)",
              padding: "18px 34px",
              borderRadius: 20,
              backdropFilter: "blur(4px)",
              border: "1px solid #1f2937",
              boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", background: "linear-gradient(90deg,#60a5fa,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>UniMart</span>
          </div>
        </div>
      </div>
    </section>
  );
}
