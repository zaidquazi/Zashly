import { LayoutDashboardIcon, UsersIcon, MessageSquareIcon, ShieldAlertIcon, ShieldCheckIcon, BarChart3Icon, Settings2Icon, HistoryIcon, ShieldIcon, XIcon, MegaphoneIcon, FilterIcon, HardDriveIcon, DatabaseIcon } from "lucide-react";

const ADMIN_MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { id: "broadcasts", label: "Global Broadcasts", icon: MegaphoneIcon },
  { id: "automod", label: "Auto-Moderation", icon: FilterIcon },
  { id: "users", label: "User Management", icon: UsersIcon },
  { id: "groups", label: "Groups & Chats", icon: MessageSquareIcon },
  { id: "moderation", label: "Moderation (Reports)", icon: ShieldAlertIcon },
  { id: "security", label: "Security & IP Ban", icon: ShieldCheckIcon },
  { id: "media", label: "Media & Storage", icon: HardDriveIcon },
  { id: "analytics", label: "Analytics", icon: BarChart3Icon },
  { id: "audit", label: "Audit Logs", icon: HistoryIcon },
  { id: "compliance", label: "Data & GDPR", icon: DatabaseIcon },
  { id: "settings", label: "App Settings", icon: Settings2Icon },
];

const AdminSidebar = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-64 bg-base-200 border-r border-base-300 flex flex-col h-full overflow-y-auto shadow-2xl lg:shadow-none">
      <div className="p-6 border-b border-base-300 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <ShieldIcon className="size-6 font-bold" />
          <span className="text-xl font-bold tracking-tight">Admin Console</span>
        </div>
        {/* On mobile, users might want an explicit close button inside the sidebar too */}
        <button 
          onClick={() => onTabChange(activeTab)} // This is a bit of a hack, but AdminPage handleTabChange closes it
          className="btn btn-ghost btn-sm btn-circle lg:hidden"
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
