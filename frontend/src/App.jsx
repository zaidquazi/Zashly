import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";

import { Toaster } from "react-hot-toast";
import { SpeedInsights } from "@vercel/speed-insights/react";

import PageLoader from "./components/PageLoader.jsx";
import RouteSeo from "./components/seo/RouteSeo.jsx";
import useAuthUser from "./hooks/useAuthUser.js";
import Layout from "./components/Layout.jsx";
import { useThemeStore } from "./store/useThemeStore.js";
import useNotifications from "./hooks/useNotifications.js";
import useGlobalAnnouncements from "./hooks/useGlobalAnnouncements.jsx";
import useViewportHeight from "./hooks/useViewportHeight.js";
import useAndroidBackButton from "./hooks/useAndroidBackButton.js";
import NetworkStatusBar from "./components/NetworkStatusBar.jsx";
import { registerNavigate } from "./lib/navigation.js";
import { isNative, isAndroid } from "./lib/platform.js";

const CallOverlay = lazy(() =>
  import("./features/calls/index.jsx").then((m) => ({ default: m.CallOverlay }))
);
import "./features/calls/call-ui.css";

// Eager — small, frequently used
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";

// Lazy — heavy or marketing pages
const LandingPage = lazy(() => import("./pages/public/LandingPage.jsx"));
const FeaturesPage = lazy(() => import("./pages/public/FeaturesPage.jsx"));
const AboutPage = lazy(() => import("./pages/public/AboutPage.jsx"));
const PrivacyPolicyPage = lazy(() => import("./pages/public/PrivacyPolicyPage.jsx"));
const TermsPage = lazy(() => import("./pages/public/TermsPage.jsx"));
const FriendsPage = lazy(() => import("./pages/FriendsPage.jsx"));
const GroupsPage = lazy(() => import("./pages/GroupsPage.jsx"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage.jsx"));
const ChatPage = lazy(() => import("./pages/ChatPage.jsx"));
const GroupChatPage = lazy(() => import("./pages/GroupChatPage.jsx"));
const SettingsPage = lazy(() => import("./pages/SettingsPage.jsx"));
const CallHistoryPage = lazy(() => import("./pages/CallHistoryPage.jsx"));
const CallPage = lazy(() => import("./pages/CallPage.jsx"));
const GroupCallPage = lazy(() => import("./pages/GroupCallPage.jsx"));
const EditProfilePage = lazy(() => import("./pages/EditProfilePage.jsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));

const App = () => {
  const { isLoading, authUser } = useAuthUser();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  // Register global navigate so non-React contexts can navigate without window.location.href
  useEffect(() => {
    registerNavigate(navigate);
  }, [navigate]);

  const onboardedHome = authUser && ["admin", "moderator", "owner"].includes(authUser.role)
    ? "/admin"
    : "/app";

  // Apply DaisyUI theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // ── Android / Capacitor native setup ──────────────────────────────────────
  useEffect(() => {
    if (!isNative()) return;

    const setupNative = async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#0f172a" });

        document.body.classList.add("capacitor-native");
        if (isAndroid()) document.body.classList.add("capacitor-android");
      } catch (err) {
        console.warn("[App] StatusBar setup failed:", err.message);
      }
    };

    setupNative();
  }, []);

  // ── Hide SplashScreen after app is ready ──────────────────────────────────
  useEffect(() => {
    if (!isNative() || isLoading) return;

    const hideSplash = async () => {
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide({ fadeOutDuration: 300 });
      } catch (err) {
        console.warn("[App] SplashScreen hide failed:", err.message);
      }
    };

    const t = setTimeout(hideSplash, 200);
    return () => clearTimeout(t);
  }, [isLoading]);

  // ── Push notifications (after auth) ───────────────────────────────────────
  useEffect(() => {
    if (!isNative() || !authUser?._id) return;

    const setupPush = async () => {
      try {
        const { registerPushNotifications } = await import("./lib/pushNotifications.js");
        await registerPushNotifications(authUser._id, null);
      } catch (err) {
        console.warn("[App] Push notification setup failed:", err.message);
      }
    };

    setupPush();
  }, [authUser?._id]);

  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnboarded;

  useNotifications();
  useGlobalAnnouncements();
  useViewportHeight();
  useAndroidBackButton();

  useEffect(() => {
    if (isAuthenticated && isOnboarded) {
      document.body.classList.add("h-screen", "overflow-hidden");
    } else {
      document.body.classList.remove("h-screen", "overflow-hidden");
    }
    return () => {
      document.body.classList.remove("h-screen", "overflow-hidden");
    };
  }, [isAuthenticated, isOnboarded]);

  if (isLoading) return <PageLoader />;

  const authApp = (child) =>
    isAuthenticated && isOnboarded ? (
      child
    ) : (
      <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} replace />
    );

  return (
    <div className="min-h-[100dvh]" style={{ minHeight: "var(--app-height, 100dvh)" }}>
      <RouteSeo />

      {/* Offline indicator */}
      <NetworkStatusBar />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public marketing & legal */}
          <Route
            path="/"
            element={
              isAuthenticated && isOnboarded ? (
                <Navigate to={onboardedHome} replace />
              ) : (
                <LandingPage />
              )
            }
          />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Auth */}
          <Route
            path="/signup"
            element={
              !isAuthenticated ? (
                <SignUpPage />
              ) : (
                <Navigate to={isOnboarded ? onboardedHome : "/onboarding"} replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <LoginPage />
              ) : (
                <Navigate to={isOnboarded ? onboardedHome : "/onboarding"} replace />
              )
            }
          />
          <Route
            path="/onboarding"
            element={
              isAuthenticated ? (
                !isOnboarded ? (
                  <OnboardingPage />
                ) : (
                  <Navigate to={onboardedHome} replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Authenticated app */}
          <Route
            path="/app"
            element={authApp(
              <Layout showSidebar={true}>
                <HomePage />
              </Layout>
            )}
          />
          <Route
            path="/friends"
            element={authApp(
              <Layout showSidebar={true}>
                <FriendsPage />
              </Layout>
            )}
          />
          <Route
            path="/groups"
            element={authApp(
              <Layout showSidebar={true}>
                <GroupsPage />
              </Layout>
            )}
          />
          <Route
            path="/notifications"
            element={authApp(
              <Layout showSidebar={true}>
                <NotificationsPage />
              </Layout>
            )}
          />
          <Route
            path="/chat/:id"
            element={authApp(
              <Layout showSidebar={false} showNavbar={false}>
                <ChatPage />
              </Layout>
            )}
          />
          <Route
            path="/group/:groupId"
            element={authApp(
              <Layout showSidebar={false} showNavbar={false}>
                <GroupChatPage />
              </Layout>
            )}
          />
          <Route
            path="/edit-profile"
            element={authApp(
              <Layout showSidebar={true}>
                <EditProfilePage />
              </Layout>
            )}
          />
          <Route
            path="/admin"
            element={
              isAuthenticated && isOnboarded ? (
                ["admin", "moderator", "owner"].includes(authUser?.role) ? (
                  <Layout showSidebar={false}>
                    <AdminPage />
                  </Layout>
                ) : (
                  <Navigate to={onboardedHome} replace />
                )
              ) : (
                <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} replace />
              )
            }
          />
          <Route
            path="/settings"
            element={authApp(
              <Layout showSidebar={true}>
                <SettingsPage />
              </Layout>
            )}
          />
          <Route
            path="/calls"
            element={authApp(
              <Layout showSidebar={true}>
                <CallHistoryPage />
              </Layout>
            )}
          />
          <Route
            path="/call/:userId"
            element={authApp(<CallPage />)}
          />
          <Route
            path="/group-call/:groupId"
            element={authApp(<GroupCallPage />)}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <Toaster />
      <audio id="global-notification-sound" src="/notification.wav" preload="auto" />
      {isAuthenticated && isOnboarded && (
        <Suspense fallback={null}>
          <CallOverlay />
        </Suspense>
      )}
      <SpeedInsights />
    </div>
  );
};

export default App;
