# Small Shop Inventory Manager

A simple inventory management system for a local retail store built with the MERN stack in JavaScript.

## Features

- Manage products with SKU, category, supplier, pricing, stock threshold, and description
- Manage suppliers with contact details and notes
- Record stock movements for:
  - purchases
  - sales
  - stock adjustments in
  - stock adjustments out
- Prevent stock from ever going negative
- Show low-stock alerts on the dashboard
- View reports for:
  - inventory
  - sales
  - purchases
  - low-stock items
- Show analytics for fast-moving and low-selling products

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose

## Environment Variables

No third-party API keys are required.

### Backend

Create `server/.env` from [server/.env.example](server/.env.example):

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/shop_inventory
CLIENT_URL=http://localhost:5173
```

### Frontend

Create `client/.env` from [client/.env.example](client/.env.example) if you want to override the default API URL:

```env
VITE_API_URL=http://localhost:5000/api
```

## Getting Started

1. Install dependencies from the project root:

```bash
npm install
```

2. Start MongoDB locally.

3. Create `server/.env` with your MongoDB connection string.

4. Start the app from the root:

```bash
npm run dev
```

5. Open the frontend at `http://localhost:5173`.

## Scripts

- `npm run dev` - starts backend and frontend together
- `npm run server` - starts only the backend
- `npm run client` - starts only the frontend
- `npm run build` - builds the React frontend
- `npm start` - starts the backend in production mode

## Business Rule

Stock can never become negative.

This is enforced in the backend when sales or outgoing adjustments are created. If the requested quantity is higher than available stock, the request is rejected.

## Notes

- Product stock changes should be made through stock movements so inventory history stays accurate.
- The currency formatter in the UI uses INR by default and can be changed in [client/src/utils.js](client/src/utils.js).
