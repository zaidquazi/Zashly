import { 
  LayoutDashboardIcon, UsersIcon, MessageSquareIcon, ShieldAlertIcon, 
  ShieldCheckIcon, BarChart3Icon, Settings2Icon, HistoryIcon, ShieldIcon, 
  XIcon, MegaphoneIcon, FilterIcon, HardDriveIcon, KeyRoundIcon, Trash2Icon,
  TagIcon, CheckCircleIcon, BanIcon, SmartphoneIcon, CrownIcon
} from "lucide-react";
import { Link } from "react-router";

const ADMIN_MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { id: "users", label: "User Management", icon: UsersIcon },
  { id: "usernames", label: "Username Management", icon: TagIcon },
  { id: "verification", label: "Verification Management", icon: CheckCircleIcon },
  { id: "groups", label: "Groups & Chats", icon: MessageSquareIcon },
  { id: "moderation", label: "Moderation & Reports", icon: ShieldAlertIcon },
  { id: "automod", label: "Auto Moderation", icon: FilterIcon },
  { id: "security", label: "Security Center", icon: ShieldCheckIcon },
  { id: "appeals", label: "Password Appeals", icon: KeyRoundIcon },
  { id: "account-deletions", label: "Account Deletions", icon: Trash2Icon },
  { id: "banned", label: "Banned Users", icon: BanIcon },
  { id: "devices", label: "Device Management", icon: SmartphoneIcon },
  { id: "broadcasts", label: "Global Broadcasts", icon: MegaphoneIcon },
  { id: "media", label: "Media & Storage", icon: HardDriveIcon },
  { id: "analytics", label: "Analytics", icon: BarChart3Icon },
  { id: "audit", label: "Audit Logs", icon: HistoryIcon },
  { id: "settings", label: "App Settings", icon: Settings2Icon },
  { id: "admins", label: "Admin Management", icon: CrownIcon },
];

const AdminSidebar = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-64 bg-base-200 border-r border-base-300 flex flex-col h-full overflow-y-auto shadow-2xl lg:shadow-none">
      {/* Mobile Close Button (Hidden on Desktop) */}
      <div className="p-4 border-b border-base-300 flex justify-end lg:hidden">
        <button 
          onClick={() => onTabChange(activeTab)} 
          className="btn btn-ghost btn-sm btn-circle"
        >
           <XIcon className="size-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {ADMIN_MENU_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive 
                  ? "bg-primary text-primary-content shadow-lg shadow-primary/20" 
                  : "text-base-content/70 hover:bg-base-300 hover:text-base-content"}
              `}
            >
              <item.icon className={`size-4 ${isActive ? "opacity-100" : "opacity-60"}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-base-300">
        <div className="bg-base-300/50 rounded-xl p-3">
          <p className="text-[10px] uppercase font-bold text-base-content/40 tracking-wider mb-1">Status</p>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-semibold">System Optimal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
