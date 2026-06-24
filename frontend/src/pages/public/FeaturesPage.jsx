import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  BellIcon,
  LockIcon,
  MessageCircleIcon,
  MicIcon,
  SmartphoneIcon,
  UsersRoundIcon,
  Sparkles,
  ArrowRight
} from "lucide-react";
import PublicLayout from "../../components/layout/PublicLayout";

const featureSections = [
  {
    icon: MessageCircleIcon,
    title: "Real-Time Chat",
    description:
      "Send messages instantly with delivery indicators, reactions, pinned messages, and a polished chat experience powered by modern WebSocket technology.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: UsersRoundIcon,
    title: "Group Messaging",
    description:
      "Create groups, manage members, share media, run polls, and keep communities organized with moderation-ready admin tools.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: MicIcon,
    title: "Voice Messages & Calls",
    description:
      "Record voice notes in-chat or jump into HD voice and video calls — perfect for remote teams and long-distance friends.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: LockIcon,
    title: "Security & Privacy",
    description:
      "HTTP-only cookies, rate limiting, input validation, secure uploads, and session management designed for production deployments.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: BellIcon,
    title: "Smart Notifications",
    description:
      "Browser push and in-app alerts keep you in the loop without overwhelming your workflow — mute what you don't need.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: SmartphoneIcon,
    title: "Responsive Everywhere",
    description:
      "A mobile-first layout with bottom navigation on phones and a full sidebar on desktop — one app, every screen size.",
    color: "text-info",
    bgColor: "bg-info/10",
  },
];

const FeaturesPage = () => (
  <PublicLayout>
    <div className="flex flex-col w-full overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-24 overflow-hidden flex flex-col items-center justify-center bg-base-100">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-base-200 border border-base-300 text-base-content/80 font-medium text-sm mb-8 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-secondary" />
            Everything you need. Nothing you don't.
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-base-content mb-6 leading-tight"
          >
            Real-Time Messaging <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Built for You</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-base-content/70 leading-relaxed max-w-2xl mx-auto"
          >
            Discover why teams and communities choose Zashly for secure communication, instant messaging, and rich collaboration — from DMs to group channels and video calls.
          </motion.p>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-20 bg-base-200/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {featureSections.map(({ icon: Icon, title, description, color, bgColor }, i) => (
              <motion.section
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex flex-col p-8 rounded-[2rem] bg-base-100 border border-base-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
              >
                {/* Subtle hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-base-100 to-base-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                
                <div
                  className={`shrink-0 w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  aria-hidden="true"
                >
                  <Icon className={`size-7 ${color}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3">{title}</h2>
                  <p className="opacity-70 text-base leading-relaxed">{description}</p>
                </div>
              </motion.section>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden bg-base-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center p-12 sm:p-16 rounded-[3rem] bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 border border-base-300 shadow-lg max-w-5xl mx-auto relative overflow-hidden"
          >
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">Start messaging in seconds</h2>
              <p className="text-lg opacity-70 mb-10 max-w-xl mx-auto">Free account · No credit card required. Experience everything Zashly has to offer instantly.</p>
              
              <Link to="/signup" className="btn btn-primary btn-lg rounded-full px-10 shadow-xl shadow-primary/20 group">
                Get started with Zashly
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  </PublicLayout>
);

export default FeaturesPage;
