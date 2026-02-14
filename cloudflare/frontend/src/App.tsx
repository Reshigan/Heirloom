import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { CustomCursor } from './components/CustomCursor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EternalBackground } from './components/EternalBackground';
import { ComfortSettings, ComfortSettingsButton, getComfortPreferences, applyComfortPreferences } from './components/ComfortSettings';
import {
  isPushSupported,
  initializePushNotifications,
  onNotificationReceived,
  onNotificationAction,
  removePushNotificationListeners,
} from './services/pushNotificationService';

import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { NotFound } from './pages/NotFound';

const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Memories = lazy(() => import('./pages/Memories').then(m => ({ default: m.Memories })));
const Compose = lazy(() => import('./pages/Compose').then(m => ({ default: m.Compose })));
const Record = lazy(() => import('./pages/Record').then(m => ({ default: m.Record })));
const Family = lazy(() => import('./pages/Family').then(m => ({ default: m.Family })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Billing = lazy(() => import('./pages/Billing').then(m => ({ default: m.Billing })));
const Letters = lazy(() => import('./pages/Letters').then(m => ({ default: m.Letters })));
const AdminLogin = lazy(() => import('./pages/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Wrapped = lazy(() => import('./pages/Wrapped'));
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));
const Inherit = lazy(() => import('./pages/Inherit').then(m => ({ default: m.Inherit })));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail').then(m => ({ default: m.VerifyEmail })));
const FutureLetter = lazy(() => import('./pages/FutureLetter').then(m => ({ default: m.FutureLetter })));
const GiftPurchase = lazy(() => import('./pages/GiftPurchase').then(m => ({ default: m.GiftPurchase })));
const GiftRedeem = lazy(() => import('./pages/GiftRedeem').then(m => ({ default: m.GiftRedeem })));
const GiftSuccess = lazy(() => import('./pages/GiftSuccess').then(m => ({ default: m.GiftSuccess })));
const GoldLegacyRedeem = lazy(() => import('./pages/GoldLegacyRedeem').then(m => ({ default: m.GoldLegacyRedeem })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const LegacyPlan = lazy(() => import('./pages/LegacyPlan').then(m => ({ default: m.LegacyPlan })));
const StoryArtifact = lazy(() => import('./pages/StoryArtifact').then(m => ({ default: m.StoryArtifact })));
const LifeEvents = lazy(() => import('./pages/LifeEvents').then(m => ({ default: m.LifeEvents })));
const RecipientExperience = lazy(() => import('./pages/RecipientExperience').then(m => ({ default: m.RecipientExperience })));
const CreatorSignup = lazy(() => import('./pages/CreatorSignup').then(m => ({ default: m.CreatorSignup })));
const MemoryRoom = lazy(() => import('./pages/MemoryRoom').then(m => ({ default: m.MemoryRoom })));
const StoryView = lazy(() => import('./pages/StoryView').then(m => ({ default: m.StoryView })));
const PersonPage = lazy(() => import('./pages/PersonPage').then(m => ({ default: m.PersonPage })));
const QuickWizard = lazy(() => import('./pages/QuickWizard').then(m => ({ default: m.QuickWizard })));
const Streaks = lazy(() => import('./pages/Streaks').then(m => ({ default: m.Streaks })));
const Challenges = lazy(() => import('./pages/Challenges').then(m => ({ default: m.Challenges })));
const Referrals = lazy(() => import('./pages/Referrals').then(m => ({ default: m.Referrals })));
const GiftSubscriptions = lazy(() => import('./pages/GiftSubscriptions').then(m => ({ default: m.GiftSubscriptions })));
const Memorials = lazy(() => import('./pages/Memorials').then(m => ({ default: m.Memorials })));
const Milestones = lazy(() => import('./pages/Milestones').then(m => ({ default: m.Milestones })));
const MemoryCards = lazy(() => import('./pages/MemoryCards').then(m => ({ default: m.MemoryCards })));
const CardView = lazy(() => import('./pages/CardView').then(m => ({ default: m.CardView })));

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

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function PushNotificationHandler() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    if (!isAuthenticated || !isPushSupported()) {
      return;
    }
    
    initializePushNotifications();
    
    onNotificationReceived((notification) => {
      console.log('Notification received in foreground:', notification.title);
    });
    
    onNotificationAction((action) => {
      const data = action.notification.data as Record<string, string> | undefined;
      if (data?.route) {
        navigate(data.route);
      }
    });
    
    return () => {
      removePushNotificationListeners();
    };
  }, [isAuthenticated, navigate]);
  
  return null;
}

export default function App() {
  const [showComfortSettings, setShowComfortSettings] = useState(false);
  
  // Apply saved comfort preferences on app load
  useEffect(() => {
    const prefs = getComfortPreferences();
    applyComfortPreferences(prefs);
  }, []);
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <PushNotificationHandler />
                  <EternalBackground />
                  <CustomCursor />
          
          {/* Comfort Settings - accessible from any page */}
          <ComfortSettingsButton onClick={() => setShowComfortSettings(true)} />
          <ComfortSettings 
            isOpen={showComfortSettings} 
            onClose={() => setShowComfortSettings(false)} 
          />
          <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
          <Routes>
          {/* Public routes */}
                    <Route path="/" element={<Landing />} />
                              <Route path="/privacy" element={<Privacy />} />
                              <Route path="/terms" element={<Terms />} />
                              <Route path="/contact" element={<Contact />} />
                                                            <Route path="/creators" element={<CreatorSignup />} />
                                                            <Route path="/memory-room/:token" element={<MemoryRoom />} />
                                                            <Route path="/story/:token" element={<StoryView />} />
                                                            <Route path="/inherit/:token" element={<Inherit />} />
                              <Route path="/verify-email" element={<VerifyEmail />} />
                                                            <Route path="/gift" element={<GiftPurchase />} />
                                                            <Route path="/gift/redeem" element={<GiftRedeem />} />
                                                            <Route path="/gift/success" element={<GiftSuccess />} />
                                                            <Route path="/gold/redeem" element={<GoldLegacyRedeem />} />
                                                            <Route path="/card/:id" element={<CardView />} />
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
                      path="/person/:id"
                      element={
                        <ProtectedRoute>
                          <PersonPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/quick"
                      element={
                        <ProtectedRoute>
                          <QuickWizard />
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
                                        <Route
                                          path="/wrapped"
                                          element={
                                            <ProtectedRoute>
                                              <Wrapped />
                                            </ProtectedRoute>
                                          }
                                        />
                                                                                <Route
                                                                                  path="/future-letter"
                                                                                  element={
                                                                                    <ProtectedRoute>
                                                                                      <FutureLetter />
                                                                                    </ProtectedRoute>
                                                                                  }
                                                                                />
                                                                                <Route
                                                                                  path="/legacy-plan"
                                                                                  element={
                                                                                    <ProtectedRoute>
                                                                                      <LegacyPlan />
                                                                                    </ProtectedRoute>
                                                                                  }
                                                                                />
                                                                                <Route
                                                                                  path="/story-artifacts"
                                                                                  element={
                                                                                    <ProtectedRoute>
                                                                                      <StoryArtifact />
                                                                                    </ProtectedRoute>
                                                                                  }
                                                                                />
                                                                                <Route
                                                                                  path="/life-events"
                                                                                  element={
                                                                                    <ProtectedRoute>
                                                                                      <LifeEvents />
                                                                                    </ProtectedRoute>
                                                                                  }
                                                                                />
                                                                                                                                                                <Route
                                                                                                                                                                  path="/recipient-experience"
                                                                                                                                                                  element={
                                                                                                                                                                    <ProtectedRoute>
                                                                                                                                                                      <RecipientExperience />
                                                                                                                                                                    </ProtectedRoute>
                                                                                                                                                                  }
                                                                                                                                                                />

                                                                                                    {/* Q4 2025 Features */}
                                                                                                    <Route
                                                                                                      path="/streaks"
                                                                                                      element={
                                                                                                        <ProtectedRoute>
                                                                                                          <Streaks />
                                                                                                        </ProtectedRoute>
                                                                                                      }
                                                                                                    />
                                                                                                    <Route
                                                                                                      path="/challenges"
                                                                                                      element={
                                                                                                        <ProtectedRoute>
                                                                                                          <Challenges />
                                                                                                        </ProtectedRoute>
                                                                                                      }
                                                                                                    />
                                                                                                    <Route
                                                                                                      path="/referrals"
                                                                                                      element={
                                                                                                        <ProtectedRoute>
                                                                                                          <Referrals />
                                                                                                        </ProtectedRoute>
                                                                                                      }
                                                                                                    />
                                                                                                    <Route
                                                                                                      path="/gift-subscriptions"
                                                                                                      element={
                                                                                                        <ProtectedRoute>
                                                                                                          <GiftSubscriptions />
                                                                                                        </ProtectedRoute>
                                                                                                      }
                                                                                                    />
                                                                                                    <Route
                                                                                                      path="/memorials"
                                                                                                      element={
                                                                                                        <ProtectedRoute>
                                                                                                          <Memorials />
                                                                                                        </ProtectedRoute>
                                                                                                      }
                                                                                                    />
                                                                                                    <Route
                                                                                                      path="/milestones"
                                                                                                      element={
                                                                                                        <ProtectedRoute>
                                                                                                          <Milestones />
                                                                                                        </ProtectedRoute>
                                                                                                      }
                                                                                                    />
                                                                                                    <Route
                                                                                                      path="/memory-cards"
                                                                                                      element={
                                                                                                        <ProtectedRoute>
                                                                                                          <MemoryCards />
                                                                                                        </ProtectedRoute>
                                                                                                      }
                                                                                                    />

                                                                                                                                                                {/* Admin routes */}
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
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
