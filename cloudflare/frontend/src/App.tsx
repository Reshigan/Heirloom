import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { isNativePlatform } from './services/pushNotificationService';
import { clearChunkReloadFlag } from './lib/chunkReload';
import { PwaNudge } from './components/PwaNudge';
import { BottomNav } from './loom/components/BottomNav';
import { ClothBackdrop } from './loom/components/ClothBackdrop';
import { OfflineGate } from './pages/Offline';
import { useLoomTheme } from './loom/theme';

import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { NotFound } from './pages/NotFound';

const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const Compose = lazy(() => import('./pages/Compose').then(m => ({ default: m.Compose })));
const Record = lazy(() => import('./pages/Record').then(m => ({ default: m.Record })));
const PhotoQuick = lazy(() => import('./pages/PhotoQuick').then(m => ({ default: m.PhotoQuick })));
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
const MemoryCards = lazy(() => import('./pages/MemoryCards').then(m => ({ default: m.MemoryCards })));

// Heirloom v2 pages
const InterviewMode = lazy(() => import('./pages/InterviewMode').then(m => ({ default: m.InterviewMode })));
const TimeCapsulePage = lazy(() => import('./pages/TimeCapsule').then(m => ({ default: m.TimeCapsule })));
const MemoryMap = lazy(() => import('./pages/MemoryMap').then(m => ({ default: m.MemoryMap })));
const BookBuilder = lazy(() => import('./pages/BookBuilder').then(m => ({ default: m.BookBuilder })));
const BookSuccess = lazy(() => import('./pages/BookSuccess').then(m => ({ default: m.BookSuccess })));
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
const Join = lazy(() => import('./pages/Join').then(m => ({ default: m.Join })));

// Wave 1-3 routes
const Today           = lazy(() => import('./pages/Today').then(m => ({ default: m.Today })));
const Pricing         = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })));
const Showcase        = lazy(() => import('./pages/Showcase').then(m => ({ default: m.Showcase })));
const Onboarding      = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const InviteCard      = lazy(() => import('./pages/InviteCard').then(m => ({ default: m.InviteCard })));
const Memories        = lazy(() => import('./pages/Memories').then(m => ({ default: m.Memories })));

const ThreadsIndex    = lazy(() => import('./pages/ThreadsIndex').then(m => ({ default: m.ThreadsIndex })));
const PwaHome         = lazy(() => import('./pages/PwaHome').then(m => ({ default: m.PwaHome })));
const LoomIndex       = lazy(() => import('./pages/LoomIndex').then(m => ({ default: m.LoomIndex })));
const InheritanceCard = lazy(() => import('./pages/InheritanceCard').then(m => ({ default: m.InheritanceCard })));

// Book + scenario pages
const BookPage              = lazy(() => import('./pages/BookPage').then(m => ({ default: m.BookPage })));
const ScenarioWeddingDay    = lazy(() => import('./pages/ScenarioPages').then(m => ({ default: m.ScenarioWeddingDay })));
const ScenarioEighteenth    = lazy(() => import('./pages/ScenarioPages').then(m => ({ default: m.ScenarioEighteenthBirthday })));
const ScenarioAfterIGo      = lazy(() => import('./pages/ScenarioPages').then(m => ({ default: m.ScenarioAfterIGo })));
const ScenarioGrandchildren = lazy(() => import('./pages/ScenarioPages').then(m => ({ default: m.ScenarioFutureGrandchildren })));
const ScenarioVoiceUnborn   = lazy(() => import('./pages/ScenarioPages').then(m => ({ default: m.ScenarioVoiceForTheUnborn })));

// The Loom — the live marketing + design system.
// See cloudflare/frontend/src/loom/DESIGN.md.
const LoomThreshold = lazy(() => import('./pages/Threshold').then(m => ({ default: m.Threshold })));
const LoomWeft = lazy(() => import('./pages/Weft').then(m => ({ default: m.Weft })));
const LoomTiedOff = lazy(() => import('./pages/TiedOff').then(m => ({ default: m.TiedOff })));
const LoomUnlock = lazy(() => import('./pages/Unlock').then(m => ({ default: m.Unlock })));
const LoomEcho = lazy(() => import('./pages/Echo').then(m => ({ default: m.Echo })));
const LoomReadingRoom = lazy(() => import('./pages/ReadingRoom').then(m => ({ default: m.ReadingRoom })));
const LoomConstellation = lazy(() => import('./pages/Constellation').then(m => ({ default: m.Constellation })));
const LoomMarketing = lazy(() => import('./pages/Marketing').then(m => ({ default: m.Marketing })));
const LoomLetterRoom = lazy(() => import('./pages/LetterRoom').then(m => ({ default: m.LetterRoom })));
const LoomVoiceRoom = lazy(() => import('./pages/VoiceRoom').then(m => ({ default: m.VoiceRoom })));
const LoomComposeLetter = lazy(() => import('./pages/ComposeLetter').then(m => ({ default: m.ComposeLetter })));

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

function AdminRoute({ children }: { children: React.ReactNode }) {
  const hasToken = Boolean(localStorage.getItem('adminToken') && localStorage.getItem('adminUser'));
  return hasToken ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  if (!_hasHydrated) return <div style={{ minHeight: '100vh', backgroundColor: 'var(--ink)' }} />;
  if (isAuthenticated) {
    // Honor a ?redirect= param so gift/redeem flows land on the right page after login.
    // Sanitize to prevent open redirect: only allow same-origin paths (start with /,
    // but not //).
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('redirect') || '/loom';
    const to = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/loom';
    return <Navigate to={to} replace />;
  }
  return <>{children}</>;
}

const PENDING_INVITE_KEY = 'hl-pending-invite';

function PendingInviteAcceptor() {
  const { user, isAuthenticated } = useAuthStore();
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const code = localStorage.getItem(PENDING_INVITE_KEY);
    if (!code) return;
    // Only remove the code after the API call succeeds; on failure it stays
    // in localStorage and will be retried on the next load.
    import('./services/api').then(({ engagementApi }) => {
      engagementApi.acceptFamilyInvite(code)
        .then(() => {
          localStorage.removeItem(PENDING_INVITE_KEY);
        })
        .catch((err) => {
          console.error('Failed to accept family invite:', err);
        });
    });
  }, [isAuthenticated, user]);
  return null;
}

function PushNotificationHandler() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !isNativePlatform()) return;

    let cleanup: (() => void) | undefined;
    import('./services/pushNotificationService').then(
      ({ isPushSupported, initializePushNotifications, onNotificationReceived, onNotificationAction, removePushNotificationListeners }) => {
        if (!isPushSupported()) return;
        initializePushNotifications();
        onNotificationReceived(() => {});
        onNotificationAction((action) => {
          const data = action.notification.data as { route?: string } | undefined;
          if (data?.route) navigate(data.route);
        });
        cleanup = removePushNotificationListeners;
      }
    );
    return () => cleanup?.();
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
    <div className="loom" data-theme={theme} style={{ minHeight: '100vh', position: 'relative', background: 'var(--ink)' }}>
      {/* Global cloth substrate — the animated tapestry behind every screen,
          mounted once so there is a single WebGL context for the whole app. */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {/* ClothBackdrop owns its own theme-aware legibility scrim (layered
            below the ambient dye sparks) so the living colour stays visible. */}
        <ClothBackdrop opacity={0.42} threadOpacity={0.55} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <Suspense
          fallback={<div style={{ minHeight: '100vh' }} />}
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  // Clear the chunk-reload flag once the app has mounted successfully so
  // a future redeploy can recover stale tabs (see lib/chunkReload.ts).
  useEffect(() => {
    clearChunkReloadFlag();
  }, []);

  // Clear the React Query cache when logout fires so stale user data is not
  // served to the next account on a shared device (F6).
  useEffect(() => {
    const handler = () => queryClient.clear();
    window.addEventListener('heirloom-logout', handler);
    return () => window.removeEventListener('heirloom-logout', handler);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <PushNotificationHandler />
          <PendingInviteAcceptor />
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
                                                            <Route path="/join" element={<Join />} />
                                                            <Route path="/gift/redeem" element={<GiftRedeem />} />
                                                            <Route path="/gift/success" element={<GiftSuccess />} />
                                                            <Route path="/gold/redeem" element={<GoldLegacyRedeem />} />
                                                            <Route path="/card/:id" element={<CardView />} />
          <Route path="/gift-memory/:token" element={<GiftReceive />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/showcase" element={<Showcase />} />
          <Route path="/inheritance/:token" element={<InheritanceCard />} />
          <Route path="/book" element={<ProtectedRoute><BookPage /></ProtectedRoute>} />
          <Route path="/for/wedding-day" element={<ScenarioWeddingDay />} />
          <Route path="/for/eighteenth-birthday" element={<ScenarioEighteenth />} />
          <Route path="/for/after-i-go" element={<ScenarioAfterIGo />} />
          <Route path="/for/grandchildren" element={<ScenarioGrandchildren />} />
          <Route path="/for/voice-for-the-unborn" element={<ScenarioVoiceUnborn />} />
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
            path="/photo"
            element={
              <ProtectedRoute>
                <PhotoQuick />
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
                                                                                                      element={<ProtectedRoute><MemoryCards /></ProtectedRoute>}
                                                                                                    />

                                                                                                    {/* Heirloom v2 Protected Routes */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
          <Route path="/ask" element={<ProtectedRoute><QandA /></ProtectedRoute>} />
          <Route path="/qa" element={<Navigate to="/ask" replace />} />
          <Route path="/invite" element={<ProtectedRoute><InviteCard /></ProtectedRoute>} />
          <Route path="/interview" element={<ProtectedRoute><InterviewMode /></ProtectedRoute>} />
          <Route path="/time-capsules" element={<ProtectedRoute><TimeCapsulePage /></ProtectedRoute>} />
          <Route path="/memory-map" element={<ProtectedRoute><MemoryMap /></ProtectedRoute>} />
          <Route path="/book-builder" element={<ProtectedRoute><BookBuilder /></ProtectedRoute>} />
          <Route path="/book-builder/success" element={<BookSuccess />} />
          <Route path="/family-feed" element={<ProtectedRoute><FamilyFeed /></ProtectedRoute>} />
          <Route path="/on-this-day" element={<ProtectedRoute><OnThisDay /></ProtectedRoute>} />
          <Route path="/gift-a-memory" element={<ProtectedRoute><GiftAMemory /></ProtectedRoute>} />
          <Route path="/threads" element={<ProtectedRoute><ThreadsIndex /></ProtectedRoute>} />
          <Route path="/threads/:id" element={<ProtectedRoute><ThreadDetail /></ProtectedRoute>} />
          <Route path="/threads/:id/compose" element={<ProtectedRoute><ThreadCompose /></ProtectedRoute>} />
          <Route path="/letters/new" element={<Navigate to="/compose" replace />} />

                                                                                                                                                                {/* Admin routes */}
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          {/* The Loom — the live marketing + canonical design system.
              AI as invisible shuttle. Marketing is mounted at / (above);
              the eight-screen demo lives here. */}
          <Route path="/loom" element={<LoomThreshold />} />
          <Route path="/loom/today" element={<ProtectedRoute><Today /></ProtectedRoute>} />
          <Route path="/loom/pwa"   element={<PwaHome />} />
          <Route path="/loom/index" element={<ProtectedRoute><LoomIndex /></ProtectedRoute>} />
          <Route path="/loom/weft" element={<ProtectedRoute><LoomWeft /></ProtectedRoute>} />
          <Route path="/loom/compose" element={<Navigate to="/compose" replace />} />
          <Route path="/loom/tied" element={<ProtectedRoute><LoomTiedOff /></ProtectedRoute>} />
          <Route path="/loom/unlock" element={<ProtectedRoute><LoomUnlock /></ProtectedRoute>} />
          <Route path="/loom/echo" element={<LoomEcho />} />
          <Route path="/loom/read" element={<LoomReadingRoom />} />
          <Route path="/loom/kin" element={<ProtectedRoute><LoomConstellation /></ProtectedRoute>} />
          <Route path="/loom/marketing" element={<LoomMarketing />} />
          <Route path="/loom/letter" element={<ProtectedRoute><LoomLetterRoom /></ProtectedRoute>} />
          <Route path="/loom/voice" element={<ProtectedRoute><LoomVoiceRoom /></ProtectedRoute>} />
          <Route path="/loom/compose-letter" element={<ProtectedRoute><LoomComposeLetter /></ProtectedRoute>} />

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
