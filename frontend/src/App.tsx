import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { BrownieLogin } from './components/BrownieLogin';
import { useStore } from './store/useStore';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

// Configure Axios
const api = axios.create({
  baseURL: 'http://127.0.0.1:8001',
  withCredentials: true
});

// Protected Route Component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const user = useStore.getState().user;
  // If no user in store, we might still be loading or check cookie...
  // For this simple demo, we rely on the store having the user.
  // Ideally, we'd have a 'loading' state for auth check.

  // Actually, let's just do a simple check. If user is null, redirect to login.
  // NOTE: On refresh, store is wiped. We need to check /me on mount.
  // We'll handle that in the App component wrapper.

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function AppContent() {
  const [loading, setLoading] = useState(true);
  const setUser = useStore((state) => state.setUser);

  useEffect(() => {
    // Check if we have a session
    api.get('/api/auth/me')
      .then(res => {
        setUser(res.data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="animate-spin w-10 h-10 text-orange-500" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<BrownieLogin />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
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
