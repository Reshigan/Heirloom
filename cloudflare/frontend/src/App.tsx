import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  isPushSupported,
  initializePushNotifications,
  onNotificationReceived,
  onNotificationAction,
  removePushNotificationListeners,
} from './services/pushNotificationService';
import { clearChunkReloadFlag } from './lib/chunkReload';
import { PwaNudge } from './components/PwaNudge';
import { BottomNav } from './loom/components/BottomNav';
import { OfflineGate } from './loom/pages/Offline';
import { useLoomTheme } from './loom/theme';
import './loom/styles/loom.css';
import './loom/styles/loom-bridge.css';

import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { NotFound } from './pages/NotFound';

const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
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
const ComposeLetter = lazy(() => import('./pages/ComposeLetter').then(m => ({ default: m.ComposeLetter })));
const GiftPurchase = lazy(() => import('./pages/GiftPurchase').then(m => ({ default: m.GiftPurchase })));
const GiftRedeem = lazy(() => import('./pages/GiftRedeem').then(m => ({ default: m.GiftRedeem })));
const GiftSuccess = lazy(() => import('./pages/GiftSuccess').then(m => ({ default: m.GiftSuccess })));
const GoldLegacyRedeem = lazy(() => import('./pages/GoldLegacyRedeem').then(m => ({ default: m.GoldLegacyRedeem })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const LegacyPlan = lazy(() => import('./pages/LegacyPlan').then(m => ({ default: m.LegacyPlan })));
const StoryArtifact = lazy(() => import('./pages/StoryArtifact').then(m => ({ default: m.StoryArtifact })));
const LifeEvents = lazy(() => import('./pages/LifeEvents').then(m => ({ default: m.LifeEvents })));
const RecipientExperience = lazy(() => import('./pages/RecipientExperience').then(m => ({ default: m.RecipientExperience })));
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
const CardView = lazy(() => import('./pages/CardView').then(m => ({ default: m.CardView })));

// Heirloom v2 pages
const InterviewMode = lazy(() => import('./pages/InterviewMode').then(m => ({ default: m.InterviewMode })));
const TimeCapsulePage = lazy(() => import('./pages/TimeCapsule').then(m => ({ default: m.TimeCapsule })));
const MemoryMap = lazy(() => import('./pages/MemoryMap').then(m => ({ default: m.MemoryMap })));
const BookBuilder = lazy(() => import('./pages/BookBuilder').then(m => ({ default: m.BookBuilder })));
const FamilyFeed = lazy(() => import('./pages/FamilyFeed').then(m => ({ default: m.FamilyFeed })));
const OnThisDay = lazy(() => import('./pages/OnThisDay').then(m => ({ default: m.OnThisDay })));
const GiftAMemory = lazy(() => import('./pages/GiftAMemory').then(m => ({ default: m.GiftAMemory })));
const GiftReceive = lazy(() => import('./pages/GiftReceive').then(m => ({ default: m.GiftReceive })));
const ThreadDetail = lazy(() => import('./pages/ThreadDetail').then(m => ({ default: m.ThreadDetail })));
const ThreadCompose = lazy(() => import('./pages/ThreadCompose').then(m => ({ default: m.ThreadCompose })));
const DailySentence = lazy(() => import('./pages/DailySentence').then(m => ({ default: m.DailySentence })));
const FoundersWall = lazy(() => import('./pages/FoundersWall').then(m => ({ default: m.FoundersWall })));
const Inbox = lazy(() => import('./pages/Inbox').then(m => ({ default: m.Inbox })));
const QandA = lazy(() => import('./pages/QandA').then(m => ({ default: m.QandA })));

// Wave 1-3 routes
const Today           = lazy(() => import('./loom/pages/Today').then(m => ({ default: m.Today })));
const Pricing         = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })));
const Showcase        = lazy(() => import('./pages/Showcase').then(m => ({ default: m.Showcase })));
const Onboarding      = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const InviteCard      = lazy(() => import('./pages/InviteCard').then(m => ({ default: m.InviteCard })));
const Memories        = lazy(() => import('./pages/Memories').then(m => ({ default: m.Memories })));
const QA              = lazy(() => import('./pages/QA').then(m => ({ default: m.QA })));
const ThreadsIndex    = lazy(() => import('./pages/ThreadsIndex').then(m => ({ default: m.ThreadsIndex })));
const PwaHome         = lazy(() => import('./loom/pages/PwaHome').then(m => ({ default: m.PwaHome })));
const InheritanceCard = lazy(() => import('./pages/InheritanceCard').then(m => ({ default: m.InheritanceCard })));

// The Loom — the live marketing + design system.
// See cloudflare/frontend/src/loom/DESIGN.md.
const LoomThreshold = lazy(() => import('./loom/pages/Threshold').then(m => ({ default: m.Threshold })));
const LoomWeft = lazy(() => import('./loom/pages/Weft').then(m => ({ default: m.Weft })));
const LoomComposer = lazy(() => import('./loom/pages/Composer').then(m => ({ default: m.Composer })));
const LoomTiedOff = lazy(() => import('./loom/pages/TiedOff').then(m => ({ default: m.TiedOff })));
const LoomUnlock = lazy(() => import('./loom/pages/Unlock').then(m => ({ default: m.Unlock })));
const LoomEcho = lazy(() => import('./loom/pages/Echo').then(m => ({ default: m.Echo })));
const LoomReadingRoom = lazy(() => import('./loom/pages/ReadingRoom').then(m => ({ default: m.ReadingRoom })));
const LoomConstellation = lazy(() => import('./loom/pages/Constellation').then(m => ({ default: m.Constellation })));
const LoomMarketing = lazy(() => import('./loom/pages/Marketing').then(m => ({ default: m.Marketing })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  if (!_hasHydrated) return <div style={{ minHeight: '100vh', backgroundColor: 'var(--ink)' }} />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  if (!_hasHydrated) return <div style={{ minHeight: '100vh', backgroundColor: 'var(--ink)' }} />;
  return !isAuthenticated ? <>{children}</> : <Navigate to="/loom/today" replace />;
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

/**
 * LoomShellRoot — the .loom[data-theme] wrapper around the entire app.
 *
 * Two effects:
 *   1. Establishes the Loom CSS variables (--loom-ink, --loom-bone,
 *      --loom-warm, …) on every page in the tree. The bridge in
 *      loom-bridge.css then re-themes legacy v1/v2 Tailwind utilities
 *      (bg-void, text-paper, font-body, .btn-primary, .card, …) to
 *      Loom values, so the entire app inherits the Loom palette and
 *      type without each page being rewritten.
 *   2. Drops the v1/v2 EternalBackground / ComfortSettings chrome
 *      entirely — the Loom is the canonical design now.
 *
 * Theme persists via useLoomTheme (localStorage key "heirloom-theme"),
 * so /loom/marketing's vault/paper toggle carries through to /dashboard
 * and back.
 */
function LoomShellRoot({ children }: { children: React.ReactNode }) {
  const { theme } = useLoomTheme();
  return (
    <div className="loom" data-theme={theme} style={{ minHeight: '100vh' }}>
      <Suspense
        fallback={<div style={{ minHeight: '100vh', backgroundColor: 'var(--ink)' }} />}
      >
        {children}
      </Suspense>
    </div>
  );
}

export default function App() {
  // Clear the chunk-reload flag once the app has mounted successfully so
  // a future redeploy can recover stale tabs (see lib/chunkReload.ts).
  useEffect(() => {
    clearChunkReloadFlag();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <PushNotificationHandler />
          <PwaNudge />
          <LoomShellRoot>
          <OfflineGate>
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<LoomMarketing />} />
                              <Route path="/daily" element={<DailySentence />} />
                              <Route path="/founders-wall" element={<FoundersWall />} />
                              <Route path="/privacy" element={<Privacy />} />
                              <Route path="/terms" element={<Terms />} />
                              <Route path="/contact" element={<Contact />} />
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
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/showcase" element={<Showcase />} />
          <Route path="/inheritance/:token" element={<InheritanceCard />} />
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
            element={<Navigate to="/loom/today" replace />}
          />
          <Route path="/memories" element={<ProtectedRoute><Memories /></ProtectedRoute>} />
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
                                                                                                      element={<Navigate to="/memories" replace />}
                                                                                                    />

                                                                                                    {/* Heirloom v2 Protected Routes */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
          <Route path="/ask" element={<ProtectedRoute><QandA /></ProtectedRoute>} />
          <Route path="/qa" element={<ProtectedRoute><QA /></ProtectedRoute>} />
          <Route path="/invite" element={<ProtectedRoute><InviteCard /></ProtectedRoute>} />
          <Route path="/interview" element={<ProtectedRoute><InterviewMode /></ProtectedRoute>} />
          <Route path="/time-capsules" element={<ProtectedRoute><TimeCapsulePage /></ProtectedRoute>} />
          <Route path="/memory-map" element={<ProtectedRoute><MemoryMap /></ProtectedRoute>} />
          <Route path="/book-builder" element={<ProtectedRoute><BookBuilder /></ProtectedRoute>} />
          <Route path="/family-feed" element={<ProtectedRoute><FamilyFeed /></ProtectedRoute>} />
          <Route path="/on-this-day" element={<ProtectedRoute><OnThisDay /></ProtectedRoute>} />
          <Route path="/gift-a-memory" element={<ProtectedRoute><GiftAMemory /></ProtectedRoute>} />
          <Route path="/threads" element={<ProtectedRoute><ThreadsIndex /></ProtectedRoute>} />
          <Route path="/threads/:id" element={<ProtectedRoute><ThreadDetail /></ProtectedRoute>} />
          <Route path="/threads/:id/compose" element={<ProtectedRoute><ThreadCompose /></ProtectedRoute>} />
          <Route path="/letters/new" element={<ProtectedRoute><ComposeLetter /></ProtectedRoute>} />

                                                                                                                                                                {/* Admin routes */}
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* The Loom — the live marketing + canonical design system.
              AI as invisible shuttle. Marketing is mounted at / (above);
              the eight-screen demo lives here. */}
          <Route path="/loom" element={<LoomThreshold />} />
          <Route path="/loom/today" element={<ProtectedRoute><Today /></ProtectedRoute>} />
          <Route path="/loom/pwa"   element={<ProtectedRoute><PwaHome /></ProtectedRoute>} />
          <Route path="/loom/weft" element={<ProtectedRoute><LoomWeft /></ProtectedRoute>} />
          <Route path="/loom/compose" element={<ProtectedRoute><LoomComposer /></ProtectedRoute>} />
          <Route path="/loom/tied" element={<ProtectedRoute><LoomTiedOff /></ProtectedRoute>} />
          <Route path="/loom/unlock" element={<LoomUnlock />} />
          <Route path="/loom/echo" element={<LoomEcho />} />
          <Route path="/loom/read" element={<LoomReadingRoom />} />
          <Route path="/loom/kin" element={<ProtectedRoute><LoomConstellation /></ProtectedRoute>} />
          <Route path="/loom/marketing" element={<LoomMarketing />} />

          {/* Catch all - 404 page */}
          <Route path="*" element={<NotFound />} />
          </Routes>
          </OfflineGate>
          <BottomNav />
          </LoomShellRoot>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
