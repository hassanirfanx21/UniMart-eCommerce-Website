"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState("guest");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Public pages where we only show Home/Login/Sign Up
  const isPublicPage = useMemo(() => {
    if (!pathname) return false;
    return (
      pathname === "/" ||
      pathname === "/homepage" ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/signup")
    );
  }, [pathname]);

  const readRole = () => {
    try {
      const r = typeof window !== "undefined" ? localStorage.getItem("role") : null;
      const normalized = (r || "").toLowerCase();
      if (["buyer", "seller", "admin"].includes(normalized)) return normalized;
      return "guest";
    } catch {
      return "guest";
    }
  };

  useEffect(() => {
    // Initial mount
    setRole(readRole());
    // Keep in sync if other tabs log in/out
    const onStorage = () => setRole(readRole());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    // Update role whenever route changes in the same tab
    setRole(readRole());
  }, [pathname]);

  const navConfig = useMemo(
    () => ({
      buyer: [
        { label: "Home", href: "/homepage" },
        { label: "Buyer Profile", href: "/buyer-profile" },
        { label: "Bookmark", href: "/bookmark" },
        { label: "Catalogue", href: "/catalogue" },
        { label: "Buyer History", href: "/buyer-history" },
        { label: "Rate Purchases", href: "/purchase-rating" },
        { label: "Recommended For You", href: "/recommendations" },
      ],
      seller: [
        { label: "Add Product", href: "/add-product" },
        { label: "Seller Feedback", href: "/seller-feedback" },
        { label: "Seller History", href: "/seller-history" },
        { label: "Seller Profile", href: "/seller-profile" },
      ],
      admin: [
        { label: "Add Advertisement", href: "/add-advertisement" },
        { label: "Admin Dashboard", href: "/admin-dashboard" },
        { label: "Admin User", href: "/admin-user" },
      ],
      guest: [
        { label: "Home", href: "/homepage" },
        { label: "Login", href: "/login" },
        { label: "Sign Up", href: "/signup" },
      ],
    }),
    []
  );

  const items = isPublicPage ? navConfig.guest : (navConfig[role] || navConfig.guest);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("jwt");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
    } catch {}
    router.push("/login");
  };

  const isActive = (href) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    if (href === "/homepage") return pathname === "/homepage" || pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-slate-800/80 backdrop-blur supports-[backdrop-filter]:bg-slate-900/70 shadow-[0_6px_30px_rgba(0,0,0,0.25)]"
      style={{
        background: "linear-gradient(180deg, rgba(11,18,32,0.90), rgba(11,18,32,0.82))",
      }}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 grid place-items-center font-extrabold text-slate-900 select-none">
            U
          </div>
          <span className="text-slate-200 font-extrabold text-lg tracking-tight">UniMart</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                `group relative px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 ` +
                (isActive(item.href)
                  ? "text-sky-400"
                  : "text-slate-300 hover:text-sky-300 hover:bg-slate-800/60 hover:-translate-y-0.5")
              }
            >
              <span className="relative">
                {item.label}
                <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-gradient-to-r from-sky-400 to-cyan-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </span>
            </Link>
          ))}

          {/* Logout for logged-in roles */}
          {!isPublicPage && role !== "guest" && (
            <button
              onClick={handleLogout}
              className="ml-2 inline-flex items-center px-3 py-2 text-sm font-bold rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800/70"
            >
              Logout
            </button>
          )}
        </div>

        {/* Mobile toggles */}
        <div className="md:hidden flex items-center gap-2">
          {!isPublicPage && role !== "guest" && (
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 text-sm font-bold rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800/70"
            >
              Logout
            </button>
          )}
          <button
            aria-label="Toggle navigation"
            onClick={() => setMobileOpen((s) => !s)}
            className="p-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800/70"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800/80" style={{ background: "rgba(11,18,32,0.95)" }}>
          <div className="px-4 py-3 space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={
                  `block px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 ` +
                  (isActive(item.href)
                    ? "text-sky-400"
                    : "text-slate-300 hover:text-sky-300 hover:bg-slate-800/60 hover:translate-x-0.5")
                }
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
