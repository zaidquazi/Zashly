import { motion } from "framer-motion";
import { ShieldCheck, Lock, Fingerprint, EyeOff } from "lucide-react";

export default function SecurityTrustSection() {
  return (
    <section className="py-24 bg-base-100 border-y border-base-200 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-base-200 text-base-content mb-6 shadow-sm border border-base-300"
          >
            <ShieldCheck className="w-8 h-8" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold mb-4"
          >
            Built with trust at its core.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-base-content/70"
          >
            Zashly implements modern security practices to keep your conversations private and your account secure. No compromises.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              icon: Lock,
              title: "Encrypted Transit",
              desc: "All messages, calls, and media are encrypted in transit using industry-standard TLS protocols, ensuring your data is safe from interception."
            },
            {
              icon: Fingerprint,
              title: "Secure Authentication",
              desc: "Robust token-based authentication with secure HTTP-only cookies and automatic session rotation protects your account."
            },
            {
              icon: EyeOff,
              title: "Privacy Controls",
              desc: "You control who can message you, see your online status, or view your moments. Granular privacy settings put you in charge."
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + (idx * 0.1) }}
              className="bg-base-200/50 border border-base-300 rounded-3xl p-8 hover:bg-base-200 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-base-100 shadow-sm border border-base-300 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-md transition-all">
                <item.icon className="w-6 h-6 text-base-content/80" />
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-base-content/70 leading-relaxed text-sm">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
