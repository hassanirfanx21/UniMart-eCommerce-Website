// backend/app.js

// Necessary imports
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2"); // <-- use mysql2
const app = express();
const jwt = require("jsonwebtoken"); //to sign & verify tokens and session
const bcrypt = require("bcryptjs"); //to hash & compare passwords
require('dotenv').config(); // loads .env variables

const JWT_SECRET = process.env.JWT_SECRET;
//stripe
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// set env var in production
// Helper: conversion rate PKR -> USD (cents). Adjust later or call live API.
// const PKR_TO_USD_RATE = 280; // 1 USD = 280 PKR (example)
function pkrToUsdCents(pkr) {
  const usd = pkr / 1; // example conversion rate
  return Math.max(Math.round(usd * 100), 1); // ✅ ensure at least 1 cent
}

///--------------------------------------------------

// Initialize Express app
// Middleware
app.use(cors()); // Allow frontend requests
app.use(express.json()); // Parse JSON bodies

// --- MySQL Database Connection ---
const db = mysql.createConnection({
  host: "127.0.0.1",
  port: 3306,
  user: "root", // your MySQL username
  password: "10007", // your MySQL password
  database: "unimart", // your DB name
});

// Connect to DB
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});
const util = require("util");
db.query = util.promisify(db.query);

// Signup route-----------------------------------------------------
app.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body; //this is content we enter in form fo sign up on frontend and comes to backend

  if (!name || !email || !password || !role) {
    // if anyone absent
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    // ✅ Student email check if role = buyer
    if (role === "buyer") {
      const eduRegex = /\.edu(\.[a-z]{2,})?$/i;
      // matches .edu, .edu.pk, .edu.us, etc. this is to ensure if the email is of university system
      if (!eduRegex.test(email)) {
        return res.status(400).json({
          message: "Buyer accounts require a valid .edu email address",
        });
      }
    }
    // Hash password by bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    let table; // t o decide which role user is made and the role name is also table name in DB for conviniece
    if (role === "buyer") table = "buyer";
    else if (role === "seller") table = "seller";
    else if (role === "admin")
      table = "admin"; //only ones happened during initial setup
    else return res.status(400).json({ message: "Invalid role" });

    const query = `INSERT INTO ${table} (full_name, email, password, role) VALUES (?, ?, ?, ?)`; //sql query to insert data

    db.query(query, [name, email, hashedPassword, role], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "Email already exists" });
        } //Duplicate entry → You are trying to insert a value into a column that must be unique, but that value already exists in the table.
        //email was only unique field in our tables
        return res.status(500).json({ message: err.message });
      }

      // ✅ Generate token after successful signup
      const token = jwt.sign(
        { id: result.insertId, name, email, role }, // include name here
        JWT_SECRET,
        { expiresIn: "2h" } // token expiry
      );
      //..............Send response to frontend................//
      res.json({
        message: "Signup successful!",
        token,
        user: { id: result.insertId, name, email, role },
      });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// Login route-----------------------------------------------------
app.post("/login", (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: "All fields required" });
  }

  // Determine table
  let table;
  if (role === "buyer") table = "buyer";
  else if (role === "seller") table = "seller";
  else if (role === "admin") table = "admin";
  else return res.status(400).json({ message: "Invalid role" });

  // Build query
  let query;
  if (role === "buyer" || role === "seller") {
    // Only active users can log in
    query = `SELECT * FROM ${table} WHERE email = ? AND status = 'active' LIMIT 1`;
  } else {
    // Admin has no status
    query = `SELECT * FROM ${table} WHERE email = ? LIMIT 1`;
  }

  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    if (results.length === 0) {
      return res.status(400).json({ message: "User not found or inactive" });
    }

    const user = results[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Create JWT token
    const token = jwt.sign(
      {
        id: user[`${role}_id`],
        name: user.full_name,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Send response
    res.json({
      message: "Login successful",
      token,
      user: { id: user[`${role}_id`], email: user.email, role: user.role },
    });
  });
});

//products route-----------------------------------------------------

// const router = express.Router();

// Middleware: only allow sellers... role based authorization
async function sellerOnly(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "seller") {
      return res.status(403).json({ message: "Access denied: Seller only" });
    }

    // ✅ Check seller status in DB
    const result = await db.query(
      "SELECT status FROM seller WHERE seller_id = ?",
      [decoded.id]
    );
    if (!result[0] || result[0].status !== "active") {
      return res.status(403).json({ message: "Seller account inactive" });
    }

    req.user = decoded; // attach seller data
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
}

//----------------------------------------------
// Middleware: only allow buyers with active status
async function buyerOnly(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "buyer") {
      return res.status(403).json({ message: "Access denied: Buyer only" });
    }

    // ✅ Check buyer status in DB
    const result = await db.query(
      "SELECT status FROM buyer WHERE buyer_id = ?",
      [decoded.id]
    );

    if (!result[0] || result[0].status !== "active") {
      return res.status(403).json({ message: "Buyer account inactive" });
    }

    req.user = decoded; // attach buyer data
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
}

// Middleware: only allow admins
function adminOnly(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admin only" });
    }
    req.user = decoded; // attach admin data
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
}

//----------------------------------------------------
// Add Product Route
app.post("/addProduct", sellerOnly, (req, res) => {
  const { name, description, picture_url, section, price, brand_name } =
    req.body;
  const seller_id = req.user.id;

  if (!name || !picture_url || !section || !price) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  // ✅ Extra check for negative price

  if (price < 0) {
    return res.status(400).json({ message: "Price cannot be negative" });
  }

  // ✅ If brand name is empty from frontend → set null
  const finalBrandName = brand_name?.trim() !== "" ? brand_name : null;

  const query = `
    INSERT INTO product (seller_id, name, brand_name, description, picture_url, section, price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [seller_id, name, finalBrandName, description, picture_url, section, price],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      res.json({
        message: "Product added successfully",
        productId: result.insertId,
      });
    }
  );
});
//
// this route is for advertisement-----------------------
// ----------------------------------------------------
// ----------------------------------------------------
// ----------------------------------------------------
// Add Advertisement Route (Admin Only)
app.post("/admin/add-advertisement", adminOnly, (req, res) => {
  const { title, image_url } = req.body;
  const admin_id = req.user.id;

  if (!title || !image_url) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Check limit = 5
  const checkQuery = "SELECT COUNT(*) AS total FROM advertisement";
  db.query(checkQuery, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });

    if (rows[0].total >= 5) {
      return res
        .status(400)
        .json({ message: "Maximum 5 advertisements allowed" });
    }

    const query = `
      INSERT INTO advertisement (admin_id, title, image_url)
      VALUES (?, ?, ?)
    `;

    db.query(query, [admin_id, title, image_url], (err2, result) => {
      if (err2) return res.status(500).json({ message: err2.message });

      res.json({
        message: "Advertisement added successfully",
        ad_id: result.insertId,
      });
    });
  });
});
//this to get all the advertisements/this is for admin only
app.get("/admin/advertisements", adminOnly, (req, res) => {
  const query = "SELECT * FROM advertisement ORDER BY created_at DESC";

  db.query(query, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });

    res.json(rows);
  });
});
//this is for buyer only
//this to get all the advertisements
app.get("/buyer/advertisements", buyerOnly, (req, res) => {
  const query = "SELECT * FROM advertisement ORDER BY created_at DESC";

  db.query(query, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });

    res.json(rows); // ✅ this is usually an array
  });
});
//th
//this is to delete advertisement
app.delete("/admin/advertisement/:id", adminOnly, (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM advertisement WHERE ad_id = ?";
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Advertisement not found" });

    res.json({ message: "Advertisement deleted successfully" });
  });
});

////---------------------------
//we can add same         p.seller_id,
//  for bookark later
// ✅ Get All Products Grouped by Section.--------------------
app.get("/products", buyerOnly, (req, res) => {
  const query = `SELECT 
    p.product_id,
    p.seller_id,
    p.name,
    p.price,
    p.picture_url,
    p.brand_name,
    p.section,
    p.description,
    COALESCE(SUM(r.rating = 'up'), 0) AS upvotes,
    COALESCE(SUM(r.rating = 'down'), 0) AS downvotes
FROM product p
LEFT JOIN product_rating r ON p.product_id = r.product_id
JOIN seller s ON p.seller_id = s.seller_id AND s.status = 'active'
GROUP BY p.product_id;

    `;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "DB error", error: err });
    }

    // Group products by section
    // in the frontend easier to handle if grouped i can use each array directly in dedicated tab
    const grouped = {
      study_tools: [],
      clothes: [],
      food: [],
    };

    results.forEach((product) => {
      if (product.section.toLowerCase() === "study tools") {
        grouped.study_tools.push(product);
      } else if (product.section.toLowerCase() === "clothes") {
        grouped.clothes.push(product);
      } else if (product.section.toLowerCase() === "food") {
        grouped.food.push(product);
      }
    });

    res.json(grouped);
  });
});

///-----------Route to LIKE / DISLIKE a product------------------- ----------------- -----------------
// POST /rate-product
//✅ Make sure this route is protected by buyerOnly middleware.
app.post("/rate-product", buyerOnly, (req, res) => {
  const { product_id, rating } = req.body;
  const buyer_id = req.user.id;

  if (!product_id || !rating)
    return res.status(400).json({ message: "Missing fields" });

  if (!["up", "down"].includes(rating))
    return res.status(400).json({ message: "Invalid rating" });

  const checkQuery =
    "SELECT * FROM product_rating WHERE product_id = ? AND buyer_id = ?";

  db.query(checkQuery, [product_id, buyer_id], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    if (results.length > 0) {
      const currentRating = results[0].rating;
      if (currentRating === rating) {
        // Same vote → remove it
        const deleteQuery =
          "DELETE FROM product_rating WHERE product_id = ? AND buyer_id = ?";
        db.query(deleteQuery, [product_id, buyer_id], (err2) => {
          if (err2) return res.status(500).json({ message: err2.message });
          res.json({ message: "Vote removed" });
        });
      } else {
        // Different vote → update
        const updateQuery =
          "UPDATE product_rating SET rating = ? WHERE product_id = ? AND buyer_id = ?";
        db.query(updateQuery, [rating, product_id, buyer_id], (err2) => {
          if (err2) return res.status(500).json({ message: err2.message });
          res.json({ message: "Vote updated" });
        });
      }
    } else {
      // No vote yet → insert
      const insertQuery =
        "INSERT INTO product_rating (product_id, buyer_id, rating) VALUES (?, ?, ?)";
      db.query(insertQuery, [product_id, buyer_id, rating], (err3) => {
        if (err3) return res.status(500).json({ message: err3.message });
        res.json({ message: "Vote recorded" });
      });
    }
  });
});

//-------------------Bookmark a product route------------------------------------ ----------------- -----------------
// POST /bookmark-product for add and remove bookmark products
app.post("/bookmark-product", buyerOnly, (req, res) => {
  const { product_id } = req.body;
  const buyer_id = req.user.id;

  if (!product_id)
    return res.status(400).json({ message: "Missing product_id" });

  const query = `
    INSERT INTO favorite_products (buyer_id, product_id)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP
  `;

  db.query(query, [buyer_id, product_id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "Product bookmarked" });
  });
});

// DELETE /bookmark-product
app.delete("/bookmark-product", buyerOnly, (req, res) => {
  const { product_id } = req.body;
  const buyer_id = req.user.id;

  const query = `DELETE FROM favorite_products WHERE buyer_id = ? AND product_id = ?`;
  db.query(query, [buyer_id, product_id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "Product removed from bookmarks" });
  });
});
//-------------------Get all bookmarked products of a buyer------------------------------------ ----------------- -----------------
// GET /favorites
app.get("/favorites", buyerOnly, (req, res) => {
  const buyer_id = req.user.id;

  const query = `
     SELECT p.*, 
      COALESCE(SUM(r.rating='up'),0) AS upvotes,
      COALESCE(SUM(r.rating='down'),0) AS downvotes
    FROM product p
    JOIN favorite_products f ON p.product_id = f.product_id
    JOIN seller s ON p.seller_id = s.seller_id AND s.status = 'active'
    LEFT JOIN product_rating r ON p.product_id = r.product_id
    WHERE f.buyer_id = ?
    GROUP BY p.product_id
  `;

  db.query(query, [buyer_id], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    // Optional: Group by section for tabs
    const grouped = { study_tools: [], clothes: [], food: [] };
    results.forEach((product) => {
      if (product.section.toLowerCase() === "study tools")
        grouped.study_tools.push(product);
      else if (product.section.toLowerCase() === "clothes")
        grouped.clothes.push(product);
      else if (product.section.toLowerCase() === "food")
        grouped.food.push(product);
    });

    res.json(grouped);
  });
});
//-------------------Get all products of a seller------------------------------------ ----------------- -----------------

///-----------------------this will be profile sections----------------- ----------------- -----------------
///---------------------------------------- ----------------- -----------------
///---------------------------------------- ----------------- -----------------
///---------------------------------------- ----------------- -----------------

app.put("/update-seller-profile", sellerOnly, async (req, res) => {
  const { full_name, email, password, brand_name } = req.body;
  const seller_id = req.user.id;

  if (!full_name || !email)
    return res
      .status(400)
      .json({ message: "Full name and email are required" });

  // Check if email already exists (except current seller)
  const emailQuery = "SELECT * FROM seller WHERE email = ? AND seller_id != ?";
  db.query(emailQuery, [email, seller_id], async (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    if (results.length > 0)
      return res.status(400).json({ message: "Email already in use" });

    // If password provided, hash it
    let hashedPassword = undefined;
    if (password && password.trim() !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Build update query dynamically
    let updateQuery =
      "UPDATE seller SET full_name = ?, email = ?, brand_name = ?";
    const params = [full_name, email, brand_name || null];

    if (hashedPassword) {
      updateQuery += ", password = ?";
      params.push(hashedPassword);
    }

    updateQuery += " WHERE seller_id = ?";
    params.push(seller_id);

    db.query(updateQuery, params, (err2) => {
      if (err2) return res.status(500).json({ message: err2.message });
      res.json({ message: "Profile updated successfully" });
    });
  });
});

// Route to get seller details
app.get("/seller-profile", sellerOnly, (req, res) => {
  const seller_id = req.user.id;
  const query =
    "SELECT seller_id, full_name, email, brand_name FROM seller WHERE seller_id = ?";
  db.query(query, [seller_id], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    // console.log(results);

    res.json(results[0]);
  });
});
//----Buyer profile-------------------------------------- ----------------- -----------------
// Get Buyer Profile
app.get("/buyer-profile", buyerOnly, (req, res) => {
  if (req.user.role !== "buyer")
    return res.status(403).json({ message: "Access denied" });

  db.query(
    "SELECT full_name, email FROM buyer WHERE buyer_id = ?",
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Server error" });
      res.json(results[0]);
    }
  );
});

// Update Buyer Profile
app.put("/update-buyer-profile", buyerOnly, async (req, res) => {
  if (req.user.role !== "buyer")
    return res.status(403).json({ message: "Access denied" });

  const { full_name, email, password } = req.body;
  let query = "UPDATE buyer SET full_name=?, email=?";
  let params = [full_name, email];

  // If password provided, hash it
  let hashedPassword = undefined;
  if (password && password.trim() !== "") {
    hashedPassword = await bcrypt.hash(password, 10);
  }
  if (password && password.trim() !== "") {
    query += ", password=?";
    params.push(hashedPassword);
  }

  query += " WHERE buyer_id =?";
  params.push(req.user.id);

  db.query(query, params, (err) => {
    if (err) return res.status(500).json({ message: "Update failed" });
    res.json({ message: "Profile updated successfully" });
  });
});

/////------------------------------------------------ ----------------- -----------------
///---------------------------------------- ----------------- -----------------
// this will be the seller product fetching section where seller can see his own products and also
//update or delete them
// GET /seller-products
app.get("/seller-products", sellerOnly, (req, res) => {
  console.log("User Role:", req.user.role);
  console.log("Seller ID:", req.user.id);

  db.query(
    "SELECT * FROM product WHERE seller_id = ? ORDER BY created_at DESC",
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(results);
    }
  );
});
//-----  ---/----
//

// PUT /update-product/:id
app.put("/update-product/:id", sellerOnly, (req, res) => {
  const productId = req.params.id;
  const { name, brand_name, section, price, picture_url, description } =
    req.body; // ⬅️ include description

  // Verify ownership
  db.query(
    "SELECT seller_id FROM product WHERE product_id = ?",
    [productId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      if (rows.length === 0)
        return res.status(404).json({ message: "Product not found" });
      if (rows[0].seller_id !== req.user.id)
        return res
          .status(403)
          .json({ message: "You can only edit your own products" });

      // Perform update
      db.query(
        `UPDATE product
       SET name = ?, brand_name = ?, section = ?, price = ?, picture_url = ?, description = ?
       WHERE product_id = ?`,
        [name, brand_name, section, price, picture_url, description, productId], // ⬅️ include description
        (err2) => {
          if (err2) return res.status(500).json({ message: err2.message });
          res.json({ message: "Product updated successfully" });
        }
      );
    }
  );
});

// DELETE /delete-product/:id
// DELETE /delete-product/:id
app.delete("/delete-product/:id", sellerOnly, (req, res) => {
  const productId = req.params.id;

  // Verify ownership
  db.query(
    "SELECT seller_id FROM product WHERE product_id = ?",
    [productId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      if (rows.length === 0)
        return res.status(404).json({ message: "Product not found" });
      if (rows[0].seller_id !== req.user.id)
        return res
          .status(403)
          .json({ message: "You can only remove your own products" });

      // ✅ Step 1: Delete purchases linked to this product
      db.query(
        "DELETE FROM purchase WHERE product_id = ?",
        [productId],
        (err2) => {
          if (err2) return res.status(500).json({ message: err2.message });

          // ✅ Step 2: Delete the product
          db.query(
            "DELETE FROM product WHERE product_id = ?",
            [productId],
            (err3) => {
              if (err3) return res.status(500).json({ message: err3.message });

              res.json({ message: "Product and related purchases deleted" });
            }
          );
        }
      );
    }
  );
});

// ----------------------------------------
// Seller: products list (with basic stats)
// GET /seller/products
app.get("/seller/products", sellerOnly, (req, res) => {
  const sellerId = req.user.id;
  const query = `
    SELECT
      p.product_id,
      p.name,
      p.section,
      p.price,
      p.picture_url,
      p.created_at,
      COALESCE((SELECT COUNT(*) FROM feedback f WHERE f.product_id = p.product_id), 0) AS feedback_count,
      COALESCE((SELECT COUNT(*) FROM product_rating r WHERE r.product_id = p.product_id AND r.rating = 'up'), 0) AS ups,
      COALESCE((SELECT COUNT(*) FROM product_rating r WHERE r.product_id = p.product_id AND r.rating = 'down'), 0) AS downs,
      COALESCE((SELECT COUNT(*) FROM purchase pu WHERE pu.product_id = p.product_id AND pu.status = 'succeeded'), 0) AS sales
    FROM product p
    WHERE p.seller_id = ?
    ORDER BY p.created_at DESC
  `;
  db.query(query, [sellerId], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ products: results });
  });
});

// Seller: feedback for a specific product (ownership enforced)
// GET /seller/products/:productId/feedback
app.get("/seller/products/:productId/feedback", sellerOnly, (req, res) => {
  const sellerId = req.user.id;
  const { productId } = req.params;

  const ownershipQuery = "SELECT 1 FROM product WHERE product_id = ? AND seller_id = ? LIMIT 1";
  db.query(ownershipQuery, [productId, sellerId], (ownErr, ownRows) => {
    if (ownErr) return res.status(500).json({ message: ownErr.message });
    if (!ownRows || ownRows.length === 0)
      return res.status(403).json({ message: "Not authorized to view this product's feedback" });

    const feedbackQuery = `
      SELECT
        f.feedback_id,
        f.message,
        f.created_at,
        b.full_name AS buyer_name,
        b.email AS buyer_email
      FROM feedback f
      JOIN buyer b ON f.buyer_id = b.buyer_id
      WHERE f.product_id = ?
      ORDER BY f.created_at DESC
    `;
    db.query(feedbackQuery, [productId], (fbErr, rows) => {
      if (fbErr) return res.status(500).json({ message: fbErr.message });
      res.json({ feedback: rows });
    });
  });
});

///---------------------------------------- ----------------- -----------------
///---------------------------------------- ----------------- -----------------
///this is for PAYMENT via test mode stripe----------------- ----------------- -----------------

/**
 * POST /create-payment-intent
 * Body: { productId }
 * Auth: buyerOnly
 * Returns: { clientSecret }
 */
// create-payment-intent (Backend Stripe API Call)

// Its job is to ask Stripe to prepare a payment.

// You send amount + currency + metadata, and Stripe returns a clientSecret.

// That clientSecret is used on the frontend to open the Stripe payment popup and let the user enter card details.

// No money is actually taken yet — it's just the setup phase of the transaction.
app.post("/create-payment-intent", buyerOnly, (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: "Missing productId" });

  // Fetch product price and seller_id
  db.query(
    "SELECT price, seller_id FROM product WHERE product_id = ? LIMIT 1",
    [productId],
    async (err, results) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ message: "DB error" });
      }
      if (!results || results.length === 0)
        return res.status(404).json({ message: "Product not found" });

      const { price, seller_id } = results[0];
      // price is in PKR (decimal)
      const amountInCents = pkrToUsdCents(Number(price));
      if (amountInCents <= 0)
        return res.status(400).json({ message: "Invalid price" });

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "usd", // processing currency
          metadata: {
            product_id: productId,
            seller_id: seller_id,
            buyer_id: req.user.id,
            amount_pkr: price.toString(),
          },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (stripeErr) {
        console.error("Stripe error:", stripeErr);
        res.status(500).json({ message: "Stripe error" });
      }
    }
  );
});

/**
 * POST /save-purchase
 * Body: { product_id, seller_id, amount }  -- amount in PKR (displayed currency)
 * Auth: buyerOnly
 * Action: inserts purchase record with stripe_payment_id and status
 */
// This only runs after Stripe confirms payment success.

// You store the purchase record in your database (user_id, product_id, seller_id, amount, etc.).

// This makes sure you keep history / receipts / triggers for seller payout or digital delivery.
app.post("/save-purchase", buyerOnly, (req, res) => {
  const { product_id, seller_id, amount, stripe_payment_id, currency } =
    req.body;
  const buyer_id = req.user.id;

  if (!product_id || !seller_id || !amount || !stripe_payment_id)
    return res.status(400).json({ message: "Missing fields" });

  const cur = currency || "PKR";
  // Insert into purchase table
  const insertQuery = `
    INSERT INTO purchase (product_id, buyer_id, seller_id, amount, currency, stripe_payment_id, status)
    VALUES (?, ?, ?, ?, ?, ?, 'succeeded')
  `;
  db.query(
    insertQuery,
    [product_id, buyer_id, seller_id, amount, cur, stripe_payment_id],
    (err, result) => {
      if (err) {
        console.error("DB insert error:", err);
        return res.status(500).json({ message: "DB insert error" });
      }
      res.json({ message: "Purchase saved", purchaseId: result.insertId });
    }
  );
});

// ------------------------------------------------------------
// Rating feature for purchases (1-5 stars) - buyer only
// GET /buyer/unrated-purchases -> list of succeeded purchases with NULL rating
app.get("/buyer/unrated-purchases", buyerOnly, (req, res) => {
  const buyer_id = req.user.id;
  const query = `
    SELECT p.purchase_id, p.product_id, pr.name AS product_name, pr.picture_url,
           pr.section, p.amount, p.currency, p.purchase_date
    FROM purchase p
    JOIN product pr ON p.product_id = pr.product_id
    WHERE p.buyer_id = ? AND p.status = 'succeeded' AND p.rating IS NULL
    ORDER BY p.purchase_date DESC
  `;
  db.query(query, [buyer_id], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ purchases: rows });
  });
});

// POST /buyer/rate-purchase { purchase_id, rating }
// rating must be integer 1..5
app.post("/buyer/rate-purchase", buyerOnly, (req, res) => {
  const { purchase_id, rating } = req.body;
  const buyer_id = req.user.id;

  const numericRating = Number(rating);
  if (!purchase_id || !numericRating)
    return res.status(400).json({ message: "purchase_id and rating required" });
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5)
    return res.status(400).json({ message: "Rating must be an integer 1-5" });

  // Verify purchase belongs to buyer and not rated yet
  const checkQuery = "SELECT rating FROM purchase WHERE purchase_id = ? AND buyer_id = ? LIMIT 1";
  db.query(checkQuery, [purchase_id, buyer_id], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!rows.length)
      return res.status(404).json({ message: "Purchase not found" });
    if (rows[0].rating !== null)
      return res.status(400).json({ message: "Purchase already rated" });

    const updateQuery = "UPDATE purchase SET rating = ? WHERE purchase_id = ?";
    db.query(updateQuery, [numericRating, purchase_id], (err2, result) => {
      if (err2) return res.status(500).json({ message: err2.message });
      if (!result.affectedRows)
        return res.status(500).json({ message: "Failed to update rating" });
      res.json({ message: "Rating saved" });
    });
  });
});
//Notes

// create-payment-intent reads price from product table (PKR) and creates a Stripe PaymentIntent charging USD converted amount.

// save-purchase expects the frontend to send PKR amount (for display/storage) and stripe_payment_id (paymentIntent.id).
///---------------------------------------- ----------------- -----------------
///---------------------------------------- ----------------- -----------------
///---------------------------------------- ----------------- -----------------
//feedback section----------------------------------- ----------------- -----------------
// GET /feedback/:product_id  -> returns list of feedback with buyer name
app.get("/feedback/:product_id", buyerOnly, (req, res) => {
  const product_id = req.params.product_id;

  const query = `
    SELECT f.feedback_id, f.product_id, f.buyer_id, f.message, f.created_at,
           b.full_name AS buyer_name
    FROM feedback f
    JOIN buyer b ON f.buyer_id = b.buyer_id
    WHERE f.product_id = ?
    ORDER BY f.created_at DESC
  `;

  db.query(query, [product_id], (err, results) => {
    if (err) {
      console.error("Feedback fetch error:", err);
      return res.status(500).json({ message: "DB error" });
    }
    res.json(results);
  });
});

//------------------------------- ----------------- -----------------
// POST /feedback  -> create feedback (buyerOnly)
app.post("/feedback", buyerOnly, (req, res) => {
  const { product_id, message } = req.body;
  const buyer_id = req.user.id;

  if (!product_id || !message)
    return res.status(400).json({ message: "Missing product_id or message" });

  const insertQuery = `
    INSERT INTO feedback (product_id, buyer_id, message)
    VALUES (?, ?, ?)
  `;

  db.query(insertQuery, [product_id, buyer_id, message], (err, result) => {
    if (err) {
      console.error("Feedback insert error:", err);
      return res.status(500).json({ message: "DB insert error" });
    }
    res.json({ message: "Feedback saved", feedbackId: result.insertId });
  });
});

app.get("/admin/purchases", adminOnly, (req, res) => {
  // Query params: type, range, month, year, section
  const { type, range, month, year, section } = req.query;

  // Build date filters in JS
  let startDate = null;
  let endDate = null; // inclusive

  const now = new Date();

  if (type === "day") {
    const days = parseInt(range, 10) || 7;
    // start = now - days + 1 (to include today as last day)
    startDate = new Date(now);
    startDate.setDate(now.getDate() - (days - 1));
    // zero time for start
    startDate.setHours(0, 0, 0, 0);
    // end = today end
    endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
  } else if (type === "month") {
    // requires month and year
    const m = parseInt(month, 10);
    const y = parseInt(year, 10) || now.getFullYear();
    if (!m || m < 1 || m > 12) {
      return res.status(400).json({ message: "Invalid month" });
    }
    startDate = new Date(y, m - 1, 1, 0, 0, 0, 0);
    // last day of month
    endDate = new Date(y, m, 0, 23, 59, 59, 999);
  } else if (type === "year") {
    const y = parseInt(year, 10) || now.getFullYear();
    startDate = new Date(y, 0, 1, 0, 0, 0, 0);
    endDate = new Date(y, 11, 31, 23, 59, 59, 999);
  } else {
    // default: last 30 days
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
  }

  // optional section filter
  let sectionFilter = "";
  const params = [];
  if (section && section !== "all") {
    sectionFilter = " AND pr.section = ? ";
    params.push(section);
  }

  // SQL: select needed fields and filter by purchase_date between startDate and endDate
  const query = `
    SELECT 
      p.purchase_id,
      p.buyer_id,
      b.full_name AS buyer_name,
      p.product_id,
      pr.name AS product_name,
      pr.section,
      p.amount,
      p.purchase_date,
      p.status
    FROM purchase p
    JOIN buyer b ON p.buyer_id = b.buyer_id
    JOIN product pr ON p.product_id = pr.product_id
    WHERE p.purchase_date BETWEEN ? AND ? 
      AND p.status = 'succeeded'
      ${sectionFilter}
    ORDER BY p.purchase_date ASC
  `;

  // push date params (MySQL will accept JS Date objects or ISO strings)
  params.unshift(endDate);
  params.unshift(startDate);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Error fetching filtered purchases:", err);
      return res.status(500).json({ message: err.message });
    }
    // return raw rows to frontend for grouping
    res.json(results);
  });
});

// Example Express route
app.get("/admin/revenue-chart", (req, res) => {
  const { year, viewMode } = req.query;
  const targetYear = Number(year) || new Date().getFullYear();

  if (viewMode === "yearly") {
    const query = `
      SELECT 
        MONTH(p.purchase_date) AS month,
        pr.section,
        SUM(p.amount) AS total
      FROM purchase p
      JOIN product pr ON p.product_id = pr.product_id
      WHERE p.status = 'succeeded'
        AND YEAR(p.purchase_date) = ?
      GROUP BY month, pr.section
      ORDER BY month
    `;
    db.query(query, [targetYear], (err, result) => {
      if (err) {
        console.error("Error fetching revenue chart data:", err);
        return res.status(500).json({ message: err.message });
      }
      return res.json(result);
    });
  } else {
    const query = `
      SELECT 
        YEAR(p.purchase_date) AS year,
        pr.section,
        SUM(p.amount) AS total
      FROM purchase p
      JOIN product pr ON p.product_id = pr.product_id
      WHERE p.status = 'succeeded'
      GROUP BY year, pr.section
      ORDER BY year
    `;
    db.query(query, (err, result) => {
      if (err) {
        console.error("Error fetching revenue chart data:", err);
        return res.status(500).json({ message: err.message });
      }
      return res.json(result);
    });
  }
});
//
// Route: Get total revenue by section (for pie chart)
// Example Express route for the pie chart
app.get("/admin/section-revenue", (req, res) => {
  const query = `
    SELECT pr.section, SUM(p.amount) AS total
    FROM purchase p
    JOIN product pr ON p.product_id = pr.product_id
    WHERE p.status = 'succeeded'
    GROUP BY pr.section
  `;
  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching section revenue data:", err);
      return res.status(500).json({ message: err.message });
    }
    return res.json(result);
  });
});

// Route: Get dashboard stats (Total Revenue, Active Users, Total Sales, Products Listed)
app.get("/admin/dashboard-stats", adminOnly, (req, res) => {
  const queries = {
    totalRevenue: `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM purchase
      WHERE status = 'succeeded'
    `,
    activeUsers: `
      SELECT COUNT(*) AS total
      FROM buyer
      WHERE status = 'active'
    `,
    totalSales: `
      SELECT COUNT(*) AS total
      FROM purchase
      WHERE status = 'succeeded'
    `,
    productsListed: `
      SELECT COUNT(*) AS total
      FROM product p
      JOIN seller s ON p.seller_id = s.seller_id
      WHERE s.status = 'active'
    `
  };

  // Execute all queries in parallel
  Promise.all([
    new Promise((resolve, reject) => {
      db.query(queries.totalRevenue, (err, result) => {
        if (err) reject(err);
        else resolve(result[0].total);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queries.activeUsers, (err, result) => {
        if (err) reject(err);
        else resolve(result[0].total);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queries.totalSales, (err, result) => {
        if (err) reject(err);
        else resolve(result[0].total);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queries.productsListed, (err, result) => {
        if (err) reject(err);
        else resolve(result[0].total);
      });
    })
  ])
    .then(([totalRevenue, activeUsers, totalSales, productsListed]) => {
      res.json({
        totalRevenue: Number(totalRevenue) || 0,
        activeUsers: Number(activeUsers) || 0,
        totalSales: Number(totalSales) || 0,
        productsListed: Number(productsListed) || 0
      });
    })
    .catch(err => {
      console.error("Error fetching dashboard stats:", err);
      res.status(500).json({ message: err.message });
    });
});

////admin buyer nad seller management
// GET all buyers
app.get("/admin/buyers", adminOnly, (req, res) => {
  const query = `
    SELECT buyer_id AS id, full_name AS name, email, created_at AS joined_date, status
    FROM buyer
    ORDER BY created_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results);
  });
});

// GET all sellers
app.get("/admin/sellers", adminOnly, (req, res) => {
  const query = `
    SELECT seller_id AS id, full_name AS name, email, created_at AS joined_date, status
    FROM seller
    ORDER BY created_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results);
  });
});

// DELETE (deactivate) buyer
app.delete("/admin/buyer/:id", adminOnly, (req, res) => {
  const { id } = req.params;
  const query = "UPDATE buyer SET status = 'inactive' WHERE buyer_id = ?";
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Buyer not found" });
    res.json({ message: "Buyer deactivated successfully" });
  });
});

// DELETE (deactivate) seller
app.delete("/admin/seller/:id", adminOnly, (req, res) => {
  const { id } = req.params;
  const query = "UPDATE seller SET status = 'inactive' WHERE seller_id = ?";
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Seller not found" });
    res.json({ message: "Seller deactivated successfully" });
  });
});

// Activate buyer
app.patch("/admin/buyer/:id/activate", adminOnly, (req, res) => {
  const { id } = req.params;
  const query = "UPDATE buyer SET status = 'active' WHERE buyer_id = ?";
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Buyer not found" });
    res.json({ message: "Buyer activated successfully" });
  });
});

// Activate seller
app.patch("/admin/seller/:id/activate", adminOnly, (req, res) => {
  const { id } = req.params;
  const query = "UPDATE seller SET status = 'active' WHERE seller_id = ?";
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Seller not found" });
    res.json({ message: "Seller activated successfully" });
  });
});

//Hisotry of purchases for buyer

// GET all purchases of logged-in buyer
app.get("/buyerHistory", buyerOnly, (req, res) => {
    const buyer_id = req.user.id; // ✅ use the ID from decoded JWT

  const query = `
    SELECT p.purchase_id, pr.name AS product_name, pr.section, pr.picture_url, 
           p.amount, p.currency, p.status AS purchase_status, p.purchase_date,
           s.full_name AS seller_name
    FROM purchase p
    JOIN product pr ON p.product_id = pr.product_id
    JOIN seller s ON p.seller_id = s.seller_id
    WHERE p.buyer_id = ?
    ORDER BY p.purchase_date DESC
  `;

  db.query(query, [buyer_id], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ purchases: results });
  });
});

//-------------
// GET all purchases of products belonging to logged-in seller
app.get("/sellerHistory", sellerOnly, (req, res) => {
  const seller_id = req.user.id; // from JWT

  const query = `
    SELECT p.purchase_id, pr.name AS product_name, pr.section, pr.picture_url, 
           p.amount, p.currency, p.status AS purchase_status, p.purchase_date,
           b.full_name AS buyer_name, b.email AS buyer_email
    FROM purchase p
    JOIN product pr ON p.product_id = pr.product_id
    JOIN buyer b ON p.buyer_id = b.buyer_id
    WHERE p.seller_id = ?
    ORDER BY p.purchase_date DESC
  `;

  db.query(query, [seller_id], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ purchases: results });
  });
});

///----------------------------------------------------
///-----------------
// Recommendation System Route (Buyer Only)
const { getRecommendations } = require('./recommendation_service');

// GET /buyer/recommendations
// Returns top-N product recommendations with predicted ratings >= 4.0
app.get("/buyer/recommendations", buyerOnly, async (req, res) => {
  const buyer_id = req.user.id;
  const topN = parseInt(req.query.top) || 10;
  const minRating = parseFloat(req.query.min_rating) || 1.5; // Show recommendations from 1.5-5

  try {
    // Get recommendations from ML model
    const result = await getRecommendations(buyer_id, topN, minRating);
    
    if (result.error) {
      return res.status(500).json({ message: result.error });
    }

    // Fetch product details from database for recommended product IDs
    const productIds = result.recommendations.map(r => r.product_id);
    
    if (productIds.length === 0) {
      return res.json({ 
        message: "No recommendations available at this time",
        recommendations: [] 
      });
    }

    const placeholders = productIds.map(() => '?').join(',');
    const query = `
      SELECT p.product_id, p.name, p.brand_name, p.description, p.picture_url,
             p.section, p.price, p.seller_id, s.full_name AS seller_name,
             COALESCE(SUM(r.rating = 'up'), 0) AS upvotes,
             COALESCE(SUM(r.rating = 'down'), 0) AS downvotes
      FROM product p
      JOIN seller s ON p.seller_id = s.seller_id
      LEFT JOIN product_rating r ON p.product_id = r.product_id
      WHERE p.product_id IN (${placeholders}) AND s.status = 'active'
      GROUP BY p.product_id
    `;

    const products = await db.query(query, productIds);

    // Merge ML predictions with product details
    const recommendations = result.recommendations.map(rec => {
      const product = products.find(p => p.product_id === rec.product_id);
      return product ? {
        ...product,
        predicted_rating: rec.predicted_rating
      } : null;
    }).filter(p => p !== null);

    res.json({
      user_id: buyer_id,
      recommendations,
      count: recommendations.length
    });

  } catch (err) {
    console.error("Recommendation error:", err);
    res.status(500).json({ 
      message: "Failed to generate recommendations",
      error: err.message 
    });
  }
});

// Start server--------------------------------------------------------------------
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
