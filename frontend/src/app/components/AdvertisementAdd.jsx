"use client";
//this is to add advertisements by admin only
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdvertisementAdd() {
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // --------- Frontend protection: Admin only ----------
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      alert("Access denied! Only admin can access advertisements.");
      router.push("/");
    }

    fetchAds();
  }, []);

  const fetchAds = () => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/admin/advertisements", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setAds(data))
      .catch(() => alert("Failed to load ads"));
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ads.length >= 5)
      return alert("Maximum 5 advertisements allowed");

    setLoading(true);

    let imageUrl = "";
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("upload_preset", "unimart_preset");

    fetch("https://api.cloudinary.com/v1_1/dy20mrrq9/image/upload", {
      method: "POST",
      body: formData,
    })
      .then((u) => u.json())
      .then((data) => {
        imageUrl = data.secure_url;

        const token = localStorage.getItem("token");

        return fetch("http://localhost:5000/admin/add-advertisement", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, image_url: imageUrl }),
        });
      })
      .then((res) => res.json())
      .then((final) => {
        alert(final.message);
        setTitle("");
        setSelectedFile(null);
        fetchAds();
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  };

  const deleteAd = (id) => {
    const token = localStorage.getItem("token");

    fetch(`http://localhost:5000/admin/advertisement/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(() => fetchAds());
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{background: "linear-gradient(180deg, #0a0e1a 0%, #1a1f2e 100%)"}}>
      
      {/* Hero Section */}
      <div className="relative pt-8 pb-6 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-500 to-indigo-600 mb-3 tracking-tight">
            Manage Advertisements
          </h1>
          <p className="text-slate-400 text-lg">Upload and control promotional banners</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-full">
            <span className="text-slate-300 text-sm font-semibold">Active Ads:</span>
            <span className="text-fuchsia-400 text-lg font-black">{ads.length}</span>
            <span className="text-slate-500 text-sm">/</span>
            <span className="text-slate-400 text-sm">5</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-16">
        
        {/* Limit Warning */}
        {ads.length >= 5 && (
          <div className="mb-6 p-5 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-2xl flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500/20 grid place-items-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-red-400 font-bold text-lg">Maximum limit reached!</p>
              <p className="text-red-300/80 text-sm">Delete an existing advertisement to add a new one.</p>
            </div>
          </div>
        )}

        {/* Add Form */}
        {ads.length < 5 && (
          <div className="mb-8 bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-400 to-purple-500 grid place-items-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5v14m-7-7h14" stroke="#0a0e1a" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-white text-2xl font-black">Add New Advertisement</h2>
                  <p className="text-slate-400 text-sm">Upload a promotional banner image</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">Advertisement Title *</label>
                <input
                  className="w-full px-4 py-3 rounded-lg bg-slate-800/70 text-slate-200 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition placeholder-slate-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter advertisement title"
                  required
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">Advertisement Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800/70 text-slate-200 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-fuchsia-400 file:text-slate-900 file:font-semibold file:cursor-pointer hover:file:bg-fuchsia-300"
                  required
                />
              </div>

              {/* Image Preview */}
              {selectedFile && (
                <div className="relative inline-block">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    className="w-full max-w-md h-48 object-cover rounded-lg shadow-lg border-2 border-fuchsia-400/50"
                    alt="Preview"
                  />
                  <span className="absolute top-2 right-2 bg-gradient-to-r from-fuchsia-400 to-purple-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                    Preview
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <button
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-fuchsia-400 to-purple-500 text-slate-900 font-bold rounded-lg shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  "Add Advertisement"
                )}
              </button>
            </form>
          </div>
        )}

        {/* Existing Ads */}
        <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-400 to-purple-500 grid place-items-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="#0a0e1a" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="text-white text-2xl font-black">Current Advertisements</h2>
            </div>
          </div>

          <div className="p-6">
            {ads.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/60 grid place-items-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-slate-400 text-lg">No advertisements yet</p>
                <p className="text-slate-500 text-sm mt-1">Add your first promotional banner above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ads.map((ad, idx) => (
                  <div
                    key={ad.ad_id}
                    className="group relative bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden hover:border-fuchsia-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-fuchsia-500/20"
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* Ad Number Badge */}
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-fuchsia-400 to-purple-500 grid place-items-center flex-shrink-0 font-black text-slate-900 text-lg">
                        {idx + 1}
                      </div>
                      
                      {/* Ad Image */}
                      <div className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 border-slate-700/50 group-hover:border-fuchsia-400/50 transition-all">
                        <img
                          src={ad.image_url}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                          alt={ad.title}
                        />
                      </div>
                      
                      {/* Ad Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-lg truncate group-hover:text-fuchsia-400 transition-colors">{ad.title}</p>
                        <p className="text-slate-400 text-sm">Advertisement #{idx + 1}</p>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => deleteAd(ad.ad_id)}
                        className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg font-semibold transition-all hover:scale-105 border border-red-500/30 hover:border-red-500 flex items-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
