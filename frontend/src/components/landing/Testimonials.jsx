import { motion } from "framer-motion";
import { Star } from "lucide-react";

// Placeholder content marked clearly as per requirements
const testimonials = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "Community Manager",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    quote: "Zashly replaced Discord for our entire team. The UI is just so much cleaner, and the voice call quality is noticeably better.",
    rating: 5,
  },
  {
    id: 2,
    name: "Marcus Chen",
    role: "Student",
    avatar: "https://i.pravatar.cc/150?u=marcus",
    quote: "I love the Moments feature. It's like having Instagram stories but only for my actual close friends. Super fast and responsive.",
    rating: 5,
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    role: "Freelance Designer",
    avatar: "https://i.pravatar.cc/150?u=elena",
    quote: "The attention to detail in the UI is fantastic. Dark mode looks incredible, and I never miss notifications anymore.",
    rating: 5,
  }
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
            Loved by our users.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-base-content/70"
          >
            {/* TODO: Replace with real user testimonials when available */}
            Don't just take our word for it. Here's what people are saying about Zashly.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + (idx * 0.1) }}
              className="bg-base-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                ))}
              </div>
              <blockquote className="text-base-content/80 text-lg leading-relaxed mb-8">
                "{item.quote}"
              </blockquote>
              <div className="flex items-center gap-4 mt-auto">
                <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full object-cover bg-base-300" />
                <div>
                  <h4 className="font-bold text-base-content">{item.name}</h4>
                  <p className="text-sm text-base-content/60">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
