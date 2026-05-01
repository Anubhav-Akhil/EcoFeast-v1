# 🌍 EcoFeast

**EcoFeast** is a comprehensive, full-stack application designed to combat food waste by connecting food retailers, consumers, charities, and volunteers. By providing a platform to rescue surplus food, EcoFeast empowers communities to make sustainable choices while earning rewards and ensuring food reaches those in need.

---

## ✨ Key Features

### 🏢 For Retailers
- **Surplus Food Listing:** Easily list surplus items at discounted prices or donate them for charity/animal feed.
- **Credit Points:** Earn `CreditPoints` for donating items to charities.
- **Inventory Management:** Update item quantities, availability, and details in real-time.

### 🛒 For Consumers
- **Rescue Food:** Purchase discounted surplus food from local retailers.
- **EcoPoints System:** Earn `EcoPoints` for every rescued meal, gamifying the sustainable experience.
- **Real-Time Tracking:** Track orders with real-time updates via WebSockets.

### ❤️ For Charities
- **Claim Donations:** Browse and claim food specifically listed for charity.
- **Volunteer Integration:** Assign and track delivery tasks for claimed donations.

### 🚲 For Volunteers
- **Task Management:** View and accept delivery tasks to transport food from retailers to charities.
- **Status Updates:** Update task statuses (pending, accepted, completed) in real-time.

### 🤖 AI Integration (Powered by Gemini)
- **Expiry Prediction:** AI analyzes food items to predict expiry hours, generate marketing tags, and calculate prevented CO2 impact.
- **Recipe Suggestions:** AI suggests simple, creative recipes based on rescued ingredients.

---

## 🛠 Tech Stack

**Frontend**
- **Framework:** React + Vite
- **Styling & UI:** Tailwind CSS (implied), Framer Motion (Animations), Lucide React (Icons)
- **State Management:** Zustand
- **Routing:** React Router DOM
- **Data Visualization:** Recharts

**Backend**
- **Server:** Node.js + Express
- **Real-Time:** Socket.IO
- **Database:** MongoDB Atlas (Mongoose)
- **Authentication:** JWT (JSON Web Tokens) & BcryptJS
- **AI Integration:** `@google/genai` (Gemini API)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) account (or local MongoDB instance)
- [Google Gemini API Key](https://aistudio.google.com/) (Optional, for AI features)

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/ecofeast.git
cd ecofeast
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory based on the provided `.env.example`:

```env
PORT=8787
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_ORIGIN=http://localhost:5173
```

*(Optional)* For the frontend, you can override the API base URL by creating a `.env.local` file:
```env
VITE_API_BASE_URL=http://localhost:8787/api
```

### 3. Running Locally

You can run both the frontend and backend concurrently using:

```bash
npm run dev:full
```

Or, run them separately in two terminal windows:

**Backend:**
```bash
npm run dev:backend
```

**Frontend:**
```bash
npm run dev
```

- **Frontend App:** `http://localhost:5173`
- **Backend API:** `http://localhost:8787`

---

## 📡 Core API Routes

### Authentication
- `POST /api/auth/signup` - Register a new user (consumer, retailer, charity, etc.)
- `POST /api/auth/login` - Authenticate user and receive JWT
- `GET /api/auth/me` - Get current user profile

### Items & Inventory
- `GET /api/items` - Fetch all available items
- `POST /api/items` - List a new item *(Retailer/Admin)*
- `PATCH /api/items/:id` - Update item details *(Retailer/Admin)*
- `DELETE /api/items/:id` - Remove an item *(Retailer/Admin)*

### Orders & Tracking
- `POST /api/orders` - Place a new order
- `GET /api/orders/my` - Fetch user's order history

### Charities & Volunteering
- `GET /api/charities` - List registered charities
- `GET /api/tasks` - Fetch delivery tasks *(Volunteer/Admin)*
- `PATCH /api/tasks/:id` - Update task status *(Volunteer/Admin)*

### AI Services
- `POST /api/ai/predict-expiry` - Get AI-driven insights on food items
- `POST /api/ai/suggest-recipe` - Generate a recipe from selected items

### Other
- `POST /api/contact` - Submit a contact form message
- `GET /api/health` - Check backend health status

---

## 📦 Deployment Notes

- **Database:** Ensure `MONGODB_URI` points to a production-ready database (e.g., MongoDB Atlas).
- **Environment Variables:** Keep `JWT_SECRET`, `MONGODB_URI`, and `GEMINI_API_KEY` strictly on the backend.
- **CORS:** Configure `FRONTEND_ORIGIN` on the backend to match your deployed frontend URL.
- **Hosting:** The frontend can be deployed on Vercel/Netlify, while the backend can be hosted on platforms like Render, Heroku, or DigitalOcean.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
