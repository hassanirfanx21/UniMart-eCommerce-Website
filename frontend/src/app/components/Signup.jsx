"use client"; // Required for client-side hooks like useState/useEffect

import { useState } from "react";
import { useRouter } from "next/navigation"; // ✅ App Router version

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("buyer"); // default role
  const [errors, setErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const router = useRouter();

  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (!/^[a-zA-Z\s]+$/.test(name)) return "Name can only contain letters and spaces";
    return null;
  };

  const validateEmail = (email, role) => {
    if (!email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    
    // Buyer must have .edu.pk email
    if (role === "buyer" && !email.toLowerCase().endsWith(".edu.pk")) {
      return "Buyers must use a university email ending with .edu.pk";
    }
    return null;
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 2) return "Password must be at least 2 characters";
    return null;
  };

  const handleSignup = async () => {
    // Clear previous errors
    setErrors({});
    const newErrors = {};

    // Validate all fields
    const nameError = validateName(name);
    const emailError = validateEmail(email, role);
    const passwordError = validatePassword(password);

    if (nameError) newErrors.name = nameError;
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    if (!termsAccepted) newErrors.terms = "You must accept the Terms & Conditions";

    // If there are any errors, display them and stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Show first error in alert
      const firstError = Object.values(newErrors)[0];
      alert(firstError);
      return;
    }

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

        alert(`✅ Successfully signed up and logged in as ${role}`);
        if (role === "buyer") {
          router.push("/catalogue");
        } else {
          router.push("/seller-profile");
        }
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Server error. Please try again later.");
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
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    const err = validateName(e.target.value);
                    setErrors(prev => ({ ...prev, name: err }));
                  }
                }}
                className="w-full"
                style={{ 
                  background: "#0f172a", 
                  border: `1px solid ${errors.name ? '#ef4444' : '#1f2937'}`, 
                  color: "#e5e7eb", 
                  padding: "12px 14px", 
                  borderRadius: 10, 
                  outline: "none" 
                }}
              />
              {errors.name && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>⚠ {errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: "#9ca3af" }}>Email</label>
              <input
                type="email"
                placeholder={role === "buyer" ? "you@university.edu.pk" : "you@email.com"}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    const err = validateEmail(e.target.value, role);
                    setErrors(prev => ({ ...prev, email: err }));
                  }
                }}
                className="w-full"
                style={{ 
                  background: "#0f172a", 
                  border: `1px solid ${errors.email ? '#ef4444' : '#1f2937'}`, 
                  color: "#e5e7eb", 
                  padding: "12px 14px", 
                  borderRadius: 10, 
                  outline: "none" 
                }}
              />
              {role === "buyer" && !errors.email && <p style={{ color: "#60a5fa", fontSize: 11, marginTop: 4 }}>ℹ️ Buyers must use university email (.edu.pk)</p>}
              {errors.email && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>⚠ {errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: "#9ca3af" }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    const err = validatePassword(e.target.value);
                    setErrors(prev => ({ ...prev, password: err }));
                  }
                }}
                className="w-full"
                style={{ 
                  background: "#0f172a", 
                  border: `1px solid ${errors.password ? '#ef4444' : '#1f2937'}`, 
                  color: "#e5e7eb", 
                  padding: "12px 14px", 
                  borderRadius: 10, 
                  outline: "none" 
                }}
              />
              {!errors.password && password.length > 0 && <p style={{ color: "#9ca3af", fontSize: 11, marginTop: 4 }}>Can contain numbers or characters (min 2 chars)</p>}
              {errors.password && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>⚠ {errors.password}</p>}
            </div>
            <div>
              <label className="flex items-start gap-3" style={{ color: errors.terms ? "#ef4444" : "#9ca3af", fontSize: 14 }}>
                <input 
                  type="checkbox" 
                  className="mt-1" 
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (errors.terms && e.target.checked) {
                      setErrors(prev => ({ ...prev, terms: null }));
                    }
                  }}
                />
                I agree to the Terms & Conditions and Privacy Policy
              </label>
              {errors.terms && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4, marginLeft: 28 }}>⚠ {errors.terms}</p>}
            </div>
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
