import React, { useEffect, useState } from "react";
import PublicLayout from "../../components/layout/PublicLayout";
import { SITE_NAME } from "../../config/seo.config";
import { motion, useScroll, useSpring } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link2, ShieldCheck, Scale, AlertTriangle, Users, MessageSquare, Video, FileText, ChevronRight } from "lucide-react";

const SECTIONS = [
  { id: "acceptance", title: "1. Acceptance of Terms", icon: Scale },
  { id: "eligibility", title: "2. Eligibility Requirements", icon: Users },
  { id: "account", title: "3. Account Creation & Rules", icon: ShieldCheck },
  { id: "community", title: "4. Community Guidelines", icon: MessageSquare },
  { id: "messaging", title: "5. Messaging & Communication", icon: MessageSquare },
  { id: "moments-sparks", title: "6. Moments & Sparks", icon: Video },
  { id: "prohibited", title: "7. Prohibited Activities", icon: AlertTriangle },
  { id: "intellectual-property", title: "8. Intellectual Property", icon: FileText },
  { id: "enforcement", title: "9. Enforcement & Suspension", icon: ShieldCheck },
  { id: "liability", title: "10. Limitation of Liability", icon: Scale },
];

const TermsPage = () => {
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
      const scrollPosition = window.scrollY + 100; // offset for sticky header

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
    // You could trigger a toast here if available in your context
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
        <title>Terms & Conditions - {SITE_NAME}</title>
        <meta name="description" content={`Terms and Conditions for using ${SITE_NAME}. Read our rules, guidelines, and legal agreements.`} />
      </Helmet>

      {/* Reading Progress Bar */}
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
                <Scale className="w-4 h-4 mr-2" /> Legal Agreement
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-base-content mb-6">
                Terms & Conditions
              </h1>
              <p className="text-lg sm:text-xl text-base-content/70 leading-relaxed mb-6">
                These Terms govern your access to and use of {SITE_NAME}, a real-time communication platform. Please read them carefully before creating an account.
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
            
            {/* 1. Acceptance */}
            <SectionHeader {...SECTIONS[0]} />
            <p>
              By creating an account, accessing, or using {SITE_NAME} ("we," "us," or "our"), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, you may not use our services. 
            </p>
            <p>
              {SITE_NAME} is a real-time communication platform providing text messaging, group chats, voice calls, video calls, ephemeral stories ("Moments"), and feed posts ("Sparks").
            </p>

            {/* 2. Eligibility */}
            <SectionHeader {...SECTIONS[1]} />
            <p>
              You must be at least <strong>13 years old</strong> (or the minimum legal age in your country) to use {SITE_NAME}. If you are under 18, you must have your parent or legal guardian's permission to use the platform.
            </p>
            <p>
              By using the platform, you represent and warrant that you meet all eligibility requirements and have not been previously banned or removed from {SITE_NAME}.
            </p>

            {/* 3. Account */}
            <SectionHeader {...SECTIONS[2]} />
            <p>
              To access most features, you must register for an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete information during registration.</li>
              <li>Maintain the security and confidentiality of your password and authentication tokens.</li>
              <li>Promptly notify us if you discover or suspect any security breaches related to your account.</li>
              <li>Take full responsibility for all activities that occur under your account.</li>
            </ul>
            <div className="bg-base-200 p-6 rounded-2xl border border-base-300 my-6">
              <h4 className="font-semibold flex items-center text-base-content mt-0"><Users className="w-5 h-5 mr-2" /> Username Policy</h4>
              <p className="text-sm mb-0">
                Usernames must not impersonate others, contain hate speech, or infringe on intellectual property rights. We reserve the right to reclaim usernames on behalf of businesses or individuals holding legal claim or trademark to those names.
              </p>
            </div>

            {/* 4. Community */}
            <SectionHeader {...SECTIONS[3]} />
            <p>
              {SITE_NAME} is built on mutual respect. You agree to interact with other users courteously. We do not tolerate:
            </p>
            <ul>
              <li><strong>Harassment & Bullying:</strong> Repeatedly targeting individuals with unwanted communication or abuse.</li>
              <li><strong>Hate Speech:</strong> Attacking individuals based on race, ethnicity, national origin, religion, sexual orientation, caste, sex, gender, gender identity, or serious disease/disability.</li>
              <li><strong>Impersonation:</strong> Pretending to be someone else or a representative of {SITE_NAME}.</li>
            </ul>

            {/* 5. Messaging */}
            <SectionHeader {...SECTIONS[4]} />
            <p>
              Our chat and calling services (including Voice over IP and Video Calls) are designed for personal communication. You agree not to:
            </p>
            <ul>
              <li>Use the communication features to send spam, unsolicited promotions, or phishing links.</li>
              <li>Record voice or video calls without the explicit consent of all participating parties, in accordance with applicable local laws.</li>
              <li>Use automated systems (bots) to send messages without our prior written approval.</li>
            </ul>

            {/* 6. Moments & Sparks */}
            <SectionHeader {...SECTIONS[5]} />
            <p>
              <strong>Moments</strong> are ephemeral stories that disappear after 24 hours. <strong>Sparks</strong> are persistent feed posts. By uploading media or text to Moments, Sparks, or Polls, you understand that:
            </p>
            <ul>
              <li>Other users can view, screenshot, or record your content before it disappears.</li>
              <li>You are solely responsible for the content you post.</li>
              <li>Content must not contain explicit violence, non-consensual sexual content, or illegal material.</li>
            </ul>

            {/* 7. Prohibited */}
            <SectionHeader {...SECTIONS[6]} />
            <p>
              In addition to the above, you must not:
            </p>
            <ul>
              <li>Reverse engineer, decompile, or disassemble any aspect of {SITE_NAME}.</li>
              <li>Interfere with or disrupt the access of any user, host, or network, including sending a virus, overloading, flooding, or scripting the creation of content.</li>
              <li>Use the platform for any illegal purpose or in violation of any local, state, national, or international law.</li>
            </ul>

            {/* 8. IP */}
            <SectionHeader {...SECTIONS[7]} />
            <p>
              <strong>Your Content:</strong> You retain ownership of any intellectual property rights that you hold in the content you submit to the platform. However, by uploading content, you grant {SITE_NAME} a worldwide, royalty-free license to use, host, store, reproduce, and distribute that content solely for the purpose of operating and improving our services.
            </p>
            <p>
              <strong>Our Content:</strong> The platform, including its code, design, features, and branding, is owned by {SITE_NAME} and is protected by copyright, trademark, and other laws.
            </p>

            {/* 9. Enforcement */}
            <SectionHeader {...SECTIONS[8]} />
            <p>
              We utilize automated systems (including banned word filters) and manual moderation (via user reports and audit logs) to enforce these Terms.
            </p>
            <div className="bg-error/10 p-6 rounded-2xl border border-error/20 my-6 text-error-content">
              <h4 className="font-semibold flex items-center mt-0 text-error"><AlertTriangle className="w-5 h-5 mr-2" /> Suspension & Termination</h4>
              <p className="text-sm mb-0">
                We reserve the right to suspend or permanently terminate your account, remove your content, or restrict your access to {SITE_NAME} at our sole discretion, without prior notice or liability, for any reason, including violation of these Terms.
              </p>
            </div>

            {/* 10. Liability */}
            <SectionHeader {...SECTIONS[9]} />
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, {SITE_NAME} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICES; OR (C) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.
            </p>

            <hr className="my-12 border-base-300" />
            
            <h3 className="text-xl font-bold mb-4 text-base-content">Contact Us</h3>
            <p>
              If you have any questions about these Terms, please contact us via the support section in the app or email our legal team at legal@{SITE_NAME.toLowerCase().replace(/\s+/g, '')}.com.
            </p>
            
          </article>
        </div>
      </div>
    </PublicLayout>
  );
};

export default TermsPage;
