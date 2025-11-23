 CREATE DATABASE unimart;
USE unimart;
-- DROP DATABASE unimart;
-- CREATE database unimart;
select * from buyer;
select * from seller;
select * from admin;
select * from product;
select * from purchase;
select * from feedback;
select * from advertisement;

-- product starts from 20 ownwardss
SELECT buyer_id, product_id, COUNT(*) AS cnt
FROM purchase
GROUP BY buyer_id, product_id
HAVING cnt > 1;


SELECT buyer_id AS user_id, product_id AS item_id, rating
FROM purchase
WHERE rating IS NOT NULL
INTO OUTFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/meaningful-purchases.csv'
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\n';


SHOW VARIABLES LIKE 'secure_file_priv';

--    DROP TABLE IF EXISTS purchase;
-- DROP TABLE IF EXISTS seller;

SELECT COUNT(*) 
FROM purchase;


-- SELECT buyer_id AS id, full_name AS name, email, created_at AS joined_date, status
--     FROM buyer
--     ORDER BY created_at DESC;
--     
-- INSERT INTO admin (full_name, email, password, role)
-- VALUES (
--   'Muhammad Hassan Irfan',
--   'hassanirfan@gmail.com',
--   '$2b$10$BmatGKlJ2bsH9lj.70SL1ehBd8GPhDmUGXL/iW4JTi8GJ8avz06CO',
--   'admin'
-- );


CREATE TABLE buyer (
    buyer_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('buyer') DEFAULT 'buyer',
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seller (
    seller_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('seller') DEFAULT 'seller',
    brand_name VARCHAR(100),
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add status column to buyer
ALTER TABLE buyer 
ADD COLUMN status ENUM('active','inactive') NOT NULL DEFAULT 'active';
-- Add status column to seller
ALTER TABLE seller 
ADD COLUMN status ENUM('active','inactive') NOT NULL DEFAULT 'active';

-- CREATE TABLE buyer (
--     buyer_id INT AUTO_INCREMENT PRIMARY KEY,
--     full_name VARCHAR(100) NOT NULL,
--     email VARCHAR(100) NOT NULL UNIQUE,
--     password VARCHAR(255) NOT NULL,   -- hashed password
--     role ENUM('buyer') DEFAULT 'buyer',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
-- -- DROP TABLE seller;-- 

-- CREATE TABLE seller (
--     seller_id INT AUTO_INCREMENT PRIMARY KEY,
--     full_name VARCHAR(100) NOT NULL,
--     email VARCHAR(100) NOT NULL UNIQUE,
--     password VARCHAR(255) NOT NULL,     -- hashed password
--     role ENUM('seller') DEFAULT 'seller',
--     brand_name VARCHAR(100),            -- optional: seller’s brand name
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

CREATE TABLE admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,   -- hashed password
    role ENUM('admin') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,                       
    name VARCHAR(150) NOT NULL,
    brand_name VARCHAR(100),                     
    description TEXT,
    picture_url VARCHAR(255),
    section VARCHAR(100) NOT NULL,                -- it only have these 3 sections 'study tools', 'clothes', 'food'
    price DECIMAL(10,2) NOT NULL,                 -- ✅ added price (e.g., 99999999.99 max)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (seller_id) REFERENCES seller(seller_id)
      ON DELETE CASCADE
);
-- ALTER TABLE product ADD COLUMN is_deleted TINYINT(1) DEFAULT 0;
-- ALTER TABLE product DROP COLUMN is_deleted;

-- ALTER TABLE product
-- ADD COLUMN price DECIMAL(10,2) NOT NULL AFTER section;
-- DELETE FROM product;-- 
-- drop table purchase;-- 

CREATE TABLE product_rating (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    buyer_id INT NOT NULL,
    rating ENUM('up', 'down') NOT NULL,
   --  we can later see a certain product has how many ups and down to calculate the rating --  
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES product(product_id)
      ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES buyer(buyer_id)
      ON DELETE CASCADE,

    UNIQUE (product_id, buyer_id) -- prevents same buyer rating same product twice
);

CREATE TABLE purchase (
  purchase_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  buyer_id INT NOT NULL,
  seller_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,                 -- stored in PKR (display currency)
  currency VARCHAR(3) DEFAULT 'PKR',
  stripe_payment_id VARCHAR(100),
  status ENUM('pending','succeeded','failed','refunded') DEFAULT 'succeeded',
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES product(product_id),
  FOREIGN KEY (buyer_id) REFERENCES buyer(buyer_id),
  FOREIGN KEY (seller_id) REFERENCES seller(seller_id)
);
ALTER TABLE purchase
ADD COLUMN rating TINYINT NULL;

 -- DROP TABLE IF EXISTS purchase;

-- this is the bokmark content-- 
CREATE TABLE favorite_products (
    favorite_id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (buyer_id) REFERENCES buyer(buyer_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
    
    UNIQUE(buyer_id, product_id) -- prevents duplicates
);


CREATE TABLE feedback (
  feedback_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  buyer_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES buyer(buyer_id) ON DELETE CASCADE
);
-- ----------------------
CREATE TABLE advertisement (
    ad_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_id) REFERENCES admin(admin_id) ON DELETE CASCADE
);



-- ----------------------