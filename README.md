# 🍽️ QRunch

> A self-serve, zero-commission digital ordering system for restaurants of all sizes.

---

## 📌 Problem Statement

Restaurants — especially small and mid-sized ones — struggle with expensive, complex, and commission-heavy ordering systems. Existing platforms like Zomato, Swiggy, Uber Eats, and Toast charge high commissions (15–30% per order) and take away the restaurant's direct relationship with the customer. Meanwhile, many restaurants still rely on paper menus and manual order-taking, which is slow, error-prone, and hard to scale.

**QRunch solves that.** It gives any restaurant — regardless of size or technical knowledge — a simple, self-serve system to go digital in minutes. The restaurant owner can build their own menu, generate unique QR codes for each table, and start accepting real-time orders immediately. Customers simply scan the QR code at their table, browse the menu, customize their order, and submit — no app download, no login required.

---

## 🛡️ Super Admin Panel *(Platform Owner Only)*

A separate, hidden admin panel exclusively for you (the QRunch platform owner) to manage all restaurants on the platform.

### Subscription Control
- Manually **turn on/off** any restaurant's subscription with a single toggle
- Useful for:
  - Granting free access to pilot restaurants (e.g. USA testing)
  - Suspending accounts for non-payment or misuse
  - Giving extended trials or complimentary access to specific restaurants

### What Else the Super Admin Can Do
- View all registered restaurants and their subscription status
- See total active/inactive accounts across the platform
- Manually override trial expiry dates
- Delete or disable restaurant accounts if needed

### How It Works
- Super Admin has its own separate login — completely isolated from restaurant owner accounts
- Protected by a hardcoded secret key in `.env` so it can never be accessed by anyone else
- All Super Admin actions are logged for your own reference

## 🏗️ Architecture — Multi-Restaurant Support

A single owner account can manage multiple restaurant locations from one login. This is a core architectural decision that affects the entire data model.

### How It Works
- **Owner** — the account that logs in (email, password, subscription). One owner can have many restaurants.
- **Restaurant** — an individual location (name, tables, menu, staff). Always linked to one owner.
- On registration, the owner creates their account and their first restaurant simultaneously.
- From the dashboard, the owner uses a **restaurant switcher** to toggle between locations.
- Staff accounts are tied to a specific restaurant — a manager at Location A cannot see Location B.
- Analytics can be viewed **per restaurant** or as a **combined overview** across all locations.

### Database Relationship
```
Owner (1) ──── (many) Restaurant
Restaurant (1) ──── (many) MenuItem
Restaurant (1) ──── (many) Order
Restaurant (1) ──── (many) Table
Restaurant (1) ──── (many) StaffMember
```

---



### 1. Menu Builder
- Drag-and-drop interface to create and organize menu categories (Starters, Mains, Desserts, Drinks, etc.)
- Add item name, description, price, and photo per dish
- Add **modifiers** per item — e.g., "Add Cheese +$1", "Spice Level: Mild / Medium / Hot"
- Enable or disable items instantly

### 2. QR Code Generator
- Each table gets its own unique QR code
- QR links directly to that specific table's live menu and ordering page
- Owner can download and print QR codes from the dashboard
- Regenerate QR codes anytime

### 3. Real-Time Order Dashboard
- Live feed of all incoming orders, organized by table
- Each order shows: items ordered, modifiers, special instructions, timestamp
- Status flow: **New → Preparing → Ready → Served**
- Sound/visual alert for every new order
- Kitchen view (simplified) and owner view (full details)

### 4. Multi-Table Management
- Owner defines how many tables the restaurant has
- Each table has a live status: Empty / Occupied / Order Pending / Bill Requested
- Owner can reset a table after customers leave

---

## 🤖 Smart / AI-Powered Features

### 5. AI Upselling (Recommendations)
- When a customer adds an item to cart, the system suggests related items
- Example: *"Customers who order Butter Chicken also love Garlic Naan"*
- Powered by order history data analyzed by AI

### 6. AI-Generated Menu Descriptions
- Owner enters just the dish name (e.g., "Masala Dosa")
- AI automatically writes an appealing, professional menu description
- Owner can edit or regenerate as needed

### 7. Dietary Filter Tagging
- AI auto-suggests dietary tags when a new item is created: Vegan, Vegetarian, Gluten-Free, Contains Nuts, Dairy-Free, Spicy, etc.
- Customers can filter the menu by dietary preference before ordering

---

## 👤 Customer Experience Features

### 8. Order Customization
- Each item supports free-text special instructions: "No onions", "Extra spicy", "Sauce on the side"
- Modifier selections (size, add-ons) shown clearly before adding to cart

### 9. Cart & Bill Splitting
- Multiple people at the same table can open the menu on their own phones
- Each person builds their own sub-order
- At checkout, they can pay individually or request a combined bill
- Split is calculated automatically

### 10. Reorder from History
- For returning customers (identified by phone number or device), the app recognizes previous visits
- Displays *"Your usual?"* with one-tap reorder of last visit's items

### 11. Multilingual Menus
- Owner can enable multiple languages for their menu
- AI auto-translates menu items and descriptions
- Customer selects their preferred language when they open the menu
- Supported languages:
  - 🇺🇸 USA: English, Spanish
  - 🇮🇳 India: English, Hindi, Marathi, Gujarati, Tamil, Telugu

---

## 🛠️ Operational Tools (Owner-Only Access)

### 12. Inventory Tracking
- Owner marks each menu item with available stock quantity
- When stock hits zero, item is automatically hidden from the customer menu
- Low-stock alerts sent to the owner via email/notification

### 13. Analytics Dashboard
- Most ordered items (daily, weekly, monthly)
- Peak ordering hours heatmap
- Revenue per table and total revenue over time
- Average order value and top spending tables

### 14. Staff Roles *(Optional — toggled on by owner)*
- Disabled by default — solo operators can use QRunch with just the owner account
- Owner can enable **Staff Roles** from dashboard settings when they have a team
- Once enabled, the owner can create staff accounts and assign roles:
  - 👑 **Owner** — full access to everything (menu, analytics, inventory, billing, staff management, QR codes)
  - 🧑‍💼 **Manager** — can edit menu, manage inventory, and view analytics. Cannot access billing or manage staff
  - 👨‍🍳 **Kitchen Staff** — only sees the live order dashboard. Can update order status (Preparing → Ready)
  - 🧑‍💼 **Waiter / Floor Staff** — can view active table orders and mark them as Served. Read-only access
- Each staff member gets their own login (email + password) tied to the restaurant
- Staff accounts cannot access any other restaurant's data

### 15. Printer Integration
- When a new order is placed, it auto-prints to the kitchen's thermal printer
- Supported via standard thermal printer protocols (ESC/POS)
- Works with any standard receipt printer with USB/network support

---

## 🚀 Launch Strategy

### Phase 1 — India Launch *(Active)*
- Officially launching in India first
- Subscription billing handled via **Razorpay** (₹200/month after 1 month free trial)
- Razorpay also supports future in-app payment collection if needed

### Phase 2 — USA Pilot *(Testing Only — No Payments Yet)*
- Currently being tested at a partner restaurant in the USA
- No subscription billing or payment gateway for USA yet
- USA users get full access to all ordering and dashboard features during the pilot
- Payment gateway (Stripe or similar) will be integrated when QRunch officially launches in the USA

### Why This Approach
- Keeps the initial launch simple and focused
- Razorpay is reliable, widely used in India, and easy to integrate
- The codebase is structured so adding a USA payment gateway later requires **minimal changes** — just plug Stripe into the existing `paymentService.js` file

---

## 💰 Pricing (Post-Launch)

| Region | Price | Status |
|--------|-------|--------|
| 🇮🇳 India | TBD — see options below | ✅ Active — via Razorpay |
| 🇺🇸 USA | $10 / month | 🔜 Coming Soon — Stripe (post-pilot) |

- **1 Month Free** trial for all new restaurants — no credit card required

### 🇮🇳 India Pricing Options *(Decision Pending)*

**Option A — Flat Subscription**
- ₹500 / month
- Simple, predictable cost for restaurants
- No tracking of order volume needed

**Option B — Lower Subscription + Transaction Fee**
- ₹200–₹300 / month + 1% of total order value processed
- Lower barrier to entry for smaller restaurants
- Revenue scales as the restaurant does more business

**Option C — TBD**
- *(To be decided based on user feedback and market research post-launch)*
- Placeholder for any hybrid or alternate model discovered after testing

---

## 🧱 Tech Stack

### Frontend — React.js

| Package | Purpose |
|---|---|
| `react` + `react-dom` | Core React |
| `react-router-dom` | Page navigation |
| `tailwindcss` | Responsive styling (mobile + PC) |
| `axios` | API calls to backend |
| `socket.io-client` | Real-time order updates |
| `qrcode.react` | QR code generation in browser |
| `react-dnd` | Drag-and-drop menu builder |
| `recharts` | Analytics charts |
| `react-hot-toast` | Notifications/alerts |
| `i18next` + `react-i18next` | Multilingual support |
| `react-query` | Data fetching and caching |

### Backend — Node.js + Express

| Package | Purpose |
|---|---|
| `express` | Web server and routing |
| `mongoose` | MongoDB connection and schemas |
| `jsonwebtoken` | Secure login sessions (JWT) |
| `bcryptjs` | Password encryption |
| `socket.io` | Real-time order push to dashboard |
| `cors` | Allows frontend to talk to backend |
| `dotenv` | Manages secret keys and config |
| `qrcode` | Server-side QR generation |
| `nodemailer` | Email alerts (low stock, new order) |
| `node-thermal-printer` | Thermal printer integration |
| `multer` | Image upload handling |
| `cloudinary` | Cloud image storage |
| `express-validator` | Request data validation |
| `helmet` | Security headers |
| `morgan` | HTTP request logging |

### Database — MongoDB Atlas
- Hosted on MongoDB Atlas (free tier to start)
- Collections:
  - `owners` — login credentials, subscription, region
  - `restaurants` — individual locations, each linked to an owner
  - `menus`, `menuItems`, `orders`, `tables`, `staff`, `inventory`

### AI — Anthropic Claude API (or OpenAI)
- Menu description generation
- Dietary tag suggestions
- Order-based recommendations
- Translation support

### Deployment

| Part | Host |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Images | Cloudinary |
| Domain | Namecheap / GoDaddy |

---

## 📁 Project Structure

```
root/
├── frontend/
│   └── src/
│       ├── api/                  # Axios API call functions
│       │   ├── authApi.js
│       │   ├── menuApi.js
│       │   ├── orderApi.js
│       │   ├── analyticsApi.js
│       │   └── printerApi.js
│       ├── components/           # Reusable UI components
│       │   ├── common/
│       │   │   ├── Navbar.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   ├── Button.jsx
│       │   │   ├── Modal.jsx
│       │   │   └── Loader.jsx
│       │   ├── menu/
│       │   │   ├── MenuBuilder.jsx
│       │   │   ├── MenuCategory.jsx
│       │   │   ├── MenuItemCard.jsx
│       │   │   └── ModifierEditor.jsx
│       │   ├── orders/
│       │   │   ├── OrderCard.jsx
│       │   │   ├── OrderStatusBadge.jsx
│       │   │   └── KitchenTicket.jsx
│       │   ├── tables/
│       │   │   ├── TableGrid.jsx
│       │   │   └── TableCard.jsx
│       │   ├── analytics/
│       │   │   ├── RevenueChart.jsx
│       │   │   ├── TopItemsChart.jsx
│       │   │   └── PeakHoursHeatmap.jsx
│       │   └── qr/
│       │       └── QRCodeDisplay.jsx
│       ├── pages/                # Full page views
│       │   ├── auth/
│       │   │   ├── LoginPage.jsx
│       │   │   └── RegisterPage.jsx
│       │   ├── dashboard/
│       │   │   ├── DashboardHome.jsx
│       │   │   ├── MenuPage.jsx
│       │   │   ├── OrdersPage.jsx
│       │   │   ├── TablesPage.jsx
│       │   │   ├── AnalyticsPage.jsx
│       │   │   ├── InventoryPage.jsx
│       │   │   └── QRManagementPage.jsx
│       │   └── customer/
│       │       ├── CustomerMenuPage.jsx
│       │       ├── CustomerCartPage.jsx
│       │       └── OrderConfirmationPage.jsx
│       ├── hooks/                # Custom React hooks
│       │   ├── useAuth.js
│       │   ├── useOrders.js
│       │   ├── useMenu.js
│       │   ├── useSocket.js
│       │   └── useInventory.js
│       ├── context/              # Global state
│       │   ├── AuthContext.jsx
│       │   ├── CartContext.jsx
│       │   └── OrderContext.jsx
│       ├── utils/                # Helper functions
│       │   ├── formatCurrency.js
│       │   ├── generateQR.js
│       │   ├── filterByDiet.js
│       │   └── splitBill.js
│       └── locales/              # Translation files
│           ├── en.json        # English (US + India)
│           ├── es.json        # Spanish (USA)
│           ├── hi.json        # Hindi (India)
│           ├── mr.json        # Marathi (India)
│           ├── gu.json        # Gujarati (India)
│           ├── ta.json        # Tamil (India)
│           └── te.json        # Telugu (India)
│
└── backend/
    └── src/
        ├── config/
        │   ├── db.js             # MongoDB connection
        │   ├── cloudinary.js     # Image storage config
        │   └── socket.js         # Socket.io setup
        ├── models/               # Database schemas
        │   ├── Owner.js           # Login credentials, subscription
        │   ├── Restaurant.js      # Individual restaurant location
        │   ├── Menu.js
        │   ├── MenuItem.js
        │   ├── Order.js
        │   ├── Table.js
        │   ├── Customer.js
        │   └── Inventory.js
        ├── controllers/          # Business logic per feature
        │   ├── authController.js
        │   ├── menuController.js
        │   ├── orderController.js
        │   ├── tableController.js
        │   ├── qrController.js
        │   ├── analyticsController.js
        │   ├── inventoryController.js
        │   ├── printerController.js
        │   ├── aiController.js
        │   └── superAdminController.js
        ├── routes/               # API endpoint definitions
        │   ├── authRoutes.js
        │   ├── menuRoutes.js
        │   ├── orderRoutes.js
        │   ├── tableRoutes.js
        │   ├── qrRoutes.js
        │   ├── analyticsRoutes.js
        │   ├── inventoryRoutes.js
        │   ├── printerRoutes.js
        │   ├── aiRoutes.js
        │   └── superAdminRoutes.js
        ├── middleware/           # Pre-route logic
        │   ├── authMiddleware.js
        │   ├── ownerMiddleware.js
        │   ├── superAdminMiddleware.js
        │   ├── errorHandler.js
        │   └── uploadMiddleware.js
        ├── services/             # External service integrations
        │   ├── aiService.js
        │   ├── emailService.js
        │   ├── qrService.js
        │   ├── printerService.js
        │   ├── translationService.js
        │   └── paymentService.js  # Razorpay (India) — Stripe slot ready for USA
        └── utils/
            ├── generateToken.js
            ├── formatOrder.js
            └── calculateBillSplit.js
```

---

## 🗺️ Development Roadmap

| Phase | Feature |
|---|---|
| Phase 1 | Auth System (Register / Login for restaurant owners) |
| Phase 2 | Menu Builder (categories, items, modifiers, images) |
| Phase 3 | Table Management + QR Code Generation |
| Phase 4 | Customer Ordering Page (mobile-first) |
| Phase 5 | Real-Time Order Dashboard (Socket.io) |
| Phase 6 | AI Features (descriptions, tags, recommendations) |
| Phase 7 | Inventory Tracking + Analytics Dashboard |
| Phase 8 | Staff Roles (Optional Feature) |
| Phase 9 | Printer Integration |
| Phase 10 | Multilingual Support |
| Phase 11 | Testing, Polish & Deployment |

---

## 📚 Learning Roadmap

### Phase 1 — Foundations
- JavaScript ES6+ (arrow functions, async/await, destructuring, modules)
- React basics (components, props, state, useEffect)
- REST APIs (GET / POST / PUT / DELETE)

### Phase 2 — Backend
- Node.js + Express (server, routes, middleware)
- MongoDB + Mongoose (schemas, CRUD operations)
- JWT Authentication (login, signup, protecting routes)

### Phase 3 — Advanced Frontend
- React Router (multi-page navigation)
- Context API + React Query (global state management)
- Tailwind CSS (responsive design)

### Phase 4 — Real-Time & Integrations
- Socket.io (real-time events)
- Cloudinary (image upload and storage)
- AI API — Claude / OpenAI (calling external AI from backend)

### Phase 5 — Deployment
- Git & GitHub (version control)
- Environment Variables (.env)
- Deploying on Vercel + Render

### Recommended Free Resources
- [The Odin Project](https://www.theodinproject.com/) — full-stack from scratch
- [Full Stack Open](https://fullstackopen.com/) — React + Node (University of Helsinki)
- [Traversy Media on YouTube](https://www.youtube.com/@TraversyMedia) — project-based learning

---

## 📱 Future — Mobile App

When ready, migrate to **React Native + Expo**. Since the frontend is already in React:
- 60–70% of component logic is directly reusable
- API calls, hooks, and context stay exactly the same
- The backend requires **zero changes**

---

## 👤 Author

Built by QRunch
Project: **QRunch**
Targeting 🇮🇳 India & 🇺🇸 USA markets