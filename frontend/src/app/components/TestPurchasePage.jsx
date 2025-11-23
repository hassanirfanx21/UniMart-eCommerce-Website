"use client";

import ProductCard from "../components/ProductCard";

const dummyProducts = [
  {
    product_id: 14,
    name: "Sekiro",
    brand_name: "Sekiro Die Twice",
    section: "Study Tools",
    price: 2000, // PKR
    picture_url: "https://res.cloudinary.com/dy20mrrq9/image/upload/v1759657865/qbklpdasvpyckn56s7za.jpg"
  },
];

export default function TestPurchasePage() {
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      {dummyProducts.map((p) => (
        <ProductCard key={p.product_id} product={p} />
      ))}
    </div>
  );
}
