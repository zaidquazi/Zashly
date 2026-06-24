import { useState } from "react";
import { motion } from "framer-motion";
import { Code2, Heart, Sparkles, Terminal } from "lucide-react";

export default function FounderCard() {
  const [imgError, setImgError] = useState(false);

  return (
    <section className="py-24 bg-base-200/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-base-100 rounded-[2.5rem] p-8 sm:p-12 shadow-sm border border-base-200"
        >
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
            
            {/* Avatar / Photo */}
            <div className="shrink-0 relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
              {imgError ? (
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-base-100 shadow-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-bold text-white select-none">ZH</span>
                </div>
              ) : (
                <img 
                  src="/pro.jpeg" 
                  alt="Zaid Husain" 
                  loading="lazy"
                  onError={() => setImgError(true)}
                  className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full object-cover border-4 border-base-100 shadow-xl"
                />
              )}
              <div className="absolute -bottom-2 -right-2 bg-base-100 p-2 rounded-full shadow-lg border border-base-200">
                <Code2 className="w-6 h-6 text-primary" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold mb-2">Built by Zaid Husain</h2>
              <p className="text-primary font-medium mb-6">CS Student & Full-Stack Developer</p>
              
              <p className="text-lg text-base-content/70 leading-relaxed mb-8">
                I'm passionate about modern web apps, great UX, and pushing the boundaries of what browsers can do. I built Zashly to create a communication platform that feels fast, intuitive, and enjoyable to use—combining the best parts of the apps we use every day into one seamless experience.
              </p>

              {/* Badges */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="badge badge-lg badge-outline gap-2 px-4 py-4 rounded-xl border-base-300">
                  <Terminal className="w-4 h-4" /> React 19
                </span>
                <span className="badge badge-lg badge-outline gap-2 px-4 py-4 rounded-xl border-base-300">
                  <Sparkles className="w-4 h-4" /> Node.js & Socket.io
                </span>
                <span className="badge badge-lg badge-outline gap-2 px-4 py-4 rounded-xl border-base-300">
                  <Heart className="w-4 h-4 text-error" /> Real-time Systems
                </span>
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
