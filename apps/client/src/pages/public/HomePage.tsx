import { PageWrapper } from "../../components/layout/PageWrapper";
import HeroSection from "./home/HeroSection";
import HomeDeferredSections from "./home/HomeDeferredSections";

export function HomePage() {
  return (
    <PageWrapper>
      <HeroSection />
      <HomeDeferredSections />
    </PageWrapper>
  );
}
