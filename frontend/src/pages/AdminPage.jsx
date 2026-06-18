import { useState } from "react";
import { MenuIcon, ShieldIcon } from "lucide-react";
import AdminSidebar from "../components/admin/AdminSidebar";
import DashboardView from "../components/admin/DashboardView";
import UsersView from "../components/admin/UsersView";
import GroupsView from "../components/admin/GroupsView";
import ModerationView from "../components/admin/ModerationView";
import SecurityView from "../components/admin/SecurityView";
import AuditLogsView from "../components/admin/AuditLogsView";
import SystemConfigView from "../components/admin/SystemConfigView";
import AnalyticsView from "../components/admin/AnalyticsView";
import BroadcastView from "../components/admin/BroadcastView";
import AutoModerationView from "../components/admin/AutoModerationView";
import MediaManagementView from "../components/admin/MediaManagementView";
import AppealsView from "../components/admin/AppealsView";
import AccountDeletionView from "../components/admin/AccountDeletionView";
import UsernameManagementView from "../components/admin/UsernameManagementView";
import VerificationManagementView from "../components/admin/VerificationManagementView";
import BannedUsersView from "../components/admin/BannedUsersView";
import DeviceManagementView from "../components/admin/DeviceManagementView";
import AdminManagementView from "../components/admin/AdminManagementView";

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardView />;
      case "users": return <UsersView />;
      case "usernames": return <UsernameManagementView />;
      case "verification": return <VerificationManagementView />;
      case "groups": return <GroupsView />;
      case "moderation": return <ModerationView />;
      case "automod": return <AutoModerationView />;
      case "security": return <SecurityView />;
      case "appeals": return <AppealsView />;
      case "account-deletions": return <AccountDeletionView />;
      case "banned": return <BannedUsersView />;
      case "devices": return <DeviceManagementView />;
      case "broadcasts": return <BroadcastView />;
      case "media": return <MediaManagementView />;
      case "analytics": return <AnalyticsView onTabChange={setActiveTab} />;
      case "audit": return <AuditLogsView />;
      case "settings": return <SystemConfigView />;
      case "admins": return <AdminManagementView />;
      default: return <DashboardView />;
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <div className="flex h-full bg-base-100 overflow-hidden relative">
      {/* ── Mobile Header ───────────────────────────────── */}
      <header className="lg:hidden absolute top-0 left-0 right-0 h-16 bg-base-200 border-b border-base-300 flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-2 text-primary">
          <ShieldIcon className="size-6 font-bold" />
          <span className="text-lg font-bold tracking-tight">Admin</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="btn btn-ghost btn-sm btn-circle"
        >
          <MenuIcon className="size-5" />
        </button>
      </header>

      {/* ── Sidebar Overlay (Mobile Only) ──────────────── */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-base-content/20 backdrop-blur-sm z-[45] lg:hidden transition-all animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* ── Main Canvas ────── */}
      <main className="flex-1 overflow-y-auto custom-scrollbar pt-16 lg:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24">
           {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
