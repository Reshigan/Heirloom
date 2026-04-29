import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SkipToContent, CreateFAB } from './components/ui';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Memories } from './pages/Memories';
import { Compose } from './pages/Compose';
import { Record } from './pages/Record';
import { Family } from './pages/Family';
import { Settings } from './pages/Settings';
import { Billing } from './pages/Billing';
import { Letters } from './pages/Letters';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Inherit } from './pages/Inherit';
import { NotFound } from './pages/NotFound';
import { Threads } from './pages/Threads';
import { ThreadDetail } from './pages/ThreadDetail';
import { Inbox } from './pages/Inbox';
import { Hearth } from './pages/Hearth';
import { CreatorProgram } from './pages/CreatorProgram';
import { Influencer } from './pages/Influencer';
import { Founder } from './pages/Founder';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function MobileFAB() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  
  const hiddenPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/', '/admin/login', '/admin/dashboard', '/compose', '/record', '/inbox', '/founder', '/creators'];
  const shouldHide = hiddenPaths.some(path => location.pathname === path || location.pathname.startsWith('/inherit/'))
    || location.pathname === '/threads' || location.pathname.startsWith('/threads/');
  
  if (!isAuthenticated || shouldHide) return null;
  
  const fabActions = [
    { id: 'memory', label: 'Add Memory', icon: 'camera', color: 'gold' as const, onClick: () => navigate('/memories') },
    { id: 'letter', label: 'Write Letter', icon: 'mail', color: 'blood' as const, onClick: () => navigate('/compose') },
    { id: 'voice', label: 'Record Voice', icon: 'mic', color: 'sanctuary-teal' as const, onClick: () => navigate('/record') },
    { id: 'family', label: 'Add Family', icon: 'users', color: 'sanctuary-blue' as const, onClick: () => navigate('/family') },
  ];
  
  return <CreateFAB actions={fabActions} />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SkipToContent />
          <MobileFAB />
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          {/* Hearth prototype — public for review only, not yet linked
              from primary nav. /hearth shows three sample family members
              + an auto-unfolding time-locked bundle. */}
          <Route path="/hearth" element={<Hearth />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/inherit/:token" element={<Inherit />} />
          {/* Public creator program — drives the influencer wedge described
              in marketing/PLAYBOOK.md §3 Loop A. */}
          <Route path="/creators" element={<CreatorProgram />} />
          {/* Founder pledge — first 100 families, $999 lifetime, funds the
              successor non-profit. See THREAD.md Pillar 5. */}
          <Route path="/founder" element={<Founder />} />
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
                    <Route
                      path="/forgot-password"
                      element={
                        <PublicRoute>
                          <ForgotPassword />
                        </PublicRoute>
                      }
                    />
                    <Route
                      path="/reset-password"
                      element={
                        <PublicRoute>
                          <ResetPassword />
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
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />
                    <Route
                      path="/letters"
                      element={
                        <ProtectedRoute>
                          <Letters />
                        </ProtectedRoute>
                      }
                    />
                    {/* The Family Thread — world-first multi-generational
                        archive primitive. See /THREAD.md. */}
                    <Route
                      path="/threads"
                      element={
                        <ProtectedRoute>
                          <Threads />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/threads/:id"
                      element={
                        <ProtectedRoute>
                          <ThreadDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/inbox"
                      element={
                        <ProtectedRoute>
                          <Inbox />
                        </ProtectedRoute>
                      }
                    />
                    {/* Influencer dashboard — for creators already in the
                        program. Public application surface is at /creators. */}
                    <Route
                      path="/influencer"
                      element={
                        <ProtectedRoute>
                          <Influencer />
                        </ProtectedRoute>
                      }
                    />
                                        {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Catch all - 404 page */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
