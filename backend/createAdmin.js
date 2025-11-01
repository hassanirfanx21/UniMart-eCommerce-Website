// createAdmin.js
const bcrypt = require("bcrypt");
const mysql = require("mysql2");
//this is for only one time use to create an admin in the DB
// --- Admin info ---
const name = "Hassan Irfan";
const email = "hassanirfan@gmail.com";
const password = "123"; // choose a secure password
const role = "admin";

// --- Hash password ---
async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed Password:", hashedPassword);

    // --- Connect to DB ---
    const db = mysql.createConnection({
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "10007",   // your MySQL password
      database: "unimart",
    });

    db.connect((err) => {
      if (err) {
        console.error("Database connection failed:", err);
        return;
      }

      console.log("Connected to DB. Inserting admin...");

      const query = `INSERT INTO admin (full_name, email, password, role) VALUES (?, ?, ?, ?)`;

      db.query(query, [name, email, hashedPassword, role], (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            console.log("Admin already exists!");
          } else {
            console.error("Error inserting admin:", err);
          }
        } else {
          console.log("Admin created successfully!");
        }
        db.end();
      });
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

createAdmin();
