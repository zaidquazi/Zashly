import { motion, useInView } from "framer-motion";
import { useEffect, useState, useRef } from "react";

// Configurable fallback stats for easy API replacement
const fallbackStats = {
  activeUsers: 14205,
  messagesSent: 8943210,
  callsCompleted: 340500,
  communities: 1250,
};

function CountUp({ end, duration = 2, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    let startTime;
    let animationFrame;

    const update = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(easeProgress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(update);
      }
    };

    animationFrame = requestAnimationFrame(update);

    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, end, duration]);

  // Format large numbers with commas
  const formatted = new Intl.NumberFormat('en-US').format(count);

  return <span ref={ref}>{formatted}{suffix}</span>;
}

import { axiosInstance } from "../../lib/axios";

export default function LiveStats() {
  const [stats, setStats] = useState(fallbackStats);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get("/public/stats");
        if (res.data?.success && res.data?.data) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load live stats:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="py-24 bg-primary text-primary-content relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center divide-x-0 md:divide-x divide-primary-content/20">
          
          <div className="flex flex-col items-center justify-center p-4">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-2">
              <CountUp end={stats.activeUsers} />
            </h3>
            <p className="text-primary-content/80 font-medium uppercase tracking-wider text-xs sm:text-sm">Active Users</p>
          </div>

          <div className="flex flex-col items-center justify-center p-4">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-2">
              <CountUp end={stats.messagesSent} suffix="+" />
            </h3>
            <p className="text-primary-content/80 font-medium uppercase tracking-wider text-xs sm:text-sm">Messages Sent</p>
          </div>

          <div className="flex flex-col items-center justify-center p-4">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-2">
              <CountUp end={stats.callsCompleted} />
            </h3>
            <p className="text-primary-content/80 font-medium uppercase tracking-wider text-xs sm:text-sm">Calls Completed</p>
          </div>

          <div className="flex flex-col items-center justify-center p-4">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-2">
              <CountUp end={stats.communities} />
            </h3>
            <p className="text-primary-content/80 font-medium uppercase tracking-wider text-xs sm:text-sm">Communities</p>
          </div>

        </div>
      </div>
    </section>
  );
}
