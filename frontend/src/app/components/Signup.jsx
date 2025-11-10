"use client"; // Required for client-side hooks like useState/useEffect

import { useState } from "react";
import { useRouter } from "next/navigation"; // ✅ App Router version

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("buyer"); // default role
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password) return alert("Fill all fields!");

    try {
      const res = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (res.ok) {
        // ✅ Store token immediately after signup
        localStorage.setItem("token", data.token);
        // Trust the selected role to keep navbar consistent post-signup
        localStorage.setItem("role", role);

        alert(`Signed up and logged in as ${role}`);
        if (role === "buyer") {
          router.push("/catalogue"); // or "/CataloguePage" based on your route
        } else {
          router.push("/seller-profile"); 
          //i have to change this after login and add a dashboard for seller and admin
          ///keep in minds for later that i have to create a dashboard for seller and admin
          //router.push("/"); // normal homepage for others --- IGNORE ---
        }
      } else {
        alert(data.message || "Signup failed");
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
        background: "linear-gradient(180deg, #0b1220 0%, #111827 100%)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
      }}
      className="w-full"
    >
      {/* Left: Image with bluish overlay and copy */}
      <div className="relative hidden md:block">
        <img
          src="https://images.unsplash.com/photo-1653539465770-2d7120d830bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMGxhcHRvcCUyMHVuaXZlcnNpdHl8ZW58MXx8fHwxNzYxMTYwOTM2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Students campus"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Bluish overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, rgba(2,6,23,0.75) 0%, rgba(2,6,23,0.55) 40%, rgba(2,6,23,0.0) 100%), radial-gradient(800px 400px at 20% 40%, rgba(59,130,246,0.30))"
          }}
        />
        <div className="relative z-10 h-full flex flex-col items-start justify-center px-12">
          <h1 className="text-white/95" style={{ fontWeight: 800, letterSpacing: "-0.02em", fontSize: 56 }}>
            Welcome to UNIMART
          </h1>
          <p className="mt-3 text-white/80" style={{ fontSize: 18 }}>
            Join the student marketplace revolution
          </p>
        </div>
      </div>

      {/* Right: Form card */}
      <div className="flex items-center justify-center p-6 md:p-8">
        <div
          className="w-full max-w-lg"
          style={{
            background: "#0b1220",
            borderRadius: 20,
            border: "1px solid #1f2937",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            padding: 28,
          }}
        >
          <h2 className="text-white" style={{ fontSize: 36, fontWeight: 800 }}>Create Account</h2>
          <p style={{ color: "#9ca3af", marginTop: 6 }}>
            Start trading with your campus community
          </p>

          {/* Buyer/Seller toggle */}
          <div className="mt-6 flex" style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 12 }}>
            <button
              onClick={() => setRole("buyer")}
              className="flex-1 py-2 px-3"
              style={{
                borderRadius: 12,
                background: role === "buyer" ? "linear-gradient(90deg,#60a5fa,#38bdf8)" : "transparent",
                color: role === "buyer" ? "#0b1220" : "#9ca3af",
                fontWeight: 800,
              }}
            >
              Buyer
            </button>
            <button
              onClick={() => setRole("seller")}
              className="flex-1 py-2 px-3"
              style={{
                borderRadius: 12,
                background: role === "seller" ? "linear-gradient(90deg,#60a5fa,#38bdf8)" : "transparent",
                color: role === "seller" ? "#0b1220" : "#9ca3af",
                fontWeight: 800,
              }}
            >
              Seller
            </button>
          </div>

          {/* Inputs */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: "#9ca3af" }}>Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
                style={{ background: "#0f172a", border: "1px solid #1f2937", color: "#e5e7eb", padding: "12px 14px", borderRadius: 10, outline: "none" }}
              />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: "#9ca3af" }}>Email</label>
              <input
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                style={{ background: "#0f172a", border: "1px solid #1f2937", color: "#e5e7eb", padding: "12px 14px", borderRadius: 10, outline: "none" }}
              />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: "#9ca3af" }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                style={{ background: "#0f172a", border: "1px solid #1f2937", color: "#e5e7eb", padding: "12px 14px", borderRadius: 10, outline: "none" }}
              />
            </div>
            <label className="flex items-start gap-3" style={{ color: "#9ca3af", fontSize: 14 }}>
              <input type="checkbox" className="mt-1" />
              I agree to the Terms & Conditions and Privacy Policy
            </label>
          </div>

          {/* Create Account */}
          <button
            onClick={handleSignup}
            className="w-full mt-6"
            style={{
              background: "linear-gradient(90deg,#60a5fa,#38bdf8)",
              color: "#0b1220",
              padding: "12px 16px",
              borderRadius: 10,
              fontWeight: 900,
              boxShadow: "0 10px 30px rgba(96,165,250,0.35)",
            }}
          >
            Create Account
          </button>

          

          {/* Footer */}
          <p className="mt-6 text-center" style={{ color: "#9ca3af" }}>
            Already have an account? <a href="/login" style={{ color: "#60a5fa", fontWeight: 700 }}>Login</a>
          </p>
        </div>
      </div>
    </section>
  );
}
