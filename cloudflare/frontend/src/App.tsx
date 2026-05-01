import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
// CustomCursor removed per v2 spec (accessibility)
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
const Founder = lazy(() => import('./pages/Founder').then(m => ({ default: m.Founder })));
const FounderWelcome = lazy(() => import('./pages/FounderWelcome').then(m => ({ default: m.FounderWelcome })));
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

// Heirloom v2 pages
const OnboardingWizardPage = lazy(() => import('./pages/OnboardingWizardPage').then(m => ({ default: m.OnboardingWizardPage })));
const InterviewMode = lazy(() => import('./pages/InterviewMode').then(m => ({ default: m.InterviewMode })));
const TimeCapsulePage = lazy(() => import('./pages/TimeCapsule').then(m => ({ default: m.TimeCapsule })));
const MemoryMap = lazy(() => import('./pages/MemoryMap').then(m => ({ default: m.MemoryMap })));
const BookBuilder = lazy(() => import('./pages/BookBuilder').then(m => ({ default: m.BookBuilder })));
const FamilyFeed = lazy(() => import('./pages/FamilyFeed').then(m => ({ default: m.FamilyFeed })));
const OnThisDay = lazy(() => import('./pages/OnThisDay').then(m => ({ default: m.OnThisDay })));
const StoryWorthAlternative = lazy(() => import('./pages/StoryWorthAlternative').then(m => ({ default: m.StoryWorthAlternative })));
const GiftAMemory = lazy(() => import('./pages/GiftAMemory').then(m => ({ default: m.GiftAMemory })));
const GiftReceive = lazy(() => import('./pages/GiftReceive').then(m => ({ default: m.GiftReceive })));
const Threads = lazy(() => import('./pages/Threads').then(m => ({ default: m.Threads })));
const ThreadDetail = lazy(() => import('./pages/ThreadDetail').then(m => ({ default: m.ThreadDetail })));
const ThreadCompose = lazy(() => import('./pages/ThreadCompose').then(m => ({ default: m.ThreadCompose })));

// v3 redesign — parallel route tree. See cloudflare/frontend/src/v3/DESIGN.md
const V3Landing = lazy(() => import('./v3/pages/Landing').then(m => ({ default: m.Landing })));
const V3Sitemap = lazy(() => import('./v3/pages/Sitemap').then(m => ({ default: m.Sitemap })));
const V3Founder = lazy(() => import('./v3/pages/Founder').then(m => ({ default: m.Founder })));
const V3FounderWelcome = lazy(() => import('./v3/pages/FounderWelcome').then(m => ({ default: m.FounderWelcome })));
const V3Login = lazy(() => import('./v3/pages/Login').then(m => ({ default: m.Login })));
const V3Signup = lazy(() => import('./v3/pages/Signup').then(m => ({ default: m.Signup })));
const V3ComingSoon = lazy(() => import('./v3/pages/ComingSoon').then(m => ({ default: m.ComingSoon })));
const V3Home = lazy(() => import('./v3/pages/Home').then(m => ({ default: m.Home })));
const V3Thread = lazy(() => import('./v3/pages/Thread').then(m => ({ default: m.Thread })));
const V3Threads = lazy(() => import('./v3/pages/Threads').then(m => ({ default: m.Threads })));
const V3Memories = lazy(() => import('./v3/pages/Memories').then(m => ({ default: m.Memories })));
const V3Letters = lazy(() => import('./v3/pages/Letters').then(m => ({ default: m.Letters })));
const V3Voice = lazy(() => import('./v3/pages/Voice').then(m => ({ default: m.Voice })));
const V3FamilyFeed = lazy(() => import('./v3/pages/FamilyFeed').then(m => ({ default: m.FamilyFeed })));
const V3OnThisDay = lazy(() => import('./v3/pages/OnThisDay').then(m => ({ default: m.OnThisDay })));
const V3Family = lazy(() => import('./v3/pages/Family').then(m => ({ default: m.Family })));
const V3Successors = lazy(() => import('./v3/pages/Successors').then(m => ({ default: m.Successors })));
const V3Write = lazy(() => import('./v3/pages/Write').then(m => ({ default: m.Write })));
const V3Record = lazy(() => import('./v3/pages/Record').then(m => ({ default: m.Record })));
const V3Letter = lazy(() => import('./v3/pages/Letter').then(m => ({ default: m.Letter })));
const V3Capsule = lazy(() => import('./v3/pages/Capsule').then(m => ({ default: m.Capsule })));
const V3LifeEvents = lazy(() => import('./v3/pages/LifeEvents').then(m => ({ default: m.LifeEvents })));
const V3Milestones = lazy(() => import('./v3/pages/Milestones').then(m => ({ default: m.Milestones })));
const V3Memorials = lazy(() => import('./v3/pages/Memorials').then(m => ({ default: m.Memorials })));
const V3Artifacts = lazy(() => import('./v3/pages/Artifacts').then(m => ({ default: m.Artifacts })));
const V3Book = lazy(() => import('./v3/pages/Book').then(m => ({ default: m.Book })));
const V3Gift = lazy(() => import('./v3/pages/Gift').then(m => ({ default: m.Gift })));
const V3Cards = lazy(() => import('./v3/pages/Cards').then(m => ({ default: m.Cards })));
const V3Recipient = lazy(() => import('./v3/pages/Recipient').then(m => ({ default: m.Recipient })));
const V3Plan = lazy(() => import('./v3/pages/Plan').then(m => ({ default: m.Plan })));
const V3Streaks = lazy(() => import('./v3/pages/Streaks').then(m => ({ default: m.Streaks })));
const V3Wrapped = lazy(() => import('./v3/pages/Wrapped').then(m => ({ default: m.Wrapped })));
const V3Future = lazy(() => import('./v3/pages/Future').then(m => ({ default: m.Future })));
const V3Settings = lazy(() => import('./v3/pages/Settings').then(m => ({ default: m.Settings })));
const V3Billing = lazy(() => import('./v3/pages/Billing').then(m => ({ default: m.Billing })));
const V3Archive = lazy(() => import('./v3/pages/Archive').then(m => ({ default: m.Archive })));

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
  const { theme } = useThemeStore();
  
  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
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
                  {/* CustomCursor removed per v2 spec */}
          
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
                                                            <Route path="/founder" element={<Founder />} />
                                                            <Route path="/founder/welcome" element={<FounderWelcome />} />
                                                            <Route path="/memory-room/:token" element={<MemoryRoom />} />
                                                            <Route path="/story/:token" element={<StoryView />} />
                                                            <Route path="/inherit/:token" element={<Inherit />} />
                              <Route path="/verify-email" element={<VerifyEmail />} />
                                                            <Route path="/gift" element={<GiftPurchase />} />
                                                            <Route path="/gift/redeem" element={<GiftRedeem />} />
                                                            <Route path="/gift/success" element={<GiftSuccess />} />
                                                            <Route path="/gold/redeem" element={<GoldLegacyRedeem />} />
                                                            <Route path="/card/:id" element={<CardView />} />
          <Route path="/gift-memory/:token" element={<GiftReceive />} />
          <Route path="/compare/storyworth" element={<StoryWorthAlternative />} />
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

                                                                                                    {/* Heirloom v2 Protected Routes */}
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizardPage /></ProtectedRoute>} />
          <Route path="/interview" element={<ProtectedRoute><InterviewMode /></ProtectedRoute>} />
          <Route path="/time-capsules" element={<ProtectedRoute><TimeCapsulePage /></ProtectedRoute>} />
          <Route path="/memory-map" element={<ProtectedRoute><MemoryMap /></ProtectedRoute>} />
          <Route path="/book-builder" element={<ProtectedRoute><BookBuilder /></ProtectedRoute>} />
          <Route path="/family-feed" element={<ProtectedRoute><FamilyFeed /></ProtectedRoute>} />
          <Route path="/on-this-day" element={<ProtectedRoute><OnThisDay /></ProtectedRoute>} />
          <Route path="/gift-a-memory" element={<ProtectedRoute><GiftAMemory /></ProtectedRoute>} />
          <Route path="/threads" element={<ProtectedRoute><Threads /></ProtectedRoute>} />
          <Route path="/threads/:id" element={<ProtectedRoute><ThreadDetail /></ProtectedRoute>} />
          <Route path="/threads/:id/compose" element={<ProtectedRoute><ThreadCompose /></ProtectedRoute>} />

                                                                                                                                                                {/* Admin routes */}
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* v3 redesign prototype — light-mode-first, library-not-vault.
              See cloudflare/frontend/src/v3/DESIGN.md for the spec. */}
          <Route path="/v3" element={<V3Landing />} />
          <Route path="/v3/sitemap" element={<V3Sitemap />} />
          <Route path="/v3/founder" element={<V3Founder />} />
          <Route path="/v3/founder/welcome" element={<V3FounderWelcome />} />
          <Route path="/v3/login" element={<V3Login />} />
          <Route path="/v3/signup" element={<V3Signup />} />
          <Route path="/v3/forgot" element={<V3ComingSoon title="Forgot password" />} />
          {/* Reading */}
          <Route path="/v3/home" element={<V3Home />} />
          <Route path="/v3/thread" element={<V3Thread />} />
          <Route path="/v3/threads" element={<V3Threads />} />
          <Route path="/v3/memories" element={<V3Memories />} />
          <Route path="/v3/letters" element={<V3Letters />} />
          <Route path="/v3/voice" element={<V3Voice />} />
          <Route path="/v3/feed" element={<V3FamilyFeed />} />
          <Route path="/v3/onthisday" element={<V3OnThisDay />} />
          {/* Writing */}
          <Route path="/v3/write" element={<V3Write />} />
          <Route path="/v3/record" element={<V3Record />} />
          <Route path="/v3/letter" element={<V3Letter />} />
          <Route path="/v3/capsule" element={<V3Capsule />} />
          {/* People */}
          <Route path="/v3/family" element={<V3Family />} />
          <Route path="/v3/successors" element={<V3Successors />} />
          {/* Records */}
          <Route path="/v3/lifeevents" element={<V3LifeEvents />} />
          <Route path="/v3/milestones" element={<V3Milestones />} />
          <Route path="/v3/memorials" element={<V3Memorials />} />
          <Route path="/v3/artifacts" element={<V3Artifacts />} />
          <Route path="/v3/book" element={<V3Book />} />
          {/* Send */}
          <Route path="/v3/gift" element={<V3Gift />} />
          <Route path="/v3/cards" element={<V3Cards />} />
          <Route path="/v3/recipient" element={<V3Recipient />} />
          {/* Reflect */}
          <Route path="/v3/plan" element={<V3Plan />} />
          <Route path="/v3/streaks" element={<V3Streaks />} />
          <Route path="/v3/wrapped" element={<V3Wrapped />} />
          <Route path="/v3/future" element={<V3Future />} />
          {/* Account */}
          <Route path="/v3/settings" element={<V3Settings />} />
          <Route path="/v3/billing" element={<V3Billing />} />
          <Route path="/v3/archive" element={<V3Archive />} />

          {/* Catch all - 404 page */}
          <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
