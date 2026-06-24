import { motion } from "framer-motion";
import { Link } from "react-router";
import { MessageCircle, Heart, Share2, Send } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-base-100 to-base-100 dark:from-primary/10 dark:via-base-100 dark:to-base-100" />
      
      {/* Floating ambient shapes */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} 
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-10 w-64 h-64 bg-primary/10 blur-3xl rounded-full -z-10"
      />
      <motion.div 
        animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-10 w-80 h-80 bg-secondary/10 blur-3xl rounded-full -z-10"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left Copy */}
        <div className="flex-1 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Real-time, Secure, Fast
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-base-content mb-6 leading-[1.1]"
          >
            Fast, beautiful, <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              real-time chat.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-base-content/70 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0"
          >
            Connect instantly with friends and communities. End-to-end speed, crystal-clear voice and video, and a design that gets out of your way.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <Link to="/signup" className="btn btn-primary btn-lg rounded-full px-8 shadow-lg shadow-primary/25 w-full sm:w-auto">
              Get Started for Free
            </Link>
            <Link to="/features" className="btn btn-ghost btn-lg rounded-full px-8 w-full sm:w-auto">
              See How It Works
            </Link>
          </motion.div>
        </div>

        {/* Right Device Mockup */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, rotate: 2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.7, type: "spring", bounce: 0.4, delay: 0.4 }}
          className="flex-1 w-full max-w-sm lg:max-w-md relative"
        >
          {/* Mockup Frame */}
          <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl overflow-hidden ring-1 ring-base-content/10">
            {/* Notch */}
            <div className="w-[148px] h-[18px] bg-gray-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-[1rem] z-20"></div>
            
            {/* Screen Content */}
            <div className="bg-base-100 w-full h-full relative flex flex-col">
              {/* Mock Header */}
              <div className="h-20 bg-base-100/90 backdrop-blur border-b border-base-200 flex flex-col justify-end pb-3 px-4 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px]">
                    <div className="w-full h-full bg-base-100 rounded-full border-2 border-base-100 overflow-hidden">
                      <img src="https://i.pravatar.cc/100?img=3" alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm leading-tight">Design Team</h3>
                    <p className="text-[10px] text-success font-medium">3 online</p>
                  </div>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-hidden p-4 flex flex-col gap-4 justify-end pb-20 bg-[#f8fafc] dark:bg-[#0f172a]">
                
                <div className="flex gap-2">
                  <img src="https://i.pravatar.cc/100?img=1" className="w-6 h-6 rounded-full self-end" />
                  <div className="bg-base-200 p-3 rounded-2xl rounded-bl-sm max-w-[80%] text-sm shadow-sm">
                    Has anyone seen the new landing page concepts? 👀
                  </div>
                </div>

                <div className="flex gap-2 self-end flex-row-reverse">
                  <div className="bg-primary text-primary-content p-3 rounded-2xl rounded-br-sm max-w-[80%] text-sm shadow-sm">
                    Yeah, they look absolutely stunning! ✨
                  </div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="flex gap-2"
                >
                  <img src="https://i.pravatar.cc/100?img=3" className="w-6 h-6 rounded-full self-end" />
                  <div className="bg-base-200 p-3 rounded-2xl rounded-bl-sm max-w-[80%] shadow-sm">
                    {/* Typing Indicator */}
                    <div className="flex items-center gap-1 h-5">
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-base-content/40 rounded-full" />
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-base-content/40 rounded-full" />
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-base-content/40 rounded-full" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Input Area */}
              <div className="absolute bottom-0 inset-x-0 bg-base-100 border-t border-base-200 p-3 pb-8">
                <div className="bg-base-200 rounded-full h-10 flex items-center px-4 justify-between">
                  <span className="text-sm text-base-content/40">Message...</span>
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Send className="w-3 h-3 text-primary-content ml-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating UI Badges */}
          <motion.div 
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 -right-6 lg:-right-12 bg-base-100 rounded-2xl p-3 shadow-xl border border-base-200 hidden sm:flex items-center gap-3 z-30"
          >
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs font-bold">14 New Messages</p>
              <p className="text-[10px] text-base-content/60">Just now</p>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [5, -5, 5] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-32 -left-6 lg:-left-12 bg-base-100 rounded-2xl p-3 shadow-xl border border-base-200 hidden sm:flex items-center gap-3 z-30"
          >
            <div className="flex -space-x-2">
              <img src="https://i.pravatar.cc/100?img=1" className="w-8 h-8 rounded-full border-2 border-base-100" />
              <img src="https://i.pravatar.cc/100?img=2" className="w-8 h-8 rounded-full border-2 border-base-100" />
              <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center border-2 border-base-100 text-xs font-bold">+5</div>
            </div>
            <p className="text-xs font-bold pr-2">Joined Call</p>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
