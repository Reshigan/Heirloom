import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { CustomCursor } from './components/CustomCursor';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Memories } from './pages/Memories';
import { Compose } from './pages/Compose';
import { Record } from './pages/Record';
import { Family } from './pages/Family';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return null;
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CustomCursor />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/memories"
            element={
              <ProtectedRoute>
                <Memories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compose"
            element={
              <ProtectedRoute>
                <Compose />
              </ProtectedRoute>
            }
          />
          <Route
            path="/record"
            element={
              <ProtectedRoute>
                <Record />
              </ProtectedRoute>
            }
          />
          <Route
            path="/family"
            element={
              <ProtectedRoute>
                <Family />
              </ProtectedRoute>
            }
          />
          <Route
            path="/family/:id"
            element={
              <ProtectedRoute>
                <Family />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
