import PublicLayout from "../../components/layout/PublicLayout";
import { SITE_NAME } from "../../config/seo.config";

const PrivacyPolicyPage = () => (
  <PublicLayout>
    <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-3xl">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm opacity-60">Last updated: May 17, 2026</p>
        <p className="mt-5 opacity-75 leading-relaxed">
          This Privacy Policy describes how {SITE_NAME} (&quot;we&quot;, &quot;us&quot;) collects,
          uses, and protects information when you use our real-time messaging platform.
        </p>
      </header>

      <div className="space-y-8 text-sm sm:text-base opacity-85 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Information we collect</h2>
          <h3 className="text-lg font-medium mb-2">Account information</h3>
          <p className="mb-3 opacity-80">
            When you register, we collect your email, display name, profile details, and
            authentication credentials stored using industry-standard hashing.
          </p>
          <h3 className="text-lg font-medium mb-2">Messages and content</h3>
          <p className="opacity-80">
            Chat messages, media uploads, moments, and call metadata are processed to deliver the
            service. We do not sell your personal messages to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. How we use information</h2>
          <ul className="list-disc pl-6 space-y-2 opacity-80">
            <li>Provide and improve real-time messaging, calls, and notifications</li>
            <li>Authenticate users and maintain secure sessions</li>
            <li>Detect abuse, spam, and enforce our Terms of Service</li>
            <li>Comply with legal obligations where applicable</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Cookies &amp; similar technologies</h2>
          <p className="opacity-80">
            We use HTTP-only cookies for authentication and session management. You can control
            browser cookie settings, but disabling cookies may prevent you from using core features.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data retention &amp; security</h2>
          <p className="opacity-80">
            We retain data only as long as necessary to provide the service or meet legal
            requirements. We implement technical and organizational measures including encryption in
            transit (HTTPS), access controls, and rate limiting.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Your rights</h2>
          <p className="opacity-80">
            Depending on your jurisdiction, you may request access, correction, or deletion of your
            personal data by contacting us through your account settings or support channels.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Contact</h2>
          <p className="opacity-80">
            For privacy-related questions, contact our team via the in-app support or your registered
            email address on file with {SITE_NAME}.
          </p>
        </section>
      </div>
    </article>
  </PublicLayout>
);

export default PrivacyPolicyPage;
