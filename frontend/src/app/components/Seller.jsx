"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function SellerProfile() {
  const [seller, setSeller] = useState({
    full_name: "",
    email: "",
    password: "",
    brand_name: "",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  //products state will be added
  // Products section
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  ////--------------------------------------------------------------
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      alert("Please log in first");
      router.push("/login");
      return;
    }
    if (role !== "seller") {
      alert("Access denied! Only Seller can view this page.");
      router.push("/");
    }

    fetchSellerProfile(token);
  }, []);

  const fetchSellerProfile = async (token) => {
    try {
      const res = await fetch("http://localhost:5000/seller-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSeller({ ...data, password: "" }); //so we dont see the password
      // //( i cant decrypt it anyway) later add this feature to change password
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setSeller({ ...seller, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please log in");

    setUpdating(true);
    try {
      const res = await fetch("http://localhost:5000/update-seller-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(seller),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      alert(data.message);
      setSeller({ ...seller, password: "" }); // clear password field after update
      setEditMode(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };
  //--------------------------------------------------------------
  // Product Management Section
  //--------------------------------------------------------------
  //this is product section which are of seller and seller can
  // Displays all seller products in a grid of cards with hover scale.
  // Click a card → opens modal to edit product (name, price, section, brand, picture).
  // Upload a new picture → previews before updating.
  // Update product → sends PUT request.
  // Remove product → deletes from DB immediately.
  // Refreshes products after update or removal.
  // Fetch seller products
  const fetchSellerProducts = async () => {
    setLoadingProducts(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/seller-products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // console.log("Fetched products:", data); // 👈 Add this

      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };
  //------------------------------------------------------------------------------
  useEffect(() => {
    if (!loading) {
      // only fetch after profile is loaded
      fetchSellerProducts();
    }
  }, [loading]);

  //------------------------------------------------------------------------------
  // Image select handler
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  // Submit updated product
  const handleProductUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    setLoading(true);

    let imageUrl = selectedProduct.picture_url || "";

    try {
      // Upload new image if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("upload_preset", "unimart_preset");

        const uploadRes = await fetch(
          "https://api.cloudinary.com/v1_1/dy20mrrq9/image/upload",
          { method: "POST", body: formData }
        );
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.secure_url;
      }

      const res = await fetch(
        `http://localhost:5000/update-product/${selectedProduct.product_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...selectedProduct, picture_url: imageUrl }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      alert(data.message);
      setSelectedProduct(null);
      setSelectedFile(null);
      fetchSellerProducts();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Remove product
  const handleProductRemove = async (id) => {
    if (!confirm("Are you sure you want to remove this product?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/delete-product/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Remove failed");

      alert(data.message);
      fetchSellerProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "linear-gradient(180deg,#0b1220 0%, #111827 100%)" }}>
        <div className="flex items-center gap-3 text-slate-300">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-sm tracking-wide">Loading seller profile…</span>
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
          <div className="h-28 w-full bg-gradient-to-r from-amber-500/30 via-rose-400/25 to-amber-600/30" />
          <div className="px-6 md:px-8 -mt-10 flex items-end gap-4">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-400 to-rose-400 grid place-items-center font-black text-slate-900 text-2xl shadow-lg">
              {(seller?.full_name || "S").charAt(0).toUpperCase()}
            </div>
            <div className="pb-2">
              <h1 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight">Seller Profile</h1>
              <p className="text-slate-400 text-sm">Manage your seller account</p>
            </div>
          </div>

          <div className="px-6 md:px-8 pb-8 pt-6">
            {!editMode ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Full Name</p>
                  <p className="mt-1 text-white text-lg font-semibold break-words">{seller.full_name}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Email</p>
                  <p className="mt-1 text-white text-lg font-medium break-words">{seller.email}</p>
                </div>
                <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Brand Name</p>
                  <p className="mt-1 text-white text-lg font-semibold break-words">{seller.brand_name || "Not set"}</p>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    onClick={() => setEditMode(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-rose-400 text-slate-900 font-extrabold py-2.5 px-5 rounded-lg shadow-[0_10px_30px_rgba(251,191,36,0.35)] hover:brightness-110 active:scale-[0.98] transition"
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
                    value={seller.full_name}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 px-3 py-3 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-slate-300">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={seller.email}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 px-3 py-3 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                    placeholder="you@university.edu"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-slate-300">Password (leave blank to keep unchanged)</label>
                  <input
                    type="password"
                    name="password"
                    value={seller.password}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 px-3 py-3 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-slate-300">Brand Name</label>
                  <input
                    type="text"
                    name="brand_name"
                    value={seller.brand_name || ""}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 px-3 py-3 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                    placeholder="Your brand"
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
                    className="inline-flex justify-center items-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 text-slate-900 font-extrabold shadow-[0_10px_30px_rgba(251,191,36,0.35)] hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {updating ? "Updating…" : "Update Profile"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ---------- Seller Products Section ---------- */}
      <div className="mx-auto w-full max-w-7xl mt-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-white text-3xl font-extrabold tracking-tight">My Products</h2>
            <p className="text-slate-400 text-sm mt-1">Manage your product inventory</p>
          </div>
        </div>

        {loadingProducts ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-slate-300">
              <span className="inline-block w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm tracking-wide">Loading products…</span>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-slate-800 bg-slate-900/40">
            <p className="text-slate-400">No products yet. Add your first product!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.product_id}
                onClick={() => {
                  setSelectedProduct(product);
                  setSelectedFile(null);
                }}
                className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg hover:shadow-[0_10px_40px_rgba(251,191,36,0.2)] transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-48 overflow-hidden bg-slate-800">
                  <img
                    src={product.picture_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded-md text-amber-400 font-bold text-sm">
                    ${product.price}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white text-lg font-bold truncate">{product.name}</h3>
                  <p className="text-slate-400 text-sm truncate">{product.brand_name || "No Brand"}</p>
                  <div className="mt-2 inline-block px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-xs">
                    {product.section}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* ---------- Edit Product Modal ---------- */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-amber-500/20 to-rose-400/20 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white text-2xl font-extrabold">Edit Product</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-white transition p-2 rounded-lg hover:bg-slate-800"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleProductUpdate} className="p-6 space-y-5">
              <div>
                <label className="block text-sm mb-2 text-slate-300">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={selectedProduct.name}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 px-3 py-3 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                  placeholder="Product name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-slate-300">Brand Name</label>
                <input
                  type="text"
                  name="brand_name"
                  value={selectedProduct.brand_name || ""}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      brand_name: e.target.value,
                    })
                  }
                  className="w-full rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 px-3 py-3 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                  placeholder="Brand (optional)"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-slate-300">Section *</label>
                  <select
                    name="section"
                    value={selectedProduct.section}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        section: e.target.value,
                      })
                    }
                    className="w-full rounded-lg bg-slate-900/60 border border-slate-800 text-white px-3 py-3 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                    required
                  >
                    <option value="">Select Section</option>
                    <option value="study tools">Study Tools</option>
                    <option value="clothes">Clothes</option>
                    <option value="food">Food</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-slate-300">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={selectedProduct.price}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        price: e.target.value,
                      })
                    }
                    className="w-full rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 px-3 py-3 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 text-slate-300">Description</label>
                <textarea
                  name="description"
                  value={selectedProduct.description || ""}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 px-3 py-3 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                  rows={4}
                  placeholder="Product description (optional)"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-slate-300">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-400 file:text-slate-900 hover:file:bg-amber-300 file:cursor-pointer"
                />
                {selectedFile && (
                  <div className="mt-3 relative inline-block">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border border-slate-800"
                    />
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">New</div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => handleProductRemove(selectedProduct.product_id)}
                  className="flex-1 inline-flex justify-center items-center px-5 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 active:scale-[0.98] transition"
                >
                  Remove Product
                </button>
                <button
                  type="submit"
                  className="flex-1 inline-flex justify-center items-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 text-slate-900 font-extrabold shadow-[0_10px_30px_rgba(251,191,36,0.35)] hover:brightness-110 active:scale-[0.98] transition"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
