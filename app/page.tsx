import FAQWrapper from "./components/FAQDATA";
import Hero from "./components/ui/Hero";

import AboutSection from "./components/AboutSection";
import StatsSection from "./components/StatsSection";
export default function Home() {
  return (
    <>
      {/* Header */}
   
      {/* Main Content */}
      <main className="">
       <Hero/>
       <AboutSection/>
       <StatsSection/>
       <FAQWrapper/>
      </main>

    
    </>
  );
}
