import { Link } from "react-router";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Globe, Heart, Rocket, ArrowRight } from "lucide-react";
import PublicLayout from "../../components/layout/PublicLayout";

const AboutPage = () => (
  <PublicLayout>
    <div className="flex flex-col w-full overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[60vh] bg-base-100">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-primary/10 via-base-100 to-base-100 dark:from-primary/5 dark:via-base-100 dark:to-base-100" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-base-200 border border-base-300 text-base-content/80 font-medium text-sm mb-8 shadow-sm"
          >
            <Globe className="w-4 h-4 text-primary" />
            Connecting the world in real-time
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-base-content mb-6 leading-tight"
          >
            Building the <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">next generation</span> of communication.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-base-content/70 leading-relaxed max-w-2xl mx-auto"
          >
            Zashly exists to make secure messaging and real-time chat accessible to everyone. Fast, secure, and designed for how people actually talk online today.
          </motion.p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-base-200/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold mb-4"
            >
              What we believe
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-base-content/70"
            >
              Whether you are connecting with friends across borders or coordinating a team, you deserve tools that respect your privacy and never slow you down.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: ShieldCheck,
                title: "Privacy by design",
                desc: "Security is not an afterthought. From authentication to uploads, Zashly is engineered with modern best practices."
              },
              {
                icon: Zap,
                title: "Speed matters",
                desc: "Real-time means real-time. WebSockets, optimistic UI, and a performance-focused frontend keep conversations flowing."
              },
              {
                icon: Heart,
                title: "Community first",
                desc: "Built for actual humans. We prioritize intuitive design and accessible interfaces over complex, bloated features."
              }
            ].map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + (idx * 0.1) }}
                className="bg-base-100 border border-base-300 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-base-200 shadow-sm border border-base-300 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-content group-hover:scale-110 transition-all">
                  <value.icon className="w-7 h-7 text-base-content/80 group-hover:text-primary-content transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-base-content/70 leading-relaxed">
                  {value.desc}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-primary text-primary-content">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <Rocket className="w-16 h-16 mx-auto mb-6 text-primary-content/80" />
            <h2 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight">
              Ready to experience the difference?
            </h2>
            <p className="text-xl text-primary-content/80 mb-10 max-w-xl mx-auto leading-relaxed">
              Join thousands of users experiencing secure messaging, group chats, and crystal clear HD calls.
            </p>
            
            <Link to="/signup" className="btn btn-base-100 bg-base-100 text-primary border-none hover:bg-base-200 btn-lg rounded-full px-10 shadow-2xl w-full sm:w-auto text-lg group">
              Create a free account
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  </PublicLayout>
);

export default AboutPage;
