import PublicLayout from "../../components/layout/PublicLayout";
import { SITE_NAME } from "../../config/seo.config";

const TermsPage = () => (
  <PublicLayout>
    <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-3xl">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Terms &amp; Conditions</h1>
        <p className="mt-3 text-sm opacity-60">Last updated: May 17, 2026</p>
        <p className="mt-5 opacity-75 leading-relaxed">
          By accessing or using {SITE_NAME}, you agree to these Terms &amp; Conditions. Please read
          them carefully before creating an account.
        </p>
      </header>

      <div className="space-y-8 text-sm sm:text-base opacity-85 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of terms</h2>
          <p className="opacity-80">
            These terms govern your use of our messaging application, including real-time chat, voice
            and video calls, group features, and related services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Eligibility &amp; accounts</h2>
          <p className="opacity-80">
            You must provide accurate registration information and keep your credentials secure. You
            are responsible for all activity under your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Acceptable use</h2>
          <p className="opacity-80 mb-3">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2 opacity-80">
            <li>Harass, threaten, or abuse other users</li>
            <li>Share illegal content or spam</li>
            <li>Attempt to breach security or access others&apos; accounts</li>
            <li>Use automated systems to scrape or overload the service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Service availability</h2>
          <p className="opacity-80">
            We strive for high uptime but do not guarantee uninterrupted access. Maintenance,
            updates, or factors beyond our control may affect availability.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Intellectual property</h2>
          <p className="opacity-80">
            {SITE_NAME} branding, software, and design are protected. You retain rights to content you
            create, but grant us a license to host and deliver it as part of the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Limitation of liability</h2>
          <p className="opacity-80">
            To the fullest extent permitted by law, {SITE_NAME} is provided &quot;as is&quot; without
            warranties. We are not liable for indirect or consequential damages arising from use of
            the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Changes</h2>
          <p className="opacity-80">
            We may update these terms periodically. Continued use after changes constitutes
            acceptance of the revised terms.
          </p>
        </section>
      </div>
    </article>
  </PublicLayout>
);

export default TermsPage;
