import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, MessageSquare, FileText, AlertTriangle, Activity, Settings } from "lucide-react";
import axios from "axios";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    totalContent: 0,
    pendingReports: 0,
    resolvedReports: 0,
    systemStatus: "healthy"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get("/api/admin/dashboard");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-500",
      change: "+12%",
      changeType: "positive"
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      icon: Activity,
      color: "bg-green-500",
      change: "+5%",
      changeType: "positive"
    },
    {
      title: "New Users (30d)",
      value: stats.newUsers,
      icon: Users,
      color: "bg-purple-500",
      change: "+18%",
      changeType: "positive"
    },
    {
      title: "Total Content",
      value: stats.totalContent,
      icon: FileText,
      color: "bg-orange-500",
      change: "+8%",
      changeType: "positive"
    },
    {
      title: "Pending Reports",
      value: stats.pendingReports,
      icon: AlertTriangle,
      color: "bg-red-500",
      change: "-3%",
      changeType: "negative"
    },
    {
      title: "Resolved Reports",
      value: stats.resolvedReports,
      icon: MessageSquare,
      color: "bg-teal-500",
      change: "+15%",
      changeType: "positive"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Admin Dashboard</h1>
          <p className="text-base-content/70 mt-1">Overview of platform statistics and system health</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            stats.systemStatus === "healthy" ? "bg-green-500" : "bg-red-500"
          }`}></div>
          <span className="text-sm text-base-content/70">
            System {stats.systemStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card bg-base-100 shadow-lg"
            >
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-base-content/70">{card.title}</p>
                    <p className="text-2xl font-bold text-base-content mt-1">
                      {card.value.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className={`text-xs ${
                        card.changeType === "positive" ? "text-green-500" : "text-red-500"
                      }`}>
                        {card.change}
                      </span>
                      <span className="text-xs text-base-content/50">vs last period</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card bg-base-100 shadow-lg"
        >
          <div className="card-body">
            <h2 className="card-title text-base-content">Recent Activity</h2>
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-base-content/70">New user registration spike detected</p>
                <span className="text-xs text-base-content/50 ml-auto">2m ago</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <p className="text-sm text-base-content/70">5 new reports require review</p>
                <span className="text-xs text-base-content/50 ml-auto">15m ago</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-base-content/70">System backup completed</p>
                <span className="text-xs text-base-content/50 ml-auto">1h ago</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="card bg-base-100 shadow-lg"
        >
          <div className="card-body">
            <h2 className="card-title text-base-content">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button className="btn btn-primary btn-sm">
                <Users className="w-4 h-4" />
                Manage Users
              </button>
              <button className="btn btn-secondary btn-sm">
                <AlertTriangle className="w-4 h-4" />
                Review Reports
              </button>
              <button className="btn btn-accent btn-sm">
                <FileText className="w-4 h-4" />
                Moderate Content
              </button>
              <button className="btn btn-info btn-sm">
                <Settings className="w-4 h-4" />
                System Settings
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
