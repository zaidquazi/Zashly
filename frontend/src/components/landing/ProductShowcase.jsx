import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, MessageSquare, Users, CircleDot, Bell, UserCircle } from "lucide-react";

const features = [
  {
    id: "chat",
    title: "Real-time Chat",
    description: "Lightning fast messaging with typing indicators, read receipts, and rich media support.",
    icon: MessageSquare,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "friends",
    title: "Friends System",
    description: "Easily connect with others, manage requests, and see who's online right now.",
    icon: Users,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    id: "moments",
    title: "Moments & Stories",
    description: "Share what you're up to with ephemeral photo and video updates that disappear after 24h.",
    icon: CircleDot,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    id: "notifications",
    title: "Smart Notifications",
    description: "Stay in the loop without the noise. Customizable alerts for messages, calls, and moments.",
    icon: Bell,
    color: "text-info",
    bgColor: "bg-info/10",
  },
  {
    id: "profile",
    title: "Profile Management",
    description: "Express yourself with a customizable profile, avatar, status message, and bio.",
    icon: UserCircle,
    color: "text-success",
    bgColor: "bg-success/10",
  }
];

export default function ProductShowcase() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const handleNext = () => setActiveIdx((prev) => (prev + 1) % features.length);
  const handlePrev = () => setActiveIdx((prev) => (prev - 1 + features.length) % features.length);

  return (
    <section className="py-24 bg-base-200/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold mb-4"
          >
            Everything you need. Nothing you don't.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-base-content/70"
          >
            Zashly is packed with powerful features designed to make your communication seamless and expressive.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          
          {/* Feature Selector */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            {features.map((feat, idx) => {
              const isActive = activeIdx === idx;
              const Icon = feat.icon;
              return (
                <button
                  key={feat.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`text-left p-4 rounded-2xl transition-all duration-300 border-2 ${
                    isActive 
                      ? "bg-base-100 border-primary shadow-md scale-[1.02]" 
                      : "border-transparent hover:bg-base-200"
                  }`}
                  aria-pressed={isActive}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${isActive ? feat.bgColor : 'bg-base-300'}`}>
                      <Icon className={`w-6 h-6 ${isActive ? feat.color : 'text-base-content/50'}`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-lg mb-1 ${isActive ? 'text-base-content' : 'text-base-content/70'}`}>
                        {feat.title}
                      </h3>
                      {isActive && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-sm text-base-content/70"
                        >
                          {feat.description}
                        </motion.p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Carousel Viewport */}
          <div 
            className="lg:col-span-7 relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
          >
            <div className="aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden bg-base-300 border border-base-200 shadow-2xl relative flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIdx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full flex flex-col items-center justify-center bg-base-100"
                >
                  {/* CSS Mockup based on active index */}
                  <div className="text-center p-8">
                    <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 ${features[activeIdx].bgColor}`}>
                      {(() => {
                        const Icon = features[activeIdx].icon;
                        return <Icon className={`w-12 h-12 ${features[activeIdx].color}`} />;
                      })()}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{features[activeIdx].title} UI</h3>
                    <p className="text-base-content/60 max-w-sm mx-auto">
                      {/* TODO: replace with real product screenshot */}
                      [ Mockup Placeholder for {features[activeIdx].title} ]
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Controls */}
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                <button 
                  onClick={handlePrev} 
                  className="btn btn-circle btn-sm shadow-md pointer-events-auto bg-base-100/80 hover:bg-base-100 backdrop-blur"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleNext} 
                  className="btn btn-circle btn-sm shadow-md pointer-events-auto bg-base-100/80 hover:bg-base-100 backdrop-blur"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {features.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${activeIdx === idx ? "w-6 bg-primary" : "bg-base-content/20"}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
