# 🌾 Setting Up Your Own Firebase Credentials (KisanLink)

This guide walks you through setting up your own Firebase backend project and connecting it to KisanLink.

---

## 📋 Prerequisites

- A Google Account
- Node.js (v18 or higher)
- Firebase CLI installed globally (optional, for deployment): `npm install -g firebase-tools`

---

## 🚀 Step 1: Create a New Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Enter your desired project name (e.g. `my-kisanlink-app`).
4. (Optional) Choose whether to enable Google Analytics.
5. Click **Create project** and wait for provisioning to complete.

---

## 🔑 Step 2: Register a Web App & Copy Credentials

1. On your project's overview page in the Firebase Console, click the **Web icon** (`</>`) to add a Web App.
2. Enter an App nickname (e.g. `KisanLink Web`).
3. (Optional) Check **"Also set up Firebase Hosting for this app"**.
4. Click **Register app**.
5. Firebase will display your `firebaseConfig` object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project-id.firebaseapp.com",
     databaseURL: "https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app",
     projectId: "your-project-id",
     storageBucket: "your-project-id.firebasestorage.app",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456",
     measurementId: "G-XXXXXXXXXX"
   };
   ```
6. Keep this tab open or copy these values for Step 5.

---

## 🔐 Step 3: Enable Google Authentication

1. In the left sidebar of the Firebase Console, click **Build** $\rightarrow$ **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Google**.
4. Toggle **Enable**.
5. Set your **Project public-facing name** and select your **Project support email**.
6. Click **Save**.
7. Under the **Settings** tab $\rightarrow$ **Authorized domains**, ensure `localhost` is listed (for local testing). When deploying, add your custom domain or Firebase Hosting domain (`your-project-id.web.app`).

---

## 🗄️ Step 4: Create Realtime Database & Apply Security Rules

1. In the left sidebar, click **Build** $\rightarrow$ **Realtime Database**.
2. Click **Create Database**.
3. Choose your database location (e.g. `asia-southeast1` or `us-central1`).
4. Choose **Start in locked mode** and click **Enable**.
5. Note your **Database URL** from the header (e.g., `https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app`).
6. Click on the **Rules** tab in Realtime Database.
7. Paste the complete contents from [`database.rules.json`](./database.rules.json) into the rules editor:
   ```json
   {
     "rules": {
       ".read": false,
       ".write": false,
       "users": {
         ".read": "auth != null",
         "$uid": {
           ".read": "auth != null",
           ".write": "auth != null && auth.uid === $uid",
           ".validate": "newData.hasChildren(['uid', 'email', 'displayName', 'createdAt'])"
         }
       },
       "products": {
         ".read": "auth != null",
         ".indexOn": ["farmerId", "cropKey", "isActive", "pricePerUnit"],
         "$productId": {
           ".write": "auth != null && (!newData.exists() ? (data.child('farmerId').val() === auth.uid) : ((root.child('users').child(auth.uid).child('role').val() === 'farmer') && (!data.exists() || data.child('farmerId').val() === auth.uid) && (newData.child('farmerId').val() === auth.uid)))",
           ".validate": "newData.hasChildren(['productId', 'farmerId', 'cropName', 'pricePerUnit', 'unit', 'availableQuantity', 'isActive']) && newData.child('pricePerUnit').isNumber() && newData.child('pricePerUnit').val() > 0 && newData.child('availableQuantity').isNumber() && newData.child('availableQuantity').val() >= 0"
         }
       },
       "tenders": {
         ".read": "auth != null",
         ".indexOn": ["buyerId", "targetFarmerId", "cropName", "status", "tenderType"],
         "$tenderId": {
           ".write": "auth != null && (!newData.exists() ? (data.child('buyerId').val() === auth.uid) : ((root.child('users').child(auth.uid).child('role').val() === 'buyer') && (!data.exists() || data.child('buyerId').val() === auth.uid) && (newData.child('buyerId').val() === auth.uid)))",
           ".validate": "newData.hasChildren(['tenderId', 'buyerId', 'cropName', 'tenderType', 'requiredQuantity', 'unit', 'status', 'expiresAt']) && newData.child('tenderType').val().matches(/^(open|direct)$/) && newData.child('status').val().matches(/^(open|closed|awarded)$/)"
         }
       },
       "bids": {
         "$tenderId": {
           ".read": "auth != null",
           ".indexOn": ["farmerId", "bidPricePerUnit", "createdAt"],
           "$bidId": {
             ".write": "auth != null && (!newData.exists() ? (data.child('farmerId').val() === auth.uid || root.child('tenders').child($tenderId).child('buyerId').val() === auth.uid) : ((root.child('users').child(auth.uid).child('role').val() === 'farmer') && (!data.exists() || data.child('farmerId').val() === auth.uid) && (newData.child('farmerId').val() === auth.uid) && (root.child('tenders').child($tenderId).child('status').val() === 'open') && (root.child('tenders').child($tenderId).child('tenderType').val() === 'open' || root.child('tenders').child($tenderId).child('targetFarmerId').val() === auth.uid)))",
             ".validate": "newData.hasChildren(['bidId', 'tenderId', 'farmerId', 'bidPricePerUnit', 'offeredQuantity', 'unit']) && newData.child('bidPricePerUnit').isNumber() && newData.child('bidPricePerUnit').val() > 0"
           }
         }
       },
       "farmer_topics": {
         ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'farmer'",
         ".indexOn": ["lastMessageTimestamp", "cropName"],
         "$topicId": {
           ".write": "auth != null && (!newData.exists() ? (data.child('creatorId').val() === auth.uid) : (root.child('users').child(auth.uid).child('role').val() === 'farmer'))",
           ".validate": "newData.hasChildren(['topicId', 'title', 'creatorId', 'createdAt'])"
         }
       },
       "farmer_messages": {
         "$topicId": {
           ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'farmer'",
           ".indexOn": ["timestamp"],
           "$messageId": {
             ".write": "auth != null && (!newData.exists() ? (data.child('senderId').val() === auth.uid) : (root.child('users').child(auth.uid).child('role').val() === 'farmer' && !data.exists() && newData.child('senderId').val() === auth.uid))",
             ".validate": "newData.hasChildren(['messageId', 'topicId', 'senderId', 'text', 'timestamp']) && newData.child('text').isString() && newData.child('text').val().length > 0 && newData.child('text').val().length <= 1000"
           }
         }
       },
       "price_analytics": {
         ".read": "auth != null",
         ".write": "auth != null",
         "$cropKey": {
           ".validate": "newData.hasChildren(['cropName', 'minPrice', 'maxPrice', 'avgPrice', 'lastUpdated'])"
         }
       },
       "notifications": {
         "$uid": {
           ".read": "auth != null && auth.uid === $uid",
           ".write": "auth != null && auth.uid === $uid",
           "$notificationId": {
             ".write": "auth != null",
             ".validate": "newData.hasChildren(['notificationId', 'recipientId', 'type', 'title', 'body', 'timestamp'])"
           }
         }
       }
     }
   }
   ```
8. Click **Publish**.

---

## ⚙️ Step 5: Configure Environment Variables

1. In the project root directory, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your values copied from Step 2 & 4:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyYourActualApiKeyHere
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_SUPPORT_EMAIL=your_support_email@example.com
   ```
3. Save the `.env` file. *(Note: `.env` is ignored by Git, ensuring your credentials are never accidentally committed.)*

---

## 💻 Step 6: Test Locally

1. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.
4. Click **Sign In with Google** to test authentication and role registration!

---

## 🚀 Step 7: (Optional) Deploying to Your Firebase Hosting

If you want to deploy the application to your own Firebase Hosting domain:

1. Log in to Firebase CLI:
   ```bash
   firebase login
   ```
2. Link your Firebase project:
   ```bash
   firebase use --add
   ```
   *(Select your created project and give it an alias, e.g. `default`)*
3. Build the production bundle:
   ```bash
   npm run build
   ```
4. Deploy to Firebase:
   ```bash
   firebase deploy
   ```
5. Your live app will be available at `https://your-project-id.web.app`!
