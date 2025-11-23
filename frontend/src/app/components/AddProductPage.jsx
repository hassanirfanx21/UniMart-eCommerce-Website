"use client";
//this Page is only for sellers and acessible by add-product which is routed (foldername)
//in this page the seller will add the product pics,decription etc and the pic url to cloudinary will be stored in the database
import { useState, useEffect } from "react"; // ✅ Add useEffect
import { useRouter } from "next/navigation";//use with router for redirection

//this is the add product page where sellers can add new products
//image is uploaded to cloudinary and the url is stored in the database
//form data is sent to backend to be stored in the database

export default function AddProductPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    picture_url: "",
    section: "",
    price: "",
    brand_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const router = useRouter();

  // Validation functions
  const validateProductName = (name) => {
    if (!name.trim()) return "Product name is required";
    if (name.trim().length < 3) return "Product name must be at least 3 characters";
    if (name.trim().length > 100) return "Product name must not exceed 100 characters";
    return null;
  };

  const validatePrice = (price) => {
    if (!price) return "Price is required";
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return "Price must be a valid number";
    if (numPrice <= 0) return "Price must be greater than 0";
    if (numPrice > 1000000) return "Price must not exceed 1,000,000";
    return null;
  };

  const validateSection = (section) => {
    if (!section) return "Please select a section";
    const validSections = ["study tools", "clothes", "food"];
    if (!validSections.includes(section.toLowerCase())) return "Invalid section selected";
    return null;
  };

  const validateImage = (file) => {
    if (!file) return "Product image is required";
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) return "Image must be JPEG, PNG, or WebP format";
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) return "Image size must not exceed 5MB";
    return null;
  };

  const validateDescription = (description) => {
    if (description && description.length > 1000) return "Description must not exceed 1000 characters";
    return null;
  };
  // ✅ FRONTEND PROTECTION: Only allow sellers
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) {
      alert("⚠ Please log in first.");
      router.push("/login");
      return;
    }
    if (role !== "seller") {
      alert("⚠ Access denied! Only sellers can add products.");
      router.push("/");
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageError = validateImage(file);
      if (imageError) {
        setErrors(prev => ({ ...prev, image: imageError }));
        alert(imageError);
        e.target.value = ""; // Clear the file input
        return;
      }
      setSelectedFile(file);
      setErrors(prev => ({ ...prev, image: null }));
    }
  };

  ///----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = "";

    try {
      // ✅ STEP A: Upload image to Cloudinary if selected
      if (selectedFile) {
        // this is fore cloudinary set up and image upload
        const formData = new FormData();
        //Creates a special object to send files and data to Cloudinary (or any API).
        // It works like a virtual “form submission”.
        formData.append("file", selectedFile);
        // Adds the actual image file to the form data.
        // Cloudinary expects the file under the key "file".
        formData.append("upload_preset", "unimart_preset");
        //Tells Cloudinary which preset settings to use when uploading:
        // The preset contains rules like:
        // Which folder to store in
        // Allowed formats
        // Security/access type
        // Unsigned/signed uploads
        // "unimart_preset" is the name of the upload preset you created in Cloudinary
        const uploadRes = await fetch(
          "https://api.cloudinary.com/v1_1/dy20mrrq9/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.secure_url;
      }

      // ✅ STEP B: Now send full form to backend
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/addProduct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          picture_url: imageUrl, // ✅ add image URL here
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Product added successfully!");
        router.push("/seller-profile");
      } else {
        alert("❌ " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-rose-400 grid place-items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14m-7-7h14" stroke="#0b1220" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight">Add New Product</h1>
            <p className="text-slate-400 text-sm">List a product for sale</p>
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
              className="w-full rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 px-3 py-3 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
              placeholder="e.g. MacBook Pro 2021"
            />
          </div>
        </div>
        {/* Picture Upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-3">Product Image *</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            required
            className="w-full px-4 py-3 rounded-lg bg-slate-800/70 text-slate-200 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-amber-400 file:text-slate-900 file:font-semibold file:cursor-pointer hover:file:bg-amber-300"
          />
          {selectedFile && (
            <div className="mt-4 relative inline-block">
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="w-40 h-40 object-cover rounded-lg shadow-lg border-2 border-amber-400/50"
              />
              <span className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-rose-400 text-slate-900 text-xs font-bold px-2 py-1 rounded-full shadow">
                Ready
              </span>
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
              className="w-full px-4 py-3 rounded-lg bg-slate-800/70 text-slate-200 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
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
              className="w-full px-4 py-3 rounded-lg bg-slate-800/70 text-slate-200 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition placeholder-slate-500"
            />
          </div>
        </div>

        {/* Brand Name (Optional) */}
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
            className="w-full px-4 py-3 rounded-lg bg-slate-800/70 text-slate-200 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition placeholder-slate-500"
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
            placeholder="Describe your product..."
            className="w-full px-4 py-3 rounded-lg bg-slate-800/70 text-slate-200 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition placeholder-slate-500 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-rose-400 text-slate-900 font-bold rounded-lg shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding Product...
            </>
          ) : (
            "Add Product"
          )}
        </button>
      </form>
    </section>
  );
}
