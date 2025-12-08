import {
  CTASection,
  FeaturesSection,
  Footer,
  HeroSection,
} from "@/components/features/landing";

export default function Home() {
  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Preskoči na glavni sadržaj
      </a>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
        <Footer />
      </div>
    </>
  );
}
