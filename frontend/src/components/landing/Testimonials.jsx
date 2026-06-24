import { motion } from "framer-motion";
import { Shield, Zap, Lock, Radio, Code2, Globe, Heart, RefreshCw } from "lucide-react";

const trustPoints = [
  {
    icon: Lock,
    title: "End-to-End Secure",
    desc: "Your conversations are encrypted and your data stays private. No ads, no data selling.",
    accent: "from-blue-500 to-cyan-400",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Built with React 19 and real-time WebSocket infrastructure for instant message delivery.",
    accent: "from-amber-500 to-orange-400",
  },
  {
    icon: Radio,
    title: "Crystal-Clear Calls",
    desc: "Voice and video calls powered by WebRTC with adaptive quality and low-latency connections.",
    accent: "from-violet-500 to-purple-400",
  },
  {
    icon: Code2,
    title: "Modern Tech Stack",
    desc: "React 19, Node.js, MongoDB, Socket.IO, and LiveKit — built with production-grade tools.",
    accent: "from-emerald-500 to-teal-400",
  },
  {
    icon: RefreshCw,
    title: "Actively Developed",
    desc: "New features and improvements ship regularly. Built by a developer who uses it daily.",
    accent: "from-pink-500 to-rose-400",
  },
  {
    icon: Globe,
    title: "Works Everywhere",
    desc: "Use Zashly on any device — web, Android, and mobile browsers. Your chats sync seamlessly.",
    accent: "from-sky-500 to-indigo-400",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-base-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold mb-4"
          >
            Why Choose Zashly?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-base-content/70"
          >
            A communication platform built with care, security, and performance at its core.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustPoints.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + (idx * 0.07) }}
                className="group bg-base-200/50 hover:bg-base-200 p-7 rounded-2xl border border-base-300/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.accent} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-base-content">{item.title}</h3>
                <p className="text-base-content/60 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Honest community note */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-base-200/80 rounded-full border border-base-300/50">
            <Heart className="w-4 h-4 text-error" />
            <span className="text-sm text-base-content/60">
              Zashly is growing — join early and help shape the future of communication.
            </span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
