import { Navigate, Route, Routes } from "react-router";
import { useEffect } from "react";

import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import GroupChatPage from "./pages/GroupChatPage.jsx";
import GroupsPage from "./pages/GroupsPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import FriendsPage from "./pages/FriendsPage.jsx";
import EditProfilePage from "./pages/EditProfilePage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import CallsPage from "./pages/CallsPage.jsx";

import { Toaster } from "react-hot-toast";

import PageLoader from "./components/PageLoader.jsx";
import useAuthUser from "./hooks/useAuthUser.js";
import Layout from "./components/Layout.jsx";
import { useThemeStore } from "./store/useThemeStore.js";
import useNotifications from "./hooks/useNotifications.js";
import useGlobalAnnouncements from "./hooks/useGlobalAnnouncements.jsx";
import CallProvider from "./components/CallProvider.jsx";

const App = () => {
  const { isLoading, authUser } = useAuthUser();
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnboarded;

  // 🔔 Global WhatsApp-style notifications (sound + browser push)
  useNotifications();

  // 📢 Global Admin Announcements
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

  return (
    <div className="min-h-screen">
      {/* 📞 Global Call Provider — handles incoming/outgoing calls app-wide */}
      {isAuthenticated && isOnboarded && <CallProvider />}

      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <HomePage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        {/* 👥 Friends */}
        <Route
          path="/friends"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <FriendsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        {/* 💬 Groups */}
        <Route
          path="/groups"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <GroupsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        {/* 📞 Calls */}
        <Route
          path="/calls"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <CallsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/signup"
          element={
            !isAuthenticated ? <SignUpPage /> : <Navigate to={isOnboarded ? "/" : "/onboarding"} />
          }
        />
        <Route
          path="/login"
          element={
            !isAuthenticated ? <LoginPage /> : <Navigate to={isOnboarded ? "/" : "/onboarding"} />
          }
        />
        <Route
          path="/notifications"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <NotificationsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/call/:id"
          element={
            isAuthenticated && isOnboarded ? (
              <CallPage />
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/chat/:id"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={false}>
                <ChatPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        {/* Group Chat */}
        <Route
          path="/group/:groupId"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={false}>
                <GroupChatPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        {/* Edit Profile */}
        <Route
          path="/edit-profile"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <EditProfilePage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
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
                <Navigate to="/" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 🛡️ Admin Panel */}
        <Route
          path="/admin"
          element={
            isAuthenticated && isOnboarded ? (
              authUser?.role === "admin" ? (
                <Layout showSidebar={true}>
                  <AdminPage />
                </Layout>
              ) : (
                <Navigate to="/" />
              )
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        {/* ⚙️ Settings Panel */}
        <Route
          path="/settings"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <SettingsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;
