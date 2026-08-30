# 🌾 KisanLink — Realtime Agricultural Marketplace & Mandi Portal

KisanLink is a modern, high-performance web platform connecting agricultural producers (farmers) and bulk purchasers (merchants/buyers) with live crop pricing, dynamic timed tender rooms, realtime mandi discussions, and automated price analytics.

---

## ✨ Features

- **🌾 Farmer Portal**:
  - List harvests with custom pricing, available quantities, units, and images.
  - View real-time price analytics (min/max/average mandi market trends).
  - Participate in buyer tenders with competitive bidding.
  - Community Mandi Chat: dedicated discussion channels per crop.

- **💼 Buyer Portal**:
  - Browse live crop listings from local and verified farmers.
  - Create timed open or direct tenders (with customizable expiration windows).
  - Real-time bid evaluation and instant tender awarding.

- **📊 Realtime Mandi Analytics**:
  - Auto-calculated price spreads (Minimum, Maximum, Average) across all active listings.
  - Live ticker and market pulse indicators.

- **🎨 Dual Theme & Responsive UI**:
  - Full Light Mode and Dark Mode support with smooth transitions.
  - Fully responsive mobile layout with dedicated navigation.

- **🔒 Account Management**:
  - Role switching and profile updates.
  - Permanent account and data deletion support with complete database clean-up.

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone <your-repository-url>
cd kisanlink
npm install
```

### 2. Configure Firebase Credentials
KisanLink uses environment variables to connect to Firebase.

> 📖 **Important**: For full step-by-step instructions on setting up your own Firebase backend (Auth, Database, Security Rules), refer to the dedicated guide:
> 
> 👉 **[Setting Up Your Own Firebase Credentials (owncred.md)](./owncred.md)**

To get started quickly:
```bash
# Duplicate the example environment file
cp .env.example .env
```
Open `.env` and fill in your Firebase project credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Run Locally
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🛠️ Build & Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Firebase Hosting
```bash
firebase login
firebase use --add
firebase deploy
```

---

## 📁 Project Structure

```
kisanlink/
├── .env.example                # Example environment variables template
├── database.rules.json         # Firebase Realtime Database Security Rules
├── firebase.json               # Firebase CLI hosting and database config
├── index.html                  # Main application HTML entry point
├── owncred.md                  # Comprehensive Firebase setup guide
├── package.json                # Project dependencies and npm scripts
├── README.md                   # Project documentation
├── public/                     # Static icons and assets
└── src/
    ├── assets/                 # SVGs and images
    ├── components/             # Reusable UI components (Navbar, Modal, Toasts, Theme)
    ├── pages/                  # Application views (Dashboard, Marketplace, Tenders, Chat)
    ├── services/               # Firebase service integrations (Auth, Products, Tenders, Analytics)
    ├── styles/                 # Theme tokens, animations, responsive design system
    ├── firebase.js             # Firebase client SDK initialization via env vars
    ├── main.js                 # App entry point and client-side hash router
    └── utils.js                # Formatting helpers and utility functions
```

---

## 📄 License
MIT License
