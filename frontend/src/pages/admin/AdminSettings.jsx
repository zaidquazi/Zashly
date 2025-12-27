import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, BarChart3, Activity, Users, FileText, Shield } from "lucide-react";
import axios from "axios";

const AdminSettings = () => {
  const [settings, setSettings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("settings");
  const [analyticsPeriod, setAnalyticsPeriod] = useState("30d");

  useEffect(() => {
    if (activeTab === "settings") {
      fetchSettings();
    } else if (activeTab === "analytics") {
      fetchAnalytics();
    } else if (activeTab === "logs") {
      fetchActivityLogs();
    }
  }, [activeTab, analyticsPeriod]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/system/settings");
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/system/analytics", {
        params: { period: analyticsPeriod }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/system/activity-logs");
      setActivityLogs(response.data.logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingId, value) => {
    try {
      await axios.put(`/api/admin/system/settings/${settingId}`, { value });
      fetchSettings();
    } catch (error) {
      console.error("Error updating setting:", error);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      LOGIN: Shield,
      LOGOUT: Shield,
      USER_VIEW: Users,
      USER_EDIT: Users,
      USER_BAN: Users,
      USER_UNBAN: Users,
      USER_DELETE: Users,
      CONTENT_MODERATE: FileText,
      CONTENT_DELETE: FileText,
      REPORT_REVIEW: Activity,
      SYSTEM_SETTING_CHANGE: Settings,
      ROLE_CHANGE: Shield,
    };
    return icons[action] || Activity;
  };

  const getActionColor = (action) => {
    const colors = {
      LOGIN: "text-green-500",
      LOGOUT: "text-blue-500",
      USER_VIEW: "text-blue-500",
      USER_EDIT: "text-yellow-500",
      USER_BAN: "text-red-500",
      USER_UNBAN: "text-green-500",
      USER_DELETE: "text-red-500",
      CONTENT_MODERATE: "text-yellow-500",
      CONTENT_DELETE: "text-red-500",
      REPORT_REVIEW: "text-orange-500",
      SYSTEM_SETTING_CHANGE: "text-purple-500",
      ROLE_CHANGE: "text-indigo-500",
    };
    return colors[action] || "text-gray-500";
  };

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
          <h1 className="text-3xl font-bold text-base-content">System Settings & Analytics</h1>
          <p className="text-base-content/70 mt-1">Manage platform settings and view analytics</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed">
        <button
          className={`tab ${activeTab === "settings" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button
          className={`tab ${activeTab === "analytics" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </button>
        <button
          className={`tab ${activeTab === "logs" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("logs")}
        >
          <Activity className="w-4 h-4" />
          Activity Logs
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {["GENERAL", "SECURITY", "CONTENT", "FEATURES", "LIMITS"].map(category => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card bg-base-100 shadow-lg"
            >
              <div className="card-body">
                <h2 className="card-title text-base-content">{category}</h2>
                <div className="space-y-4">
                  {settings
                    .filter(setting => setting.category === category)
                    .map(setting => (
                      <div key={setting._id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-base-content">{setting.key}</p>
                          <p className="text-sm text-base-content/70">{setting.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {setting.type === "BOOLEAN" ? (
                            <input
                              type="checkbox"
                              className="toggle toggle-primary"
                              checked={setting.value}
                              onChange={(e) => updateSetting(setting._id, e.target.checked)}
                            />
                          ) : setting.type === "NUMBER" ? (
                            <input
                              type="number"
                              className="input input-bordered input-sm w-24"
                              value={setting.value}
                              onChange={(e) => updateSetting(setting._id, parseInt(e.target.value))}
                            />
                          ) : (
                            <input
                              type="text"
                              className="input input-bordered input-sm w-48"
                              value={setting.value}
                              onChange={(e) => updateSetting(setting._id, e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && analytics && (
        <div className="space-y-6">
          <div className="flex gap-2">
            {["7d", "30d", "90d", "1y"].map(period => (
              <button
                key={period}
                className={`btn btn-sm ${analyticsPeriod === period ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setAnalyticsPeriod(period)}
              >
                {period === "7d" ? "7 Days" : period === "30d" ? "30 Days" : period === "90d" ? "90 Days" : "1 Year"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card bg-base-100 shadow-lg"
            >
              <div className="card-body">
                <h3 className="card-title text-base-content">User Growth</h3>
                <div className="text-2xl font-bold text-primary">
                  {analytics.userGrowth.reduce((sum, item) => sum + item.count, 0)}
                </div>
                <p className="text-sm text-base-content/70">New users in period</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card bg-base-100 shadow-lg"
            >
              <div className="card-body">
                <h3 className="card-title text-base-content">Content Created</h3>
                <div className="text-2xl font-bold text-secondary">
                  {analytics.contentGrowth.reduce((sum, item) => sum + item.count, 0)}
                </div>
                <p className="text-sm text-base-content/70">New content in period</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card bg-base-100 shadow-lg"
            >
              <div className="card-body">
                <h3 className="card-title text-base-content">Admin Actions</h3>
                <div className="text-2xl font-bold text-accent">
                  {analytics.activityStats.reduce((sum, item) => sum + item.count, 0)}
                </div>
                <p className="text-sm text-base-content/70">Total admin actions</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card bg-base-100 shadow-lg"
            >
              <div className="card-body">
                <h3 className="card-title text-base-content">Top Reporter</h3>
                <div className="text-lg font-bold text-info">
                  {analytics.topReporters[0]?.user?.fullName || "N/A"}
                </div>
                <p className="text-sm text-base-content/70">
                  {analytics.topReporters[0]?.count || 0} actions
                </p>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card bg-base-100 shadow-lg"
            >
              <div className="card-body">
                <h3 className="card-title text-base-content">Report Statistics</h3>
                <div className="space-y-2">
                  {analytics.reportStats.map((stat, index) => (
                    <div key={stat._id} className="flex justify-between items-center">
                      <span className="text-sm text-base-content/70">{stat._id}</span>
                      <span className="badge badge-primary">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card bg-base-100 shadow-lg"
            >
              <div className="card-body">
                <h3 className="card-title text-base-content">Top Admins</h3>
                <div className="space-y-2">
                  {analytics.topReporters.map((admin, index) => (
                    <div key={admin._id} className="flex justify-between items-center">
                      <span className="text-sm text-base-content">{admin.user?.fullName}</span>
                      <span className="badge badge-secondary">{admin.count} actions</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === "logs" && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-base-content">Recent Admin Activity</h2>
            <div className="space-y-3">
              {activityLogs.map((log, index) => {
                const ActionIcon = getActionIcon(log.action);
                return (
                  <motion.div
                    key={log._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-3 bg-base-200 rounded-lg"
                  >
                    <ActionIcon className={`w-5 h-5 ${getActionColor(log.action)}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-base-content">{log.description}</p>
                      <p className="text-xs text-base-content/70">
                        by {log.adminId?.fullName} • {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="badge badge-outline">{log.action}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
