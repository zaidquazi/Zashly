import { motion } from "framer-motion";
import { Video, Mic, ScreenShare, Zap } from "lucide-react";

export default function VoiceVideoSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-base-100 to-base-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text */}
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary font-medium text-sm mb-6"
            >
              <Video className="w-4 h-4" />
              HD Calling Included
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight"
            >
              Crystal-clear calls, <br className="hidden sm:block" />
              anywhere in the world.
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-base-content/70 mb-10"
            >
              Whether it's a quick 1-on-1 sync or a late-night group hangout, Zashly's voice and video engine delivers ultra-low latency and stunning clarity.
            </motion.p>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: Video, title: "1080p HD Video", desc: "Crisp and smooth video quality that adapts to your network." },
                { icon: Mic, title: "Noise Suppression", desc: "Advanced audio processing isolates your voice from background noise." },
                { icon: ScreenShare, title: "Screen Sharing", desc: "Share your screen, tab, or specific windows instantly." },
                { icon: Zap, title: "Low Latency", desc: "Powered by WebRTC and LiveKit for real-time responsiveness." }
              ].map((feat, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + (idx * 0.1) }}
                  className="flex flex-col gap-2"
                >
                  <div className="w-10 h-10 rounded-lg bg-base-300 flex items-center justify-center">
                    <feat.icon className="w-5 h-5 text-base-content/80" />
                  </div>
                  <h4 className="font-semibold">{feat.title}</h4>
                  <p className="text-sm text-base-content/60 leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Mockup Grid */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Main Video Call Frame */}
            <div className="rounded-2xl overflow-hidden bg-gray-900 aspect-video shadow-2xl ring-1 ring-base-content/10 relative group">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" alt="Video Call Main" />
              
              {/* Call Controls Mockup */}
              <div className="absolute bottom-6 inset-x-0 flex justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-base-100/20 backdrop-blur flex items-center justify-center hover:bg-base-100/40 transition">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <div className="w-12 h-12 rounded-full bg-base-100/20 backdrop-blur flex items-center justify-center hover:bg-base-100/40 transition">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition shadow-lg shadow-red-500/20">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white transform rotate-135"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/></svg>
                </div>
              </div>

              {/* PiP View */}
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 right-4 w-32 aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-xl ring-2 ring-base-100/50"
              >
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover" alt="Video Call Self" />
              </motion.div>
            </div>

            {/* Decorative background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-secondary/10 blur-[100px] -z-10 rounded-full" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
