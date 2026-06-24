import { useState, useEffect, useCallback } from "react";
import { 
  BarChart3Icon, 
  TrendingUpIcon, 
  UsersIcon, 
  MessageSquareIcon, 
  ShieldCheckIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  FilterIcon
} from "lucide-react";
import toast from "react-hot-toast";
import { getAnalyticsData } from "../../lib/adminApi";

const AnalyticsView = ({ onTabChange }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    includeShadowBanned: true,
    eventType: "all"
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAnalyticsData(range);
      setData(res);
    } catch (err) {
      toast.error("Failed to load analytics engine");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-sm font-medium animate-pulse opacity-50 text-primary">Calibrating data points...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-3">
            <BarChart3Icon className="size-5 sm:size-6 text-primary" />
            Platform Intelligence
          </h2>
          <p className="text-[10px] sm:text-sm text-base-content/50 mt-1 font-medium">Deep-dive into Zashly ecosystem performance</p>
        </div>
        <div className="flex items-center gap-2 bg-base-200 p-1 rounded-xl sm:rounded-2xl border border-base-300 w-full sm:w-auto overflow-hidden">
           {/* Time Range Selector */}
           <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-sm btn-ghost gap-1.5 text-xs font-bold">
                 <CalendarIcon className="size-3" /> 
                 {range === "7" ? "Last 7 Days" : range === "30" ? "Last 30 Days" : range === "90" ? "Last Quarter" : "Last 6 Months"}
              </button>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-200 rounded-xl border border-base-300 w-40 mt-2">
                <li><button onClick={() => setRange("7")} className={range === "7" ? "active" : ""}>Last 7 Days</button></li>
                <li><button onClick={() => setRange("30")} className={range === "30" ? "active" : ""}>Last 30 Days</button></li>
                <li><button onClick={() => setRange("90")} className={range === "90" ? "active" : ""}>Last Quarter</button></li>
                <li><button onClick={() => setRange("180")} className={range === "180" ? "active" : ""}>Last 6 Months</button></li>
              </ul>
           </div>
           
           {/* Advanced Filters Trigger */}
           <button 
             className="btn btn-sm btn-primary gap-1.5 text-xs font-bold shadow-lg shadow-primary/20"
             onClick={() => setShowFilters(true)}
           >
              <FilterIcon className="size-3" /> Advanced Filters
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Growth Visualization */}
        <div className="lg:col-span-2 bg-base-200 border border-base-300 rounded-[2.5rem] p-8 space-y-8 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <UsersIcon className="size-32" />
           </div>
           
           <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                 <h3 className="font-bold text-lg">User Acquisition</h3>
                 <p className="text-xs opacity-40">Monthly growth trajectory (Current view)</p>
              </div>
              <div className="text-right">
                 <p className="text-2xl font-black text-success flex items-center justify-end gap-1">
                    <ArrowUpRightIcon className="size-5" /> 18.4%
                 </p>
                 <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">Growth Velocity</p>
              </div>
           </div>

           <div className="flex items-end justify-between h-48 gap-2 px-4">
              {data?.userGrowth.map((month, idx) => {
                const height = (month.count / Math.max(...data.userGrowth.map(m => m.count), 1)) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-4 group/bar">
                    <div className="w-full relative">
                       <div 
                         className="w-full bg-gradient-to-t from-primary/80 to-primary rounded-2xl transition-all duration-700 delay-150 group-hover/bar:from-primary group-hover/bar:scale-x-105"
                         style={{ height: `${height}%` }}
                       >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-primary text-primary-content text-[10px] font-bold px-2 py-0.5 rounded shadow-xl">
                             {month.count}
                          </div>
                       </div>
                    </div>
                    <span className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">M{month._id}</span>
                  </div>
                );
              })}
           </div>
            {loading && (
              <div className="absolute inset-0 bg-base-200/50 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-[2.5rem]">
                 <span className="loading loading-spinner text-primary" />
              </div>
            )}
        </div>

        {/* Moderation Metrics */}
        <div className="bg-base-200 border border-base-300 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           
           <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-success/10 text-success rounded-2xl">
                    <ShieldCheckIcon className="size-5" />
                 </div>
                 <h3 className="font-bold underline decoration-success/30 decoration-2 underline-offset-4">Moderation Pulse</h3>
              </div>

              <div className="space-y-8 py-4">
                 <div className="text-center">
                    <p className="text-6xl font-black tracking-tighter text-success">{data?.moderation.efficiency.toFixed(0)}<span className="text-2xl opacity-40">%</span></p>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] mt-2">Resolution Efficiency</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-base-100/50 p-4 rounded-3xl border border-base-300/50">
                       <p className="text-xl font-bold">{data?.moderation.total}</p>
                       <p className="text-[9px] font-bold opacity-30 uppercase">Reports</p>
                    </div>
                    <div className="bg-base-100/50 p-4 rounded-3xl border border-base-300/50">
                       <p className="text-xl font-bold">{data?.moderation.resolved}</p>
                       <p className="text-[9px] font-bold opacity-30 uppercase">Solved</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="relative z-10 mt-4">
              <button 
                className="btn btn-block btn-sm btn-ghost bg-success/5 text-success hover:bg-success hover:text-success-content rounded-2xl font-bold text-xs gap-2"
                onClick={() => onTabChange("audit")}
              >
                 Audit Workflow <ArrowUpRightIcon className="size-3" />
              </button>
           </div>
        </div>

        {/* Message Traffic Heatmap-style */}
        <div className="lg:col-span-3 bg-base-200 border border-base-300 rounded-[2.5rem] p-8 shadow-sm group">
           <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                 <MessageSquareIcon className="size-5" />
              </div>
              <div>
                 <h3 className="font-bold">Message Traffic Intensity</h3>
                 <p className="text-xs opacity-40">Packet distribution for the selected range ({range} days)</p>
              </div>
           </div>

           <div className="flex flex-wrap gap-2">
              {data?.messageStats.map((day, idx) => {
                const opacity = Math.min(0.2 + (day.count / 100), 1);
                return (
                  <div 
                    key={idx} 
                    className="size-8 rounded-lg border border-base-300 transition-all cursor-pointer relative group/cell flex items-center justify-center hover:scale-110"
                    style={{ backgroundColor: `rgba(99, 102, 241, ${opacity})` }}
                  >
                     <span className={`text-[8px] font-bold ${opacity > 0.6 ? 'text-white' : 'text-primary'}`}>{day._id}</span>
                     <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/cell:opacity-100 transition-all bg-base-content text-base-100 text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap z-20 scale-90 group-hover/cell:scale-100">
                        {day.count} Messages
                     </div>
                  </div>
                );
              })}
              {/* Fill placeholders if data is sparse */}
              {data?.messageStats.length < 14 && Array.from({ length: 14 - data.messageStats.length }).map((_, i) => (
                <div key={`empty-${i}`} className="size-8 rounded-lg border border-base-300/50 bg-base-100 opacity-10" />
              ))}
           </div>
        </div>



      </div>

      {/* ADVANCED FILTERS MODAL */}
      {showFilters && (
        <div className="modal modal-open">
           <div className="modal-box bg-base-200 border border-base-300 rounded-[2rem] max-w-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                   <FilterIcon className="size-5" />
                </div>
                <h3 className="font-bold text-lg">Advanced Filters</h3>
             </div>

             <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-base-100 rounded-2xl border border-base-300">
                   <div>
                      <p className="text-sm font-bold">Shadow Banned Data</p>
                      <p className="text-[10px] opacity-40 uppercase">Include in growth stats</p>
                   </div>
                   <input 
                     type="checkbox" 
                     className="toggle toggle-primary toggle-sm"
                     checked={filters.includeShadowBanned}
                     onChange={(e) => setFilters(prev => ({...prev, includeShadowBanned: e.target.checked}))}
                   />
                </div>

                <div className="form-control">
                   <label className="label py-1"><span className="label-text-alt font-bold opacity-30 uppercase text-[10px]">Visualized Event Type</span></label>
                   <select 
                     className="select select-bordered select-sm bg-base-100 rounded-xl"
                     value={filters.eventType}
                     onChange={(e) => setFilters(prev => ({...prev, eventType: e.target.value}))}
                   >
                      <option value="all">Comprehensive (All Events)</option>
                      <option value="messages">Direct Messages Only</option>
                      <option value="moments">Platform Moments Only</option>
                   </select>
                </div>
             </div>

             <div className="modal-action mt-8">
               <button className="btn btn-ghost btn-sm rounded-xl px-6" onClick={() => setShowFilters(false)}>Close</button>
               <button className="btn btn-primary btn-sm rounded-xl px-8 shadow-lg shadow-primary/20" onClick={() => setShowFilters(false)}>Apply</button>
             </div>
           </div>
           <div className="modal-backdrop bg-base-content/20 backdrop-blur-sm" onClick={() => setShowFilters(false)}></div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
