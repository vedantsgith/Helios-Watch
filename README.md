# ☀️ Helios-Watch: Solar Anomaly Monitoring Dashboard

Helios-Watch is a real-time space weather and solar anomaly monitoring system. It aggregates telemetry from NOAA space weather endpoints, filters for anomalies using a custom derivative engine, visualizes live data using an interactive 3D solar globe and dynamic charts, and provides instant browser-based alerts for critical events.

The project features a **FastAPI** backend and a **React (TypeScript + Vite + Zustand + Tailwind)** frontend, structured using clean, feature-driven architecture.

---

## 🏗️ Project Architecture

```
helios-watch/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers (auth, solar endpoints)
│   │   ├── core/         # Settings configuration and security helpers
│   │   ├── models/       # Pydantic schemas and SQLAlchemy DB models
│   │   ├── services/     # NOAA scraper, anomaly engine, simulation service
│   │   └── main.py       # FastAPI application entry point
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/          # Minimal router and application entry point
│   │   ├── components/   # Shared UI components (layout wrappers, Navbar)
│   │   ├── features/     # Feature modules (solar globes/charts, auth, alerts)
│   │   ├── hooks/        # Reusable React hooks (useWebSocket)
│   │   ├── store/        # Zustand stores for telemetry state
│   │   ├── services/     # Axios client and API wrappers
│   │   ├── types/        # TypeScript type interfaces
│   │   └── main.tsx
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## ⚡ Tech Stack

### Backend
* **Python 3.10+**
* **FastAPI** (High performance, async ASGI framework)
* **SQLAlchemy & SQLite** (User account storage)
* **JWT Authentication** (`python-jose` + `bcrypt` with HTTP-Only cookies)
* **WebSockets** (Real-time telemetry stream)

### Frontend
* **React 18** + **TypeScript** + **Vite**
* **Tailwind CSS** (Premium dark-theme styling)
* **Zustand** (Ultra-lightweight state management)
* **Recharts** (Interactive telemetry time-series charts)
* **React-Globe.gl** (Interactive WebGL 3D Solar & Earth visualization)

---

## 🔑 Key Features & Design Decisions

1. **Clean Feature-Driven Structure:** Code is organized by domain (`solar`, `auth`, `alerts`), improving code modularity and maintainability.
2. **Public-First Dashboard:** The dashboard is completely public at `/` by default. Anyone can view live telemetry and space weather.
3. **Optional JWT Authentication:**
   * Users can sign in via a sliding drawer modal in the Navbar.
   * Authentication uses **HTTP-Only cookies** containing securely signed JWTs (not readable by client-side Javascript, protecting against XSS).
4. **Logged-In Telemetry Alerts:**
   * Logged-in users can toggle the **bell icon** to enable anomaly alerts.
   * Real-time warnings (X-class flares, severe Kp-Index peaks) trigger instant browser push notifications or custom UI alert overlays.

---

## 🚀 Setup & Installation

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template and configure keys:
   ```bash
   copy .env.example .env
   # Or on macOS/Linux: cp .env.example .env
   ```
5. Start the backend:
   ```bash
   python -m uvicorn app.main:app --port 8001 --reload
   ```
   The backend server runs at `http://127.0.0.1:8001` and automatic API docs are available at `http://127.0.0.1:8001/docs`.

---

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template:
   ```bash
   copy .env.example .env
   # Or on macOS/Linux: cp .env.example .env
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser to view the application.

---

## 🧪 Simulation & Telemetry

To test the anomaly alerts, log in with an account, enable alerts via the bell icon, and use the **Judge Control Panel** on the Physics tab to trigger a simulated solar flare event (e.g., an X-class event). You will receive an instant dashboard alert and a browser push notification!