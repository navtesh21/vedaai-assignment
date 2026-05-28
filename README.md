# VedaAI — AI Assessment Creator

A full-stack AI-powered assessment creation platform for teachers.

## Project Structure

```
vedaai/
├── backend/          # Node.js + Express + TypeScript API & BullMQ Workers
├── frontend/         # Next.js 14 + TailwindCSS + React UI
├── nginx/            # Reverse Proxy configuration
└── docker-compose.yml
```

## Architecture Overview

VedaAI is designed as a robust, containerized microservices application optimized for scalability and asynchronous processing. Here is a high-level overview of how the pieces fit together:

### 1. Reverse Proxy (Nginx)
All incoming traffic is first routed through a lightweight **Nginx** container acting as a reverse proxy on Port 80.
- **`/*`**: Routes standard web traffic to the **Next.js Frontend**.
- **`/api/*`**: Proxies RESTful API requests to the **Node.js Backend**.
- **`/ws`**: Handles WebSocket connections and upgrades, routing them to the Backend for real-time streaming.

### 2. Frontend (Next.js)
The client interface is built with **Next.js 14** using the App Router. It is designed to be fully decoupled from the backend. Instead of relying on statically baked API URLs, it dynamically constructs API endpoints relative to the current domain (`window.location`), making it completely environment-agnostic. 

### 3. Backend (Node.js & Express)
The core logic resides in a monolithic **Node.js** API using **Express** and **TypeScript**. 
- It handles user authentication, CRUD operations for assignments, and WebSocket connections for real-time status updates.
- **Database**: Uses **MongoDB** for persistent storage of assignments and generated question papers.

### 4. Background Workers (BullMQ)
Because generating AI assessments is a long-running, CPU-bound task, it cannot block the main API thread.
- When an assignment is created, the backend places a job onto a **Redis Queue** using **BullMQ**.
- A dedicated **Worker Container** (which shares the backend codebase but runs a different entrypoint) picks up the job asynchronously.
- As the worker processes the prompt using the **Gemini API**, it publishes status events back to Redis, which the backend then broadcasts to the frontend over WebSockets.

### 5. Data Layer (MongoDB & Redis)
- **MongoDB**: The primary source of truth.
- **Redis**: Serves as the high-speed message broker for BullMQ job queues and inter-process communication (IPC) for WebSockets. Both databases run in isolated Docker networks and are never exposed directly to the internet.

## Quick Start

### 1. Start MongoDB + Redis
```bash
docker-compose up -d
```

### 2. Start Backend
```bash
cd backend
cp .env.example .env   # Set your GEMINI_API_KEY or leave USE_MOCK_LLM=true
npm run dev            # Start API server
npm run dev:worker     # In another terminal, start job worker
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Features

- **Multi-step Assignment Form** — Upload material, set question config
- **AI Question Generation** — Gemini AI 
- **Real-time Updates** — WebSocket progress notifications
- **Structured Output** — Formal exam paper layout with sections, difficulty tags
- **PDF Download** — Export question paper as PDF
- **Regenerate** — Re-run generation with same config

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Zustand, CSS Modules |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (Mongoose) |
| Cache | Redis (ioredis) |
| Queue | BullMQ |
| Real-time | WebSocket (ws) |
| AI | Google Gemini (gemini-1.5-flash) |

## Environment Variables

### Backend `.env`
| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `MONGO_URI` | `mongodb://localhost:27017/vedaai` | MongoDB connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `GEMINI_API_KEY` | - | Google Gemini API key |
| `USE_MOCK_LLM` | `true` | Use mock generator instead of Gemini |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |
