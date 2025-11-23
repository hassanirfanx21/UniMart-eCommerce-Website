#  UniMart - Student Marketplace Platform

**UniMart** is a comprehensive e-commerce platform designed exclusively for university students to buy, sell, and discover products within their campus community. Built with modern web technologies and powered by intelligent AI recommendations, UniMart creates a trusted marketplace where students can trade everything from textbooks to tech gadgets.

---

##  Project Overview

UniMart bridges the gap between students who want to sell their used items and those looking for affordable alternatives. The platform combines social commerce features with smart recommendations to create a seamless buying and selling experience tailored for the student lifestyle.

### Key Highlights
-  **Student-Centric Design**: Built specifically for university communities with .edu.pk email verification for buyers
-  **AI-Powered Recommendations**: Intelligent product suggestions based on your browsing and interaction patterns
-  **Secure Payments**: Integrated Stripe payment gateway for safe transactions
-  **Responsive Design**: Works flawlessly on desktop, tablet, and mobile devices
-  **Role-Based Access**: Separate dashboards for buyers, sellers, and administrators

---

##  AI Recommendation System - The Smart Brain

UniMart features an intelligent recommendation engine that learns from user behavior to suggest products you're most likely to love. Here's how it works in simple terms:

### How Does It Work?

Think of it like having a smart friend who notices what you like and suggests similar things you might enjoy. Our system uses **Collaborative Filtering**, which means it learns from what all students on the platform are doing - not just you!

**The Magic Behind the Scenes:**

1. **Learning from Everyone**: When you browse products, like items, or make purchases, our system records these interactions. It also looks at what similar students are interested in.

2. **Finding Patterns**: Using a machine learning technique called **SVD (Singular Value Decomposition)**, the AI discovers hidden patterns in how students interact with products. For example, if students who buy programming books also tend to buy mechanical keyboards, the system learns this connection.

3. **Making Smart Predictions**: When you log in, the AI predicts how much you'd like each product (on a 1-5 scale) based on:
   - Products you've viewed or liked
   - What similar students are buying
   - Popular items in your product categories
   - Your interaction history

4. **Personalized Suggestions**: Only products with high predicted ratings (above 1.5 stars) are recommended to you, and they're ranked from most to least relevant.

**Technical Implementation:**
- **Algorithm**: TruncatedSVD (a form of matrix factorization)
- **Language**: Python with NumPy, Pandas, and Scikit-learn
- **Data Processing**: Real-time user-product interaction matrix
- **Filtering**: Category-based filtering (Clothes, Food, Study Tools)
- **Updates**: Model retrains periodically as new interactions occur

The system doesn't just recommend popular items - it finds products that match YOUR unique preferences based on behavioral patterns, making every student's experience truly personalized.

---

## 🏗️ Technology Stack

### Frontend
- **Next.js 15.5** - React framework for production
- **React 19** - UI component library
- **Tailwind CSS** - Utility-first styling
- **Stripe React Elements** - Payment integration

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **JWT** - Authentication & authorization
- **Bcrypt** - Password hashing

### AI/ML
- **Python 3.x** - ML model execution
- **NumPy** - Numerical computations
- **Pandas** - Data manipulation
- **Scikit-learn** - Machine learning (SVD algorithm)
- **Pickle** - Model persistence

### External Services
- **Cloudinary** - Image hosting and CDN
- **Stripe** - Payment processing

---

## 👥 User Roles

### 🛍️ Buyers
- Browse and search products across categories
- Get personalized AI recommendations
- Like/dislike products for better suggestions
- Bookmark favorite items
- Make secure purchases with Stripe
- Leave feedback and ratings
- View purchase history

### 🏪 Sellers
- List products with images and descriptions
- Manage inventory and pricing
- Track sales and revenue
- View customer feedback
- Monitor product performance

### 👨‍💼 Admin
- Comprehensive analytics dashboard
- User management (activate/deactivate accounts)
- Sales tracking and revenue reports
- Interactive charts (line, pie, bar graphs)
- Filter data by time periods and categories
- Monitor platform statistics

---

## ✨ Core Features

### For All Users
- **Secure Authentication**: JWT-based login with role-specific access
- **Email Verification**: Buyers must use university email (.edu.pk)
- **Responsive Design**: Professional glassmorphism UI with dark theme
- **Real-time Updates**: Live product availability and pricing

### Product Management
- **Category Organization**: Study Tools, Clothes, Food
- **Advanced Search**: Filter by name, price, category
- **Image Upload**: Cloudinary integration for fast, reliable hosting
- **Product Details**: Comprehensive information and seller details

### Social Features
- **Product Ratings**: Upvote/downvote system
- **Feedback System**: Leave and view product reviews
- **Bookmarks**: Save products for later
- **Purchase History**: Track your buying journey

### Payment & Security
- **Stripe Integration**: PCI-compliant payment processing
- **Secure Checkout**: Encrypted payment information
- **Transaction Records**: Complete purchase history
- **Input Validation**: XSS prevention and SQL injection protection

### Analytics (Admin Only)
- **Dashboard Stats**: Revenue, users, sales, products
- **Visual Reports**: Interactive charts with Chart.js
- **Time-based Analysis**: Daily, monthly, yearly trends
- **Section Performance**: Category-wise revenue breakdown

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- MySQL Server
- npm or yarn package manager

### 1. Clone Repository
```bash
git clone https://github.com/hassanirfanx21/UniMart-eCommerce-Website.git
cd UniMart
```

### 2. Database Setup
```sql
-- Import the database schema
mysql -u root -p < unimartdb.sql
```

### 3. Backend Setup
```bash
cd backend

# Install Node dependencies
npm install

# Install Python dependencies for AI
cd recommendation_model
pip install numpy pandas scikit-learn

# Create .env file in backend directory
# Add your configuration:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=yourpassword
# DB_NAME=unimartdb
# JWT_SECRET=your_secret_key
# STRIPE_SECRET_KEY=your_stripe_secret
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local file
# Add your configuration:
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 5. Run the Application
```bash
# From the root UniMart directory
npm run dev

# This runs both frontend (port 3000) and backend (port 5000) concurrently
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

---

## 🔐 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Role-Based Authorization**: Middleware protection
- **Input Validation**: Frontend and backend validation
- **XSS Prevention**: Input sanitization
- **SQL Injection Protection**: Parameterized queries
- **HTTPS Ready**: SSL/TLS support
- **Session Management**: Secure token storage

---

## 📊 Admin Dashboard Features

The admin panel provides comprehensive insights with a modern, professional interface:

- **Real-time Statistics**: Live updates on revenue, users, sales, and products
- **Interactive Charts**: 
  - Line charts for sales trends
  - Pie charts for revenue by category
  - Bar charts for growth analysis
- **Advanced Filtering**: 
  - Time-based (day, month, year)
  - Category-based filtering
  - Custom date ranges
- **User Management**: Activate/deactivate buyer and seller accounts
- **Visual Design**: Modern dark theme with purple, cyan, and pink gradients

---

## 🚀 Future Enhancements

- Real-time chat between buyers and sellers
- Mobile app (React Native)
- Multi-university support
- Advanced ML models (deep learning)
- Social media integration
- Auction-style listings
- Subscription plans for sellers
- Advanced analytics with predictive insights

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 👨‍💻 Developer

**Hassan Irfan**
- GitHub: [@hassanirfanx21](https://github.com/hassanirfanx21)

---

## 📄 License

This project is part of an academic assignment for Web Engineering course.

---

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for students, by students**
