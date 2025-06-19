# Vite React + Node TypeScript Monorepo

This repository contains two TypeScript-based services:

- **frontend**: A React application bootstrapped with Vite.
- **server**: A Node.js server using Express.

## Setup

Install dependencies for both services:

```bash
# Frontend
cd frontend
npm install

# Server
cd ../server
npm install
```

## Running in development

Start both services in separate terminals:

```bash
# Terminal 1 (frontend)
cd frontend
npm run dev

# Terminal 2 (server)
cd server
npm run dev
```

The React app will be available at http://localhost:5173 and the server at http://localhost:3001.

API requests from the frontend to `/api/*` will be proxied to the server.

## Building for production

```bash
# Frontend
cd frontend
npm run build

# Server
cd server
npm run build
npm start
```