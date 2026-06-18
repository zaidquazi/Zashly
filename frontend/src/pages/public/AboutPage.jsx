import { Link } from "react-router";
import PublicLayout from "../../components/layout/PublicLayout";

const AboutPage = () => (
  <PublicLayout>
    <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-5xl">
      <header className="mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">About Zashly</h1>
        <p className="mt-5 text-lg opacity-75 leading-relaxed">
          We are building the next generation of real-time communication — fast, secure, and
          designed for how people actually talk online today.
        </p>
      </header>

      <section className="prose prose-sm sm:prose-base max-w-none opacity-90 space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-3">Our mission</h2>
          <p className="leading-relaxed opacity-80">
            Zashly exists to make secure messaging and real-time chat accessible to everyone.
            Whether you are connecting with friends across borders, coordinating a team, or building
            a community, you deserve tools that respect your privacy and never slow you down.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">What we believe</h2>
          <h3 className="text-lg font-medium mb-2">Privacy by design</h3>
          <p className="leading-relaxed opacity-80 mb-4">
            Security is not an afterthought. From authentication to uploads and rate limiting, Zashly
            is engineered with modern best practices for production deployments.
          </p>
          <h3 className="text-lg font-medium mb-2">Speed matters</h3>
          <p className="leading-relaxed opacity-80">
            Real-time means real-time. WebSockets, optimistic UI, and a performance-focused frontend
            keep conversations flowing without friction.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-base-200/60 border border-base-300/50">
          <h2 className="text-xl font-semibold mb-2">Join us</h2>
          <p className="opacity-80 text-sm mb-4">
            Ready to experience secure messaging, group chats, and HD calls?
          </p>
          <Link to="/signup" className="btn btn-primary">
            Create a free account
          </Link>
        </div>
      </section>
    </article>
  </PublicLayout>
);

export default AboutPage;
