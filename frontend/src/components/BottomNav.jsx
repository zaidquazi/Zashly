import { Link, useLocation } from "react-router";
import { HomeIcon, UsersIcon, MessageSquareIcon, PhoneIcon } from "lucide-react";

const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { icon: HomeIcon, label: "Home", path: "/" },
    { icon: UsersIcon, label: "Friends", path: "/friends" },
    { icon: MessageSquareIcon, label: "Groups", path: "/groups" },
    { icon: PhoneIcon, label: "Calls", path: "/calls" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-200 border-t border-base-300 z-50 px-4 h-16 shadow-lg">
      <div className="flex items-center justify-around h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 w-full h-full relative ${
                isActive ? "text-primary scale-110" : "text-base-content/60"
              }`}
            >
              <item.icon className={`size-5 ${isActive ? "fill-primary/20" : ""}`} />
              <span className={`text-[10px] font-medium ${isActive ? "font-bold" : ""}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--p),0.5)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
