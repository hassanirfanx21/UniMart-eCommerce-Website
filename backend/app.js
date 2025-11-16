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