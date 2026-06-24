import React, { useEffect, useState } from "react";
import PublicLayout from "../../components/layout/PublicLayout";
import { SITE_NAME } from "../../config/seo.config";
import { motion, useScroll, useSpring } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link2, Shield, Eye, Database, Lock, Server, Trash2, Globe, Clock, Smartphone } from "lucide-react";

const SECTIONS = [
  { id: "collection", title: "1. Information We Collect", icon: Database },
  { id: "usage", title: "2. How We Use Information", icon: Eye },
  { id: "sharing", title: "3. Information Sharing", icon: Globe },
  { id: "retention", title: "4. Data Retention", icon: Clock },
  { id: "security", title: "5. Data Security", icon: Lock },
  { id: "cookies", title: "6. Cookies & Tracking", icon: Smartphone },
  { id: "rights", title: "7. Your Privacy Rights", icon: Shield },
  { id: "deletion", title: "8. Account Deletion", icon: Trash2 },
];

const PrivacyPolicyPage = () => {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = SECTIONS.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const copyLink = (id) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url);
  };

  const SectionHeader = ({ id, title, icon: Icon }) => (
    <div className="flex items-center group mb-6 mt-16 first:mt-0 relative" id={id}>
      <Icon className="w-7 h-7 text-primary mr-3" />
      <h2 className="text-2xl sm:text-3xl font-bold text-base-content">{title}</h2>
      <button 
        onClick={() => copyLink(id)}
        className="ml-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-base-200 hover:bg-base-300 text-base-content/60"
        aria-label="Copy link to section"
      >
        <Link2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <PublicLayout>
      <Helmet>
        <title>Privacy Policy - {SITE_NAME}</title>
        <meta name="description" content={`Privacy Policy for ${SITE_NAME}. Learn how we collect, use, and protect your data.`} />
      </Helmet>

      {/* Reading Progress */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-[100] origin-left"
        style={{ scaleX }}
      />

      <div className="min-h-screen bg-base-100 selection:bg-primary/30">
        {/* Premium Header */}
        <div className="bg-base-200/50 border-b border-base-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 backdrop-blur-sm border border-primary/20">
                <Shield className="w-4 h-4 mr-2" /> Privacy Commitment
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-base-content mb-6">
                Privacy Policy
              </h1>
              <p className="text-lg sm:text-xl text-base-content/70 leading-relaxed mb-6">
                At {SITE_NAME}, your privacy is our priority. This policy explains what data we collect, why we collect it, and how we protect it across our messaging, calling, and social features.
              </p>
              <div className="flex items-center text-sm font-medium text-base-content/50">
                <span>Effective Date: June 21, 2026</span>
                <span className="mx-3">•</span>
                <span>Version 2.0</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-12 lg:gap-24 relative">
          
          {/* Sticky Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-6">Contents</h3>
              <nav className="space-y-1">
                {SECTIONS.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                      activeSection === section.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                    }`}
                  >
                    <section.icon className={`w-4 h-4 mr-3 ${activeSection === section.id ? "text-primary" : "opacity-50"}`} />
                    {section.title.replace(/^\d+\.\s/, '')}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <article className="flex-1 max-w-3xl prose prose-base sm:prose-lg prose-headings:text-base-content prose-p:text-base-content/80 prose-li:text-base-content/80 prose-a:text-primary hover:prose-a:text-primary-focus">
            
            {/* 1. Collection */}
            <SectionHeader {...SECTIONS[0]} />
            <p>We collect information you provide directly to us, as well as data gathered automatically when you use {SITE_NAME}.</p>
            <ul>
              <li><strong>Account Information:</strong> When you register, we collect your email address, chosen username, password (hashed via bcrypt), and profile details (display name, avatar).</li>
              <li><strong>Connections & Social Graph:</strong> We store your friend requests, accepted friends, blocked users, and group memberships.</li>
              <li><strong>Messages & Communications:</strong> We process and store your chat messages, shared media, voice/video call history logs (but not the audio/video streams themselves), Moments, Sparks, and Poll responses.</li>
              <li><strong>Device & Login Data:</strong> IP addresses, browser type, device information, and login history (stored for security and session management).</li>
            </ul>

            {/* 2. Usage */}
            <SectionHeader {...SECTIONS[1]} />
            <p>Your data is used to provide and improve the {SITE_NAME} experience. Specifically, we use your information to:</p>
            <ul>
              <li>Deliver messages, notifications, and real-time call signaling.</li>
              <li>Authenticate your account and maintain secure active sessions.</li>
              <li>Display your Moments to your friends and Sparks to the community.</li>
              <li>Monitor for suspicious activity, spam, and violations of our Terms & Conditions via audit logs and moderation systems.</li>
            </ul>

            {/* 3. Sharing */}
            <SectionHeader {...SECTIONS[2]} />
            <p>We do not sell your personal data. We only share information with third parties in the following circumstances:</p>
            <ul>
              <li><strong>Service Providers (Sub-processors):</strong> We use trusted partners to power core features. This includes <strong>Stream</strong> (for scalable chat infrastructure), <strong>LiveKit</strong> (for WebRTC voice and video routing), and infrastructure providers like <strong>MongoDB</strong> and <strong>Redis</strong>.</li>
              <li><strong>Legal Compliance:</strong> We may disclose information if required by law, subpoena, or other legal process.</li>
              <li><strong>Safety:</strong> To protect the rights, property, or safety of {SITE_NAME}, our users, or the public.</li>
            </ul>

            {/* 4. Retention */}
            <SectionHeader {...SECTIONS[3]} />
            <div className="bg-base-200 p-6 rounded-2xl border border-base-300 my-6">
              <h4 className="font-semibold flex items-center mt-0 text-base-content"><Clock className="w-5 h-5 mr-2" /> Data Lifespan</h4>
              <ul className="text-sm mb-0 mt-2">
                <li><strong>Moments (Stories):</strong> Automatically deleted from our active servers 24 hours after posting.</li>
                <li><strong>Chat History & Sparks:</strong> Retained indefinitely until you delete them or your account.</li>
                <li><strong>Call Logs:</strong> Metadata (duration, participants) is kept for your history, but audio/video is never recorded or stored.</li>
                <li><strong>Server Logs:</strong> IP and connection logs are routinely rotated and purged.</li>
              </ul>
            </div>

            {/* 5. Security */}
            <SectionHeader {...SECTIONS[4]} />
            <p>
              We implement robust security measures designed to protect your data. This includes HTTPS/TLS for all data in transit, bcrypt hashing for passwords, JWTs for stateless secure sessions, and rate-limiting to prevent brute-force attacks. However, no internet transmission is 100% secure, and we cannot guarantee absolute security.
            </p>

            {/* 6. Cookies */}
            <SectionHeader {...SECTIONS[5]} />
            <p>
              {SITE_NAME} uses cookies and similar local storage technologies (like browser local storage) to keep you logged in, manage your session securely (via HTTP-only Refresh Tokens), and remember your preferences (like Dark Mode). We do not use intrusive cross-site tracking cookies.
            </p>

            {/* 7. Rights */}
            <SectionHeader {...SECTIONS[6]} />
            <p>
              Depending on your location (e.g., GDPR in Europe, CCPA in California), you have rights regarding your data:
            </p>
            <ul>
              <li><strong>Access & Portability:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Edit your profile and account information directly within the app settings.</li>
              <li><strong>Withdraw Consent:</strong> Revoke permissions for push notifications or camera/microphone access via your device settings.</li>
            </ul>

            {/* 8. Deletion */}
            <SectionHeader {...SECTIONS[7]} />
            <p>
              You can delete your account at any time through the App Settings. Initiating an account deletion will:
            </p>
            <ol>
              <li>Immediately log you out and invalidate all active sessions and refresh tokens.</li>
              <li>Remove your profile from the public directory and friends' lists.</li>
              <li>Delete your personal data, Sparks, and Moments from our active databases.</li>
            </ol>
            <div className="bg-warning/10 p-4 rounded-xl border border-warning/20 mt-4 text-warning-content text-sm">
              Note: Messages you have sent in group chats or to other users may remain visible to them, similar to standard email or SMS protocols.
            </div>

            <hr className="my-12 border-base-300" />
            
            <h3 className="text-xl font-bold mb-4 text-base-content">Contact Us</h3>
            <p>
              If you have questions about this Privacy Policy, or wish to exercise your data rights, please contact our Data Protection Officer at privacy@{SITE_NAME.toLowerCase().replace(/\s+/g, '')}.com.
            </p>
            
          </article>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PrivacyPolicyPage;
