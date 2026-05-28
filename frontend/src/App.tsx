/**
 * App — Helios-Watch Frontend
 *
 * Minimal root: BrowserRouter + session check + single route.
 * Dashboard is public — no ProtectedRoute, no login wall.
 */

import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { useAuthStore } from "./features/auth/authStore";

function AppContent() {
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    // Silently restore session from httpOnly cookie on page load.
    // Dashboard renders immediately regardless of session state.
    checkSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      <Route path="/" element={<DashboardPage view="live" />} />
      <Route path="/live" element={<DashboardPage view="live" />} />
      <Route path="/history" element={<DashboardPage view="history" />} />
      <Route path="/physics" element={<DashboardPage view="physics" />} />
      <Route path="/*" element={<DashboardPage view="live" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;