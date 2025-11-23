"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MultiUpload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    section: "",
    price: "",
    brand_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();

  // Frontend protection - sellers only
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) {
      alert("Please log in first.");
      router.push("/login");
      return;
    }
    if (role !== "seller") {
      alert("Access denied! Only sellers can add products.");
      router.push("/");
    }
  }, [router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert("Please select at least one image");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    const token = localStorage.getItem("token");
    const uploadedProducts = [];
    const failedUploads = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        try {
          // Upload to Cloudinary
          const cloudinaryData = new FormData();
          cloudinaryData.append("file", file);
          cloudinaryData.append("upload_preset", "unimart_preset");

          const uploadRes = await fetch(
            "https://api.cloudinary.com/v1_1/dy20mrrq9/image/upload",
            {
              method: "POST",
              body: cloudinaryData,
            }
          );

          const uploadData = await uploadRes.json();
          const imageUrl = uploadData.secure_url;

          // Save to backend using existing addProduct route
          const res = await fetch("http://localhost:5000/addProduct", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...form,
              picture_url: imageUrl,
            }),
          });

          const data = await res.json();
          if (res.ok) {
            uploadedProducts.push({ file: file.name, productId: data.productId });
          } else {
            failedUploads.push({ file: file.name, error: data.message });
          }
        } catch (err) {
          failedUploads.push({ file: file.name, error: err.message });
        }

        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      // Show results
      if (uploadedProducts.length > 0) {
        alert(
          `✅ Successfully uploaded ${uploadedProducts.length} product(s)!\n` +
          (failedUploads.length > 0 ? `❌ Failed: ${failedUploads.length}` : "")
        );
        router.push("/seller-profile");
      } else {
        alert("❌ All uploads failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error during upload");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <section
      className="min-h-screen py-12 px-4 md:px-6 lg:px-8 flex items-center justify-center"
      style={{ background: "linear-gradient(180deg,#0b1220 0%, #111827 100%)" }}
    >
      <form
        onSubmit={handleSubmit}
        className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur w-full max-w-2xl p-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-blue-400 grid place-items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14m-7-7h14" stroke="#0b1220" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight">
              Multi-Upload Products
            </h1>
            <p className="text-slate-400 text-sm">Upload multiple images with same details</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Product Name */}
          <div>
            <label className="block text-sm mb-2 text-slate-300">Product Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 px-3 py-3 outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
              placeholder="e.g. Hoodie Collection"
            />
          </div>

          {/* Multiple Images Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Product Images * (Multiple)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              required
              className="w-full px-4 py-3 rounded-lg bg-slate-800/70 text-slate-200 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-purple-400 file:text-slate-900 file:font-semibold file:cursor-pointer hover:file:bg-purple-300"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-slate-300 mb-3">
                  Selected: <span className="font-bold text-purple-400">{selectedFiles.length}</span> image(s)
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg shadow-lg border-2 border-purple-400/50 group-hover:scale-105 transition"
                      />
                      <span className="absolute bottom-1 right-1 bg-purple-400 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full shadow">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section & Price Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Section */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">Section *</label>
              <select
                name="section"
                value={form.section}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-800/70 text-slate-200 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
              >
                <option value="">Select Section</option>
                <option value="study tools">Study Tools</option>
                <option value="clothes">Clothes</option>
                <option value="food">Food</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">Price *</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                required
                placeholder="Enter price"
                className="w-full px-4 py-3 rounded-lg bg-slate-800/70 text-slate-200 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition placeholder-slate-500"
              />
            </div>
          </div>

          {/* Brand Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Brand Name <span className="text-slate-500 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              name="brand_name"
              value={form.brand_name}
              onChange={handleChange}
              placeholder="Enter brand name"
              className="w-full px-4 py-3 rounded-lg bg-slate-800/70 text-slate-200 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition placeholder-slate-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe your products..."
              className="w-full px-4 py-3 rounded-lg bg-slate-800/70 text-slate-200 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition placeholder-slate-500 resize-none"
            />
          </div>

          {/* Upload Progress */}
          {loading && uploadProgress > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-400/30">
              <div className="flex justify-between text-sm text-slate-300 mb-2">
                <span>Uploading...</span>
                <span className="font-bold text-purple-400">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-purple-400 to-blue-400 text-slate-900 font-bold rounded-lg shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading {selectedFiles.length} Product(s)...
              </>
            ) : (
              "Upload All Products"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
