import PublicLayout from "../../components/layout/PublicLayout";
import HeroSection from "../../components/landing/HeroSection";
import ProductShowcase from "../../components/landing/ProductShowcase";
import VoiceVideoSection from "../../components/landing/VoiceVideoSection";
import SecurityTrustSection from "../../components/landing/SecurityTrustSection";
import FeatureGrid from "../../components/landing/FeatureGrid";
import LiveStats from "../../components/landing/LiveStats";
import Testimonials from "../../components/landing/Testimonials";
import FounderCard from "../../components/landing/FounderCard";
import FinalCta from "../../components/landing/FinalCta";

const LandingPage = () => {
  return (
    <PublicLayout>
      <div className="flex flex-col w-full overflow-hidden">
        <HeroSection />
        <ProductShowcase />
        <VoiceVideoSection />
        <SecurityTrustSection />
        <FeatureGrid />
        <LiveStats />
        <Testimonials />
        <FounderCard />
        <FinalCta />
      </div>
    </PublicLayout>
  );
};

export default LandingPage;