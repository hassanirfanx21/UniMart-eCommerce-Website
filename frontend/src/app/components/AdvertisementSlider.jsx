"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";

export default function AdvertisementSlider({
  width = "100%",
  height = "300px",
  interval = 3000,
}) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const containerRef = useRef(null);
  const touchStartX = useRef(0);

  // Fetch ads (keeps previous logic but allows missing token)
  useEffect(() => {
    let cancelled = false;

    const fetchAds = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("http://localhost:5000/buyer/advertisements", {
          headers,
        });
        if (!res.ok) {
          console.warn("Advertisements fetch failed:", res.status);
          if (!cancelled) {
            setAds([]);
            setLoading(false);
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) setAds(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch ads error:", err);
        if (!cancelled) setAds([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAds();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-advance timer
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex((i) => (ads.length ? (i + 1) % ads.length : 0));
    }, interval);
  }, [ads.length, interval]);

  useEffect(() => {
    if (ads.length > 0) resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ads.length, resetTimer]);

  // When index changes due to user action, reset auto timer
  const goTo = useCallback(
    (i) => {
      setIndex(i);
      resetTimer();
    },
    [resetTimer]
  );

  const prev = useCallback(() => {
    setIndex((i) => (ads.length ? (i - 1 + ads.length) % ads.length : 0));
    resetTimer();
  }, [ads.length, resetTimer]);

  const next = useCallback(() => {
    setIndex((i) => (ads.length ? (i + 1) % ads.length : 0));
    resetTimer();
  }, [ads.length, resetTimer]);

  // Pause on hover
  const handleMouseEnter = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const handleMouseLeave = () => {
    resetTimer();
  };

  // Keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  // Touch / swipe support
  const onTouchStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX || 0;
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const onTouchEnd = (e) => {
    const endX = e.changedTouches?.[0]?.clientX || 0;
    const diff = endX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) prev();
      else next();
    }
    resetTimer();
  };

  if (loading) {
    return (
      <div
        className="w-full bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400 mb-2"></div>
          <p className="text-slate-400 text-sm">Loading Ads...</p>
        </div>
      </div>
    );
  }

  if (!ads.length) {
    return (
      <div
        className="w-full bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-slate-400">No Ads Available</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden select-none rounded-2xl border border-slate-700/50 shadow-2xl shadow-cyan-500/10"
      style={{ width, height, margin: "0 auto", maxWidth: "800px" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(.2,.9,.2,1)] h-full"
        style={{
          transform: `translateX(-${index * 100}%)`,
        }}
      >
        {ads.map((ad, i) => (
          <div
            key={ad.ad_id || i}
            className="relative flex-shrink-0 h-full"
            style={{ minWidth: "100%", width: "100%" }}
          >
            <img
              src={ad.image_url}
              alt={ad.alt || `Advertisement ${i + 1}`}
              className={`w-full h-full object-cover transition-all duration-700 ${
                i === index ? "scale-105 blur-0" : "scale-100 blur-[2px]"
              }`}
              loading={i === index ? "eager" : "lazy"}
            />
            {/* Gradient Overlay for better contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Controls */}
      <button
        aria-label="Previous advertisement"
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 text-white rounded-full hover:bg-slate-800 hover:scale-110 transition-all shadow-lg flex items-center justify-center font-bold text-xl"
      >
        ‹
      </button>

      <button
        aria-label="Next advertisement"
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 text-white rounded-full hover:bg-slate-800 hover:scale-110 transition-all shadow-lg flex items-center justify-center font-bold text-xl"
      >
        ›
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {ads.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === index
                ? "bg-cyan-400 w-8 shadow-lg shadow-cyan-400/50"
                : "bg-slate-500/60 w-2 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
