import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router";

import { Toaster } from "react-hot-toast";

import PageLoader from "./components/PageLoader.jsx";
import RouteSeo from "./components/seo/RouteSeo.jsx";
import useAuthUser from "./hooks/useAuthUser.js";
import Layout from "./components/Layout.jsx";
import { useThemeStore } from "./store/useThemeStore.js";
import useNotifications from "./hooks/useNotifications.js";
import useGlobalAnnouncements from "./hooks/useGlobalAnnouncements.jsx";

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

  const onboardedHome = authUser && ["admin", "moderator", "owner"].includes(authUser.role) 
    ? "/admin" 
    : "/app";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnboarded;

  useNotifications();
  useGlobalAnnouncements();

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
    <div className="min-h-screen">
      <RouteSeo />

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

          {/* Authenticated app (noindex via RouteSeo) */}
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
              <Layout showSidebar={false}>
                <ChatPage />
              </Layout>
            )}
          />
          <Route
            path="/group/:groupId"
            element={authApp(
              <Layout showSidebar={false}>
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
      {isAuthenticated && isOnboarded && (
        <Suspense fallback={null}>
          <CallOverlay />
        </Suspense>
      )}
    </div>
  );
};

export default App;
