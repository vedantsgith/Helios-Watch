# ☀ Helios-Watch
### Real-time Solar Anomaly Detector & Space Weather Defense System


*Helios-Watch* is a cutting-edge space weather monitoring dashboard that integrates real-time telemetry from NOAA satellites (DSCOVR, GOES-16) to predict and visualize solar threats. Designed for researchers, grid operators, and space enthusiasts.

---

##  Features

###  3D Planetary Visualization
- *Interactive Earth Globe*: Real-time visualization of the Earth's atmosphere reacting to solar wind.
- *Dynamic Atmosphere*: Changes color based on threat levels (Red for Flux, Purple for Geomagnetic Storms, Yellow for Radiation).
- *Solar Globe*: 3D representation of the Sun.

###  Physics & Threat Intelligence
- *Holographic HUD Database*: A sci-fi style "Tactical Display" explaining R-Scale, G-Scale, and S-Scale threats.
- *Hybrid Engine*: Combines real telemetry with predictive calculus (Derivative Engine) to forecast flare risks.
- *Real-time Telemetry*: Live feeds for:
  - *X-Ray Flux* (Solar Flares)
  - *Solar Wind Speed* (km/s)
  - *Kp Index* (Geomagnetic Storms)
  - *Proton Flux* (Radiation Storms)

###  Alert System
- *Full-Screen Visual Alerts*: "RED ALERT" style overlays for X-Class flares and G4/G5 storms.
- *Simulation Mode*: specific triggers to test system response (Simulate X-Class, Carrington Event, etc.).
- *Email Notifications*: Automated alerts for severe space weather events (Configurable).

### Historical Archives
- *Event Replay*: Reconstructs famous solar events (Carrington 1859, Halloween 2003, May 2024 Storm) using historical data profiles.
- *Data Analysis*: View past trends and statistics.

---

## Technology Stack

### Frontend (The Cockpit)
- *React 18* (Vite) - Ultra-fast UI rendering.
- *TypeScript* - Type-safe architecture.
- *Tailwind CSS* - Glassmorphism & Utility-first styling.
- *React-Globe.GL* - WebGL-based 3D planetary rendering.
- *Zustand* - State management.
- *Recharts* - Dynamic data charting.

### Backend (The Engine)
- *Python (FastAPI)* - High-performance async API.
- *WebSockets* - Real-time full-duplex communication.
- *AsyncIO* - Non-blocking data fetching from NOAA.
- *Pandas/NumPy* - Scientific data processing.

---

##  Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. clone the repository
bash
git clone https://github.com/vedantsgith/Helios-Watch.git
cd Helios-Watch


### 2. Backend Setup
Navigate to the backend folder and install dependencies:
bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate


pip install -r requirements.txt

Start the Server:
bash
python app.py



---

##  Environmental Variables (.env)

Create a .env file in the backend directory:
env
# Security
SECRET_KEY=your_super_secret_key_here

# Email Alerts (Optional)
EMAIL_SENDER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password


---

## 🕹 Simulation Controls
Access the *Judge Control Panel* (Right Sidebar) to simulate events:
- *Standard Flares*: Trigger M-Class or X-Class flares.
- *Historical Events*: Replay the "Carrington Event" or "Bastille Day Event".
- *Visual Tests*: Verify Red/Purple/Yellow alert states.

---

## 📜 License
This project is licensed under the MIT License - see the LICENSE file for details.

---
Built with ❤ by the Helios-Watch Team
