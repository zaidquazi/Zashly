import { Navigate } from "react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  AlertTriangle, 
  Settings, 
  LogOut,
  Menu,
  X,
  Shield
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import AdminDashboard from "../pages/admin/AdminDashboard.jsx";
import AdminUsers from "../pages/admin/AdminUsers.jsx";
import AdminReports from "../pages/admin/AdminReports.jsx";
import AdminContent from "../pages/admin/AdminContent.jsx";
import AdminSettings from "../pages/admin/AdminSettings.jsx";

const AdminLayout = ({ children }) => {
  const { authUser, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Check if user is admin
  if (!authUser || authUser.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      component: AdminDashboard
    },
    {
      id: "users",
      label: "User Management",
      icon: Users,
      component: AdminUsers
    },
    {
      id: "reports",
      label: "Reports & Complaints",
      icon: AlertTriangle,
      component: AdminReports
    },
    {
      id: "content",
      label: "Content Moderation",
      icon: FileText,
      component: AdminContent
    },
    {
      id: "settings",
      label: "System Settings",
      icon: Settings,
      component: AdminSettings
    }
  ];

  const CurrentPageComponent = menuItems.find(item => item.id === currentPage)?.component || AdminDashboard;

  return (
    <div className="min-h-screen bg-base-200">
      {/* Admin Header */}
      <div className="navbar bg-base-100 shadow-lg border-b border-base-300">
        <div className="flex-1">
          <button
            className="btn btn-ghost btn-square"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 ml-4">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-base-content">Admin Panel</span>
          </div>
        </div>
        
        <div className="flex-none">
          <div className="flex items-center gap-2">
            <div className="dropdown dropdown-end">
              <div className="avatar">
                <div className="w-10 h-10 rounded-full">
                  {authUser.profilePic ? (
                    <img src={authUser.profilePic} alt={authUser.fullName} />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {authUser.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-52">
                <div className="menu-title">
                  <p className="font-semibold">{authUser.fullName}</p>
                  <p className="text-xs text-base-content/70">{authUser.email}</p>
                  <div className="badge badge-primary badge-sm mt-1">Admin</div>
                </div>
                <div className="divider"></div>
                <li>
                  <button onClick={logout} className="text-error">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </li>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Admin Sidebar */}
        <motion.div
          initial={{ width: sidebarOpen ? 256 : 0 }}
          animate={{ width: sidebarOpen ? 256 : 0 }}
          className="bg-base-100 min-h-screen shadow-lg overflow-hidden"
        >
          <div className="p-4">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      currentPage === item.id
                        ? "bg-primary text-primary-content"
                        : "text-base-content hover:bg-base-200"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CurrentPageComponent />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
