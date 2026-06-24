import { motion } from "framer-motion";
import { MessageSquare, UserPlus, Radio, Image as ImageIcon, BellRing, MonitorSmartphone, Video, CircleDot } from "lucide-react";

const allFeatures = [
  { icon: MessageSquare, title: "Real-Time Sync", desc: "Messages deliver instantly with WebSockets, complete with typing indicators." },
  { icon: UserPlus, title: "Friend Requests", desc: "Add friends by username and manage incoming/outgoing requests easily." },
  { icon: Radio, title: "Online Presence", desc: "See who's currently online and when they were last active." },
  { icon: CircleDot, title: "Moments", desc: "Share ephemeral 24h photo and video updates with your network." },
  { icon: Video, title: "HD Calls", desc: "Start 1:1 or group audio/video calls directly from any chat." },
  { icon: ImageIcon, title: "Media Sharing", desc: "Send photos, videos, and files with automatic compression." },
  { icon: BellRing, title: "Notifications", desc: "Never miss a beat with intelligent push and in-app alerts." },
  { icon: MonitorSmartphone, title: "Cross-Device", desc: "Beautifully responsive from the smallest mobile screen to desktop." },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function FeatureGrid() {
  return (
    <section className="py-24 bg-base-200/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold mb-4"
          >
            Everything you expect, and more.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-base-content/70"
          >
            Zashly covers all the basics of a modern messenger, while adding unique features that make chatting fun again.
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {allFeatures.map((feat, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <feat.icon className="w-5 h-5 text-primary group-hover:text-primary-content transition-colors duration-300" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-base-content">{feat.title}</h3>
              <p className="text-sm text-base-content/70 leading-relaxed">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
