import { useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import {
  UserIcon,
  SettingsIcon,
  LogOutIcon,
  BellIcon,
  LoaderPinwheel,
  ChevronDownIcon,
  ExternalLinkIcon,
} from "lucide-react";
import ProfileAvatar from "../ProfileAvatar";
import ThemeSelector from "../ThemeSelector";
import useAuthUser from "../../hooks/useAuthUser";

const ProfileMenuDropdown = ({
  isOpen,
  onClose,
  onLogout,
  unreadCount = 0,
}) => {
  const { authUser } = useAuthUser();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  const closeMenu = useCallback(() => onClose(), [onClose]);

  const navigateAndClose = (path) => {
    closeMenu();
    navigate(path);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeMenu]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const first = menuRef.current.querySelector("[data-menu-item]");
      first?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const menuItems = [
    {
      id: "settings",
      to: "/settings?tab=general",
      icon: SettingsIcon,
      iconClass: "bg-secondary/10 text-secondary",
      title: "Settings",
      subtitle: "App preferences & general",
    },
    { id: "divider-1", type: "divider" },
    {
      id: "logout",
      type: "button",
      icon: LogOutIcon,
      iconClass: "bg-error/10 text-error",
      title: "Log Out",
      subtitle: "Sign out from Zashly",
      danger: true,
      onClick: onLogout,
    },
  ];

  return (
    <div
      ref={menuRef}
      id="profile-menu"
      role="menu"
      aria-label="Account menu"
      className="absolute right-0 mt-3 w-[min(100vw-2rem,20rem)] sm:w-80 bg-base-100/95 backdrop-blur-xl border border-base-content/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right"
    >
      {/* Profile header — tap to edit */}
      <button
        type="button"
        role="menuitem"
        data-menu-item
        className="w-full p-5 border-b border-base-content/5 bg-gradient-to-br from-base-200/80 to-base-100 text-left hover:from-primary/5 hover:to-base-100 transition-colors group"
        onClick={() => navigateAndClose("/edit-profile")}
      >
        <div className="flex items-center gap-3">
          <ProfileAvatar
            src={authUser?.profilePic}
            name={authUser?.fullName}
            size="w-14 h-14"
            textSize="text-xl"
            className="ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base truncate group-hover:text-primary transition-colors">
              {authUser?.fullName || "Your profile"}
            </p>
            <p className="text-xs text-base-content/50 truncate font-medium">
              {authUser?.email}
            </p>
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              View & edit profile
              <ExternalLinkIcon className="size-3" aria-hidden="true" />
            </span>
          </div>
        </div>
      </button>

      <nav className="p-2 max-h-[min(70vh,28rem)] overflow-y-auto custom-scrollbar" aria-label="Account options">
        {menuItems.map((item) => {
          if (item.type === "divider") {
            return (
              <div
                key={item.id}
                className="divider opacity-20 my-1.5 mx-3 before:h-px after:h-px"
                role="separator"
              />
            );
          }

          if (item.type === "theme") {
            return (
              <div key={item.id} className="px-1 py-0.5" role="none">
                <ThemeSelector variant="profileMenu" onThemePick={closeMenu} />
              </div>
            );
          }

          if (item.type === "button") {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                data-menu-item
                className={`flex items-center gap-3.5 w-full px-3 py-2.5 rounded-xl transition-all duration-200 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-error/40 ${
                  item.danger
                    ? "hover:bg-error/10 text-error"
                    : "hover:bg-base-content/5"
                }`}
                onClick={item.onClick}
              >
                <MenuIconBox icon={Icon} className={item.iconClass} />
                <MenuLabels title={item.title} subtitle={item.subtitle} danger={item.danger} />
              </button>
            );
          }

          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.to}
              role="menuitem"
              data-menu-item
              className="flex items-center gap-3.5 px-3 py-2.5 hover:bg-base-content/5 rounded-xl transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={closeMenu}
            >
              <MenuIconBox icon={Icon} className={item.iconClass} />
              <MenuLabels title={item.title} subtitle={item.subtitle} />
              {item.badge != null && (
                <span className="badge badge-primary badge-sm shrink-0 min-w-[1.25rem]">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

const MenuIconBox = ({ icon: Icon, className }) => (
  <div
    className={`size-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${className}`}
    aria-hidden="true"
  >
    <Icon className="size-5" />
  </div>
);

const MenuLabels = ({ title, subtitle, danger }) => (
  <div className="flex-1 min-w-0">
    <p className={`text-sm font-semibold truncate ${danger ? "text-error" : ""}`}>{title}</p>
    <p
      className={`text-[11px] truncate font-medium ${
        danger ? "text-error/55" : "text-base-content/45"
      }`}
    >
      {subtitle}
    </p>
  </div>
);

/** Profile trigger button — exported for use with dropdown ref */
export const ProfileMenuTrigger = ({
  isOpen,
  onToggle,
  triggerRef,
  authUser,
}) => (
  <button
    ref={triggerRef}
    type="button"
    id="profile-menu-trigger"
    aria-haspopup="menu"
    aria-expanded={isOpen}
    aria-controls="profile-menu"
    className={`flex items-center gap-1.5 p-1 pr-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
      isOpen ? "bg-base-300 ring-2 ring-primary/20" : "hover:bg-base-300"
    }`}
    onClick={onToggle}
  >
    <ProfileAvatar
      src={authUser?.profilePic}
      name={authUser?.fullName}
      size="w-10 h-10"
      textSize="text-base"
      className="shadow-sm"
    />
    <ChevronDownIcon
      className={`size-4 opacity-50 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
      aria-hidden="true"
    />
    <span className="sr-only">
      {isOpen ? "Close account menu" : "Open account menu"}
    </span>
  </button>
);

export default ProfileMenuDropdown;
