# 🍽️ QRunch

> A self-serve, zero-commission digital ordering platform for restaurants of all sizes — built for India and the USA.

[![JavaScript](https://img.shields.io/badge/JavaScript-99.8%25-yellow)](https://github.com/vidheyabole/qrunch)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-brightgreen)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/License-Private-red)](.)

---

## 📌 Problem Statement

Restaurants — especially small and mid-sized ones — struggle with expensive, complex, and commission-heavy ordering systems. Existing platforms like Zomato, Swiggy, Uber Eats, and Toast charge **15–30% commission per order** and take away the restaurant's direct relationship with the customer. Meanwhile, many restaurants still rely on paper menus and manual order-taking, which is slow, error-prone, and hard to scale.

**QRunch solves that.** It gives any restaurant — regardless of size or technical knowledge — a simple, self-serve system to go digital in minutes. The restaurant owner can build their own menu, generate unique QR codes for each table, and start accepting real-time orders immediately. Customers simply scan the QR code at their table, browse the menu, customise their order, and submit — **no app download, no login required.**

---

## 🚀 Live Demo

| Role | URL |
|------|-----|
| Owner Dashboard | `localhost:5173/dashboard` |
| Staff Login | `localhost:5173/staff/login` |
| Customer Menu | `localhost:5173/order/:restaurantId/:tableId` |
| Super Admin | `localhost:5173/superadmin` |

---

## ✨ Features

### 🏪 Owner Dashboard
- **Menu Builder** — Create categories, add items with names, descriptions, prices, photos, modifiers, dietary tags, and ingredients
- **AI Menu Descriptions** — Enter a dish name and AI writes a professional description instantly
- **AI Image Generation** — Generate dish photos using AI when no photo is available
- **AI Dietary Tag Suggestions** — AI auto-suggests Vegan, Jain, Gluten-Free etc. tags per item
- **Custom Dietary Tags** — Add your own tags beyond the defaults
- **Ingredients List** — Optional per-dish ingredient list visible to customers
- **QR Code Generator** — Each table gets its own unique QR code, downloadable and printable
- **Table Management** — Define tables, track status (Empty / Occupied / Bill Requested)
- **Real-Time Order Dashboard** — Live feed of all orders with status updates
- **Inventory Tracking** — Track stock quantities, get low-stock email alerts, bulk edit
- **Analytics Dashboard** — Revenue over time, top items, peak hours, table performance, P&L tracking
- **Expense Logging** — Log inventory costs and offline orders to calculate net profit/loss
- **Staff Management** — Create staff accounts with roles and permissions
- **Restaurant Settings** — Configure GST rate, GSTIN, and accepted payment methods per restaurant
- **Multi-Restaurant Support** — Manage multiple locations from one login
- **Dark Mode** — Full dark mode support across all pages
- **Multilingual UI** — English, Hindi, Marathi supported

### 👨‍🍳 Staff System
- **Manager** — Full access: orders, inventory, menu, staff management
- **Chef** — Kitchen display + inventory access
- **Waiter** — Table orders, status updates, bill management
- **Staff Order Form** — Place orders on behalf of customers at any table
- **Staff Join/Leave Records** — Track when staff joined, left, and why
- **Multilingual Staff UI** — English, Hindi, Marathi

### 📱 Customer Experience
- **Mobile-First Menu** — Fast, responsive menu browsing with photos and dietary filters
- **Personalised "For You" Tab** — Shows items based on customer's past order history (name/phone match), falls back to most popular items
- **Item Modifiers** — Size, add-ons, spice level selections per item
- **Special Instructions** — Free-text notes per item (allergies, preferences)
- **AI Upselling** — "Goes well with" suggestions based on order patterns
- **Cart & Checkout** — Clean cart with GST breakdown and total
- **Payment Method Selection** — Customer selects Cash, UPI/GPay, Card, or Other before checkout
- **Order Tracker** — Live order status page with progress bar (Received → Preparing → Ready → Delivered)
- **Bill Request** — Request bill from phone with payment method preference
- **Allergy Banner** — Dismissible allergy reminder at top of menu
- **Multilingual Menu** — AI-powered translations (Hindi, Marathi, Gujarati, Tamil, Telugu, Spanish)
- **Name Required at Checkout** — Customer name captured so staff can call them when order is ready

### 🧾 Billing & Payments
- **GST Support** — CGST + SGST breakdown on cart and order tracker (5% or 18%, custom rate supported)
- **GSTIN Display** — Shown on bill if provided by restaurant
- **Payment Method Selection** — Owner configures which methods they accept; customers choose at checkout
- **Split Bill** — Equal, custom, or by-order split options
- **Print Bill** — Browser-based bill printing from manager/waiter view

### 💬 Feedback System
- **Owner Feedback** — On profile page, sent to QRunch team
- **Staff Feedback** — Modal in staff header
- **Customer Feedback** — 1–5 star rating after order confirmation
- **Email Notifications** — All feedback sent to QRunch inbox via email

### 🛡️ Super Admin Panel
- Separate login isolated from all restaurant accounts
- Toggle any restaurant's subscription on/off
- View all registered restaurants and subscription status
- Override trial expiry dates
- Protected by `.env` secret key

---

## 🏗️ Architecture

### Multi-Restaurant Support

A single owner account manages multiple restaurant locations from one login.

```
Owner (1) ──── (many) Restaurant
Restaurant (1) ──── (many) MenuItem
Restaurant (1) ──── (many) Order
Restaurant (1) ──── (many) Table
Restaurant (1) ──── (many) Staff
Restaurant (1) ──── (many) TableSession
Restaurant (1) ──── (many) InventoryItem
```

- Staff accounts are tied to a specific restaurant — a manager at Location A cannot see Location B
- Each restaurant has its own menu, tables, QR codes, staff, inventory, and settings
- Analytics viewable per restaurant

---

## 🧱 Tech Stack

### Frontend
| Package | Purpose |
|---------|---------|
| `react` + `vite` | Core framework + build tool |
| `react-router-dom` | Page navigation |
| `tailwindcss` | Responsive styling |
| `socket.io-client` | Real-time order updates |
| `react-hot-toast` | Notifications |
| `i18next` + `react-i18next` | Multilingual support |
| `axios` | API calls |

### Backend
| Package | Purpose |
|---------|---------|
| `express` | Web server and routing |
| `mongoose` | MongoDB schemas and queries |
| `jsonwebtoken` | JWT authentication |
| `bcryptjs` | Password hashing |
| `socket.io` | Real-time events |
| `nodemailer` | Email alerts |
| `multer` + `cloudinary` | Image upload and storage |
| `passport` + `passport-google-oauth20` | Google OAuth |
| `express-validator` | Request validation |

### Database — MongoDB Atlas
```
owners          restaurants     menuItems       categories
orders          tables          staff           tableSessions
inventoryItems  expenses        feedback        generatedImages
```

### AI — Anthropic Claude API
- Menu description generation
- Dietary tag suggestions  
- AI-powered recommendations
- Menu translation (10+ languages)

### Deployment
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting |
| Render | Backend hosting |
| MongoDB Atlas | Database |
| Cloudinary | Image storage |

---

## 📁 Project Structure

```
root/
├── frontend/
│   └── src/
│       ├── api/                    # API call functions
│       │   ├── authApi.js
│       │   ├── customerApi.js
│       │   ├── sessionApi.js
│       │   ├── expenseApi.js
│       │   └── ...
│       ├── components/
│       │   ├── common/             # Navbar, Sidebar, FeedbackForm, etc.
│       │   └── dashboard/          # RestaurantSettings, etc.
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   ├── CartContext.jsx
│       │   └── ThemeContext.jsx
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useStaffAuth.js
│       │   └── useTheme.js
│       └── pages/
│           ├── auth/               # Login, Register, Google callback
│           ├── dashboard/          # Owner dashboard pages
│           │   ├── DashboardHome.jsx
│           │   ├── MenuPage.jsx
│           │   ├── OrdersPage.jsx
│           │   ├── TablesPage.jsx
│           │   ├── AnalyticsPage.jsx
│           │   ├── InventoryPage.jsx
│           │   ├── StaffPage.jsx
│           │   └── ProfilePage.jsx
│           ├── staff/              # Staff views
│           │   ├── StaffLoginPage.jsx
│           │   ├── KitchenDisplay.jsx
│           │   ├── WaiterView.jsx
│           │   ├── ManagerView.jsx
│           │   └── StaffOrderPage.jsx
│           └── customer/           # Customer-facing pages
│               ├── CustomerLandingPage.jsx
│               ├── CustomerMenuPage.jsx
│               ├── CartPage.jsx
│               ├── OrderConfirmationPage.jsx
│               └── OrderTrackerPage.jsx
│
└── backend/
    └── src/
        ├── config/
        │   ├── db.js
        │   ├── cloudinary.js
        │   ├── passport.js
        │   └── socket.js
        ├── models/
        │   ├── Owner.js
        │   ├── Restaurant.js
        │   ├── MenuItem.js
        │   ├── Category.js
        │   ├── Order.js
        │   ├── Table.js
        │   ├── Staff.js
        │   ├── TableSession.js
        │   ├── InventoryItem.js
        │   ├── Expense.js
        │   └── Feedback.js
        ├── controllers/
        ├── routes/
        ├── middleware/
        │   ├── authMiddleware.js
        │   ├── staffAuthMiddleware.js
        │   └── uploadMiddleware.js
        └── services/
            ├── emailService.js
            └── paymentService.js   # Razorpay (India) — Stripe slot ready for USA
```

---

## 🗺️ Development Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| Phase 1 | Auth System (Register / Login / Google OAuth) | ✅ Done |
| Phase 2 | Menu Builder (categories, items, modifiers, images) | ✅ Done |
| Phase 3 | Table Management + QR Code Generation | ✅ Done |
| Phase 4 | Customer Ordering Page (mobile-first) | ✅ Done |
| Phase 5 | Real-Time Order Dashboard (Socket.io) | ✅ Done |
| Phase 6 | AI Features (descriptions, tags, recommendations) | ✅ Done |
| Phase 7 | Inventory Tracking + Analytics + P&L | ✅ Done |
| Phase 8 | Staff Roles System (Manager, Chef, Waiter) | ✅ Done |
| Phase 9 | Multilingual Support (10+ languages) | ✅ Done |
| Phase 10 | GST Billing + Payment Method Selection | ✅ Done |
| Phase 11 | Customer Order Tracker + Personalised Recommendations | ✅ Done |
| Phase 12 | Feedback System + Owner Profile | ✅ Done |
| Phase 13 | Razorpay Subscription Billing | 🔜 Next |
| Phase 14 | Actual UPI/GPay Payment Processing | 🔜 Planned |
| Phase 15 | Testing, Polish & Production Deployment | 🔜 Planned |

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account
- Anthropic API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/vidheyabole/qrunch.git
cd qrunch

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_USER=your_gmail
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:5173
SUPERADMIN_SECRET=your_superadmin_secret
```

### Running Locally

```bash
# Start backend (from /backend)
npm run dev

# Start frontend (from /frontend)
npm run dev
```

Frontend runs at `http://localhost:5173`  
Backend runs at `http://localhost:5000`

---

## 💰 Pricing

| Region | Model | Status |
|--------|-------|--------|
| 🇮🇳 India | TBD — tiered subscription per restaurant | ✅ Active |
| 🇺🇸 USA | $9–$19/month (Stripe — post-pilot) | 🔜 Coming Soon |

- **30-day free trial** for all new restaurants — no credit card required
- Pricing finalised after restaurant owner feedback and market research

---

## 🔐 Security

- JWT-based authentication for owners and staff
- Separate token system for staff (scoped to restaurant)
- Google OAuth for owner accounts
- All passwords hashed with bcrypt
- Super Admin panel protected by `.env` secret key — isolated from all user accounts
- CORS configured for production domains only

---

## 🌍 Supported Languages

| Language | Region | Status |
|----------|--------|--------|
| English | India + USA | ✅ |
| Hindi | India | ✅ |
| Marathi | India | ✅ |
| Gujarati | India | ✅ AI translated |
| Tamil | India | ✅ AI translated |
| Telugu | India | ✅ AI translated |
| Malayalam | India | ✅ AI translated |
| Kannada | India | ✅ AI translated |
| Bengali | India | ✅ AI translated |
| Spanish | USA | ✅ AI translated |

---

## 📱 Future — Mobile App

When ready, migrate to **React Native + Expo**:
- 60–70% of component logic is directly reusable
- API calls, hooks, and context stay the same
- The backend requires **zero changes**

---

## 👤 Author

Built by **Vidheya Bole**  

---

## 📄 License

Private — All rights reserved © 2025 QRunch