import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  BellIcon,
  LockIcon,
  MessageCircleIcon,
  MicIcon,
  SmartphoneIcon,
  UsersRoundIcon,
} from "lucide-react";
import PublicLayout from "../../components/layout/PublicLayout";

const featureSections = [
  {
    icon: MessageCircleIcon,
    title: "Real-Time Chat",
    description:
      "Send messages instantly with delivery indicators, reactions, pinned messages, and a polished chat experience powered by modern WebSocket technology.",
  },
  {
    icon: UsersRoundIcon,
    title: "Group Messaging",
    description:
      "Create groups, manage members, share media, run polls, and keep communities organized with moderation-ready admin tools.",
  },
  {
    icon: MicIcon,
    title: "Voice Messages & Calls",
    description:
      "Record voice notes in-chat or jump into HD voice and video calls — perfect for remote teams and long-distance friends.",
  },
  {
    icon: LockIcon,
    title: "Security & Privacy",
    description:
      "HTTP-only cookies, rate limiting, input validation, secure uploads, and session management designed for production deployments.",
  },
  {
    icon: BellIcon,
    title: "Smart Notifications",
    description:
      "Browser push and in-app alerts keep you in the loop without overwhelming your workflow — mute what you don't need.",
  },
  {
    icon: SmartphoneIcon,
    title: "Responsive Everywhere",
    description:
      "A mobile-first layout with bottom navigation on phones and a full sidebar on desktop — one app, every screen size.",
  },
];

const FeaturesPage = () => (
  <PublicLayout>
    <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <header className="max-w-3xl mb-14">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Zashly Features — Real-Time Messaging Built for You
        </h1>
        <p className="mt-5 text-lg opacity-75 leading-relaxed">
          Discover why teams and communities choose Zashly for secure communication, instant
          messaging, and rich collaboration — from DMs to group channels and video calls.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
        {featureSections.map(({ icon: Icon, title, description }, i) => (
          <motion.section
            key={title}
            className="flex gap-5 p-6 rounded-2xl bg-base-200/50 border border-base-300/40"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <div
              className="shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center"
              aria-hidden="true"
            >
              <Icon className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">{title}</h2>
              <p className="opacity-70 text-sm leading-relaxed">{description}</p>
            </div>
          </motion.section>
        ))}
      </div>

      <div className="mt-16 text-center p-8 rounded-2xl bg-primary/10 border border-primary/20">
        <h2 className="text-2xl font-bold">Start messaging in seconds</h2>
        <p className="mt-2 opacity-70">Free account · No credit card required</p>
        <Link to="/signup" className="btn btn-primary btn-lg mt-6">
          Get started with Zashly
        </Link>
      </div>
    </article>
  </PublicLayout>
);

export default FeaturesPage;
