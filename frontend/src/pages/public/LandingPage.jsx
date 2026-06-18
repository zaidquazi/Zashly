import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquareIcon,
  ShieldCheckIcon,
  VideoIcon,
  SparklesIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import PublicLayout from "../../components/layout/PublicLayout";
import OptimizedImage from "../../components/ui/OptimizedImage";

const features = [
  {
    icon: ZapIcon,
    title: "Real-Time Messaging",
    description:
      "Instant delivery with typing indicators, read receipts, and lightning-fast sync across devices.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Secure Communication",
    description:
      "Built with modern security practices — protected sessions, rate limiting, and privacy-first design.",
  },
  {
    icon: VideoIcon,
    title: "Voice & Video Calls",
    description:
      "Crystal-clear HD calls for one-on-one chats and group conversations without leaving the app.",
  },
  {
    icon: UsersIcon,
    title: "Groups & Communities",
    description:
      "Create group channels, share moments, and stay connected with friends and teams at scale.",
  },
  {
    icon: MessageSquareIcon,
    title: "Rich Media & Moments",
    description:
      "Share photos, voice messages, polls, and ephemeral moments — all in one beautiful interface.",
  },
];
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5 },
};

const titleContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};
const titleWord = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 14,
      stiffness: 120,
    },
  },
};
const LandingPage = () => {
  const words = ["instant", "private", "human"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);
  return (
    <PublicLayout>
    {/* Hero */}
    <section
      className="relative overflow-hidden border-b border-base-300/60"
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-24 pt-8 pb-16 sm:pt-10 sm:pb-20 lg:pt-12 lg:pb-28 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <motion.p
              className="text-sm font-medium text-primary mb-3 tracking-wide uppercase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Real-time chat · Secure messaging
            </motion.p>
            <motion.h1
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight flex flex-wrap items-center"
              variants={titleContainer}
              initial="hidden"
              animate="visible"
            >
              {["Messaging", "that", "feels"].map((word, idx) => (
                <motion.span
                  key={idx}
                  variants={titleWord}
                  className="inline-block mr-[0.25em] select-none"
                >
                  {word}
                </motion.span>
              ))}
              {" "}
              <span className="relative inline-block overflow-hidden h-[1.25em] align-top text-left min-w-[170px] sm:min-w-[210px] lg:min-w-[260px] select-none">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={words[index]}
                    initial={{ y: "80%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    exit={{ y: "-80%", opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-0 top-0 w-full whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary animate-gradient-shift py-1"
                  >
                    {words[index]}.
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>
            <motion.p
              className="mt-6 text-lg opacity-75 max-w-xl leading-relaxed"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              Zashly is a modern real-time chat and messaging app for secure communication, group
              conversations, HD voice &amp; video calls, and AI-ready workflows — free to get started.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65 }}
            >
              <Link to="/signup" className="btn btn-primary btn-lg">
                Start chatting free
              </Link>
              <Link to="/features" className="btn btn-outline btn-lg">
                Explore features
              </Link>
            </motion.div>
          </div>

          <motion.div
            className="relative max-w-lg mx-auto lg:mx-0 w-full group cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {/* Glowing backdrop halo */}
            <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary/20 via-accent/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-85 transition-opacity duration-500 animate-gradient-shift -z-10" />
            <OptimizedImage
              src="/i.png"
              alt="Zashly real-time messaging app connecting people worldwide"
              className="w-full h-auto rounded-2xl shadow-2xl border border-base-300/50 group-hover:animate-hue-shift relative z-10 bg-base-100 transition-all duration-500"
              width={512}
              height={512}
              priority
            />
          </motion.div>
        </div>
      </div>
    </section>
    {/* Features preview */}
    <section className="py-16 sm:py-20" aria-labelledby="features-preview-heading">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-24">
        <motion.header className="text-center max-w-2xl mx-auto mb-14" {...fadeUp}>
          <h2 id="features-preview-heading" className="text-3xl sm:text-4xl font-bold">
            Everything you need in one messaging app
          </h2>
          <p className="mt-4 opacity-70 text-lg">
            From private DMs to group channels and video calls — Zashly keeps your conversations
            fast, secure, and delightful.
          </p>
        </motion.header>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0">
          {features.map(({ icon: Icon, title, description }) => (
            <motion.li
              key={title}
              className="card bg-base-200/60 border border-base-300/50 shadow-sm hover:shadow-md transition-shadow"
              {...fadeUp}
            >
              <div className="card-body">
                <div
                  className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-2"
                  aria-hidden="true"
                >
                  <Icon className="size-6 text-primary" />
                </div>
                <h3 className="card-title text-lg">{title}</h3>
                <p className="opacity-70 text-sm leading-relaxed">{description}</p>
              </div>
            </motion.li>
          ))}
        </ul>
        <div className="text-center mt-12">
          <Link to="/features" className="btn btn-primary btn-wide">
            See all features
          </Link>
        </div>
      </div>
    </section>
    {/* CTA */}
    <section
      className="py-16 sm:py-20 bg-primary/10 border-y border-primary/20"
      aria-labelledby="cta-heading"
    >
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 text-center max-w-2xl">
        <h2 id="cta-heading" className="text-3xl font-bold">
          Ready for secure real-time chat?
        </h2>
        <p className="mt-4 opacity-75">
          Join thousands using Zashly for messaging, calls, and community — set up takes less than a
          minute.
        </p>
        <Link to="/signup" className="btn btn-primary btn-lg mt-8">
          Create your free account
        </Link>
      </div>
    </section>
  </PublicLayout>
  );
};
export default LandingPage;