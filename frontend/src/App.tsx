import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SkipToContent, CreateFAB } from './components/ui';

// EAGER (first paint, critical path) — import inline.
import { Landing } from './pages/Landing';
import { NotFound } from './pages/NotFound';

// LAZY (everything else) — split into per-route chunks. The first paint
// of `/` ships only Landing + framework. Logged-in surfaces and the
// Hearth (which carries the canvas particle system) load on demand.
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Signup = lazy(() => import('./pages/Signup').then((m) => ({ default: m.Signup })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Memories = lazy(() => import('./pages/Memories').then((m) => ({ default: m.Memories })));
const Compose = lazy(() => import('./pages/Compose').then((m) => ({ default: m.Compose })));
const Record = lazy(() => import('./pages/Record').then((m) => ({ default: m.Record })));
const Family = lazy(() => import('./pages/Family').then((m) => ({ default: m.Family })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Billing = lazy(() => import('./pages/Billing').then((m) => ({ default: m.Billing })));
const Letters = lazy(() => import('./pages/Letters').then((m) => ({ default: m.Letters })));
const AdminLogin = lazy(() => import('./pages/AdminLogin').then((m) => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const Privacy = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then((m) => ({ default: m.Terms })));
const Inherit = lazy(() => import('./pages/Inherit').then((m) => ({ default: m.Inherit })));
const Threads = lazy(() => import('./pages/Threads').then((m) => ({ default: m.Threads })));
const ThreadDetail = lazy(() => import('./pages/ThreadDetail').then((m) => ({ default: m.ThreadDetail })));
const Inbox = lazy(() => import('./pages/Inbox').then((m) => ({ default: m.Inbox })));
const Hearth = lazy(() => import('./pages/Hearth').then((m) => ({ default: m.Hearth })));
const CreatorProgram = lazy(() => import('./pages/CreatorProgram').then((m) => ({ default: m.CreatorProgram })));
const Influencer = lazy(() => import('./pages/Influencer').then((m) => ({ default: m.Influencer })));
const Founder = lazy(() => import('./pages/Founder').then((m) => ({ default: m.Founder })));
const FounderWelcome = lazy(() => import('./pages/FounderWelcome').then((m) => ({ default: m.FounderWelcome })));

// Minimal fallback shown while a chunk loads. Matches the page's warm
// near-black surface so there's no flash of light.
function RouteFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#0e0e0c' }}
      aria-hidden
    />
  );
}

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
          <Suspense fallback={<RouteFallback />}>
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
          {/* Post-Stripe-checkout landing — public so Stripe's redirect
              doesn't bounce off auth. Polls /api/founders/by-session
              until the webhook flips the row to PAID. */}
          <Route path="/founder/welcome" element={<FounderWelcome />} />
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
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
