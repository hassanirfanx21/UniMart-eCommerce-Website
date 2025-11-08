"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Buyer() {
  const [buyer, setBuyer] = useState({
    full_name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      alert("Please log in first");
      router.push("/login");
      return;
    }
    if (role !== "buyer") {
      alert("Access denied! Only Buyers can view this page.");
      router.push("/");
    }

    fetchBuyerProfile(token);
  }, []);

  const fetchBuyerProfile = async (token) => {
    try {
      const res = await fetch("http://localhost:5000/buyer-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBuyer({ ...data, password: "" });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setBuyer({ ...buyer, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please log in");

    setUpdating(true);
    try {
      const res = await fetch("http://localhost:5000/update-buyer-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buyer),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      alert(data.message);
      setBuyer({ ...buyer, password: "" });
      setEditMode(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "linear-gradient(180deg,#0b1220 0%, #111827 100%)" }}>
        <div className="flex items-center gap-3 text-slate-300">
          <span className="inline-block w-3 h-3 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-sm tracking-wide">Loading profile…</span>
        </div>
      </div>
    );

  return (
    <section
      className="min-h-screen py-12 px-4 md:px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg,#0b1220 0%, #111827 100%)" }}
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="h-28 w-full bg-gradient-to-r from-sky-500/30 via-cyan-400/25 to-sky-600/30" />
          <div className="px-6 md:px-8 -mt-10 flex items-end gap-4">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-400 grid place-items-center font-black text-slate-900 text-2xl shadow-lg">
              {(buyer?.full_name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="pb-2">
              <h1 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight">Buyer Profile</h1>
              <p className="text-slate-400 text-sm">Manage your account details</p>
            </div>
          </div>

          <div className="px-6 md:px-8 pb-8 pt-6">
            {!editMode ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Full Name</p>
                  <p className="mt-1 text-white text-lg font-semibold break-words">{buyer.full_name}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Email</p>
                  <p className="mt-1 text-white text-lg font-medium break-words">{buyer.email}</p>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    onClick={() => setEditMode(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-900 font-extrabold py-2.5 px-5 rounded-lg shadow-[0_10px_30px_rgba(56,189,248,0.35)] hover:brightness-110 active:scale-[0.98] transition"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 20h9" stroke="#0b1220" strokeWidth="2" strokeLinecap="round"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" stroke="#0b1220" strokeWidth="2" strokeLinecap="round"/></svg>
                    Edit Profile
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm mb-2 text-slate-300">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={buyer.full_name}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 px-3 py-3 outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-slate-300">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={buyer.email}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 px-3 py-3 outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
                    placeholder="you@university.edu"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-slate-300">Password (leave blank to keep unchanged)</label>
                  <input
                    type="password"
                    name="password"
                    value={buyer.password}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 px-3 py-3 outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="inline-flex justify-center items-center px-5 py-2.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800/70 active:scale-[0.98] transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="inline-flex justify-center items-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-900 font-extrabold shadow-[0_10px_30px_rgba(56,189,248,0.35)] hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {updating ? "Updating…" : "Update Profile"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
