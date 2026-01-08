import { useState, useEffect } from 'react';
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
import Wrapped from './pages/Wrapped';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Inherit } from './pages/Inherit';
import { NotFound } from './pages/NotFound';
import { VerifyEmail } from './pages/VerifyEmail';
import { FutureLetter } from './pages/FutureLetter';
import { GiftPurchase } from './pages/GiftPurchase';
import { GiftRedeem } from './pages/GiftRedeem';
import { GiftSuccess } from './pages/GiftSuccess';
import { GoldLegacyRedeem } from './pages/GoldLegacyRedeem';
import { Contact } from './pages/Contact';
import { LegacyPlan } from './pages/LegacyPlan';
import { StoryArtifact } from './pages/StoryArtifact';
import { LifeEvents } from './pages/LifeEvents';
import { RecipientExperience } from './pages/RecipientExperience';
import { CreatorSignup } from './pages/CreatorSignup';
import { MemoryRoom } from './pages/MemoryRoom';
import { StoryView } from './pages/StoryView';
import { PersonPage } from './pages/PersonPage';
import { QuickWizard } from './pages/QuickWizard';

// Q4 2025 Features
import { Streaks } from './pages/Streaks';
import { Challenges } from './pages/Challenges';
import { Referrals } from './pages/Referrals';
import { GiftSubscriptions } from './pages/GiftSubscriptions';
import { Memorials } from './pages/Memorials';
import { Milestones } from './pages/Milestones';

// Quick Wins Features
import { MemoryCards } from './pages/MemoryCards';
import { CardView } from './pages/CardView';

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
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
