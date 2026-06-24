import { motion } from "framer-motion";
import { Link } from "react-router";

export default function FinalCta() {
  return (
    <section className="py-24 relative overflow-hidden bg-base-300">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-base-300 to-secondary/20" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-base-content/10 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto bg-base-100/60 backdrop-blur-xl p-10 sm:p-16 rounded-[3rem] shadow-2xl border border-base-100/50"
        >
          <h2 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight">
            Join Zashly Today.
          </h2>
          <p className="text-xl text-base-content/70 mb-10 max-w-xl mx-auto leading-relaxed">
            Stop switching between apps. Get everything you need for messaging, calls, and community in one beautiful platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="btn btn-primary btn-lg rounded-full px-10 shadow-xl shadow-primary/20 w-full sm:w-auto text-lg">
              Create Free Account
            </Link>
            <Link to="/features" className="btn btn-ghost btn-lg rounded-full px-10 w-full sm:w-auto text-lg hover:bg-base-200">
              Explore Features
            </Link>
          </div>
          <p className="mt-6 text-sm text-base-content/50">
            No credit card required. Free forever for individuals.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
