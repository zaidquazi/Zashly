import { useState, useEffect } from "react";
import {
  UsersRoundIcon,
  WifiIcon,
  MessageCircleIcon,
  MessageSquareIcon,
  CameraIcon,
  ShieldBanIcon,
  TrendingUpIcon,
  ActivityIcon,
  BarChart3Icon,
  VideoIcon
} from "lucide-react";
import toast from "react-hot-toast";
import { getAdminStats } from "../../lib/adminApi";

const DashboardView = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (err) {
        toast.error("Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-sm font-medium animate-pulse text-base-content/50">Aggregating platform metrics...</p>
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: "User Base",
      value: stats.totalUsers,
      icon: UsersRoundIcon,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      trend: "+12% this week"
    },
    {
      label: "Live Connectivity",
      value: stats.onlineNow,
      icon: WifiIcon,
      color: "text-green-500",
      bg: "bg-green-500/10",
      trend: "Real-time"
    },
    {
      label: "Active Communities",
      value: stats.totalGroups,
      icon: MessageCircleIcon,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      trend: "50+ messages/hr"
    },
    {
      label: "Global Messages",
      value: stats.totalMessages,
      icon: MessageSquareIcon,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      trend: "3.2k today"
    },
    {
      label: "Media Shared",
      value: stats.activeMoments,
      icon: CameraIcon,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      trend: "Vibrant"
    },
    {
      label: "Actioned Bans",
      value: stats.bannedUsers,
      icon: ShieldBanIcon,
      color: "text-red-500",
      bg: "bg-red-500/10",
      trend: "Sanitizing"
    },
    {
      label: "Video Connectivity",
      value: stats.totalCalls || 0,
      icon: VideoIcon,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      trend: `${stats.activeCalls || 0} active now`
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Health</h2>
        <p className="text-base-content/50">Real-time overview of the Zashly ecosystem</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
        {cards.map((card, idx) => (
          <div
            key={card.label}
            className="group relative bg-base-200 rounded-3xl p-5 sm:p-6 border border-base-300 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${card.bg} rounded-2xl p-3 group-hover:scale-110 transition-transform`}>
                <card.icon className={`size-5 sm:size-6 ${card.color}`} />
              </div>
              <ActivityIcon className="size-4 text-base-content/20" />
            </div>
            
            <div>
              <p className="text-3xl sm:text-4xl font-black">{card.value.toLocaleString()}</p>
              <div className="flex items-center justify-between mt-1">
                 <p className="text-xs sm:text-sm font-semibold text-base-content/60">{card.label}</p>
                 <span className="text-[9px] sm:text-[10px] font-bold text-success/70 bg-success/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUpIcon className="size-2 sm:size-2.5" /> {card.trend}
                 </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for future charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-base-200 border border-base-300 rounded-3xl p-6 sm:p-8 min-h-[250px] sm:min-h-[300px] flex items-center justify-center relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="text-center relative z-10 p-4">
              <BarChart3Icon className="size-10 sm:size-12 mx-auto text-base-content/10 mb-4" />
              <p className="text-xs sm:text-sm font-bold text-base-content/30 uppercase tracking-widest px-4">Growth Analytics Coming Soon</p>
           </div>
        </div>
        <div className="bg-base-200 border border-base-300 rounded-3xl p-6 sm:p-8 min-h-[250px] sm:min-h-[300px] flex items-center justify-center relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="text-center relative z-10 p-4">
              <ActivityIcon className="size-10 sm:size-12 mx-auto text-base-content/10 mb-4" />
              <p className="text-xs sm:text-sm font-bold text-base-content/30 uppercase tracking-widest px-4">Real-time Traffic View Coming Soon</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
