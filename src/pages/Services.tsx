import { siteConfig } from "../config/site";
import { useFAQ } from "../hooks/useFAQ";
import { useServices } from "../hooks/useServices";
import FeedbackMessage from "../components/FeedbackMessage";
import FAQSection from "../components/FAQSection";
import Footer from "../components/Footer";
import Header from "../components/Header";
import SEO from "../components/SEO";
import ServiceCard from "../components/cards/ServiceCard";
import ServicesEmptyState from "../components/ServicesEmptyState";
import ContentEmptyState from "../components/ContentEmptyState";
import { useState } from "react";
import type { ServiceData } from "../types/daoTypes";
import ServiceModal from "../components/modals/ServiceModal";
import { useInView } from "../hooks/useInView";
import ReferralSection from "../components/ReferralSection";
import HeroSection from "../components/HeroSection";
function AnimatedServiceCard({ service, onViewMore, }: {
    service: ServiceData;
    onViewMore: () => void;
}) {
    const { ref, isVisible } = useInView();
    return (<ServiceCard ref={ref} isVisible={isVisible} service={service} onViewMore={onViewMore}/>);
}
export default function Services() {
    const faqData = useFAQ();
    const serviceFAQ = faqData.items.find(faqSection => faqSection.title.includes("Services"));
    const servicesData = useServices();
    const services = servicesData.items;
    const [viewService, setViewService] = useState<ServiceData | null>(null);
    return (<main className="min-h-screen">
      <SEO title={"Bytewave Sites | Services".replaceAll("Bytewave Sites", siteConfig.name)} description={"Learn more about the services provided by Bytewave Sites".replaceAll("Bytewave Sites", siteConfig.name)} canonicalPath="/services"/>
      <Header />
      
      
      <HeroSection title="Our Services" subtitle="Comprehensive web solutions designed to help your business succeed in the digital world"/>


      
      <section>
        <div>
          {servicesData.error && <FeedbackMessage type="error" message={servicesData.error} onClose={servicesData.dismissError} retry={servicesData.retry}/>}
          {services.length === 0 && <ServicesEmptyState />}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {services.map((service, i) => (<AnimatedServiceCard key={i} service={service} onViewMore={() => setViewService(service)}/>))}
          </div>
        </div>
      </section>

      
      <ReferralSection />

      
      {faqData.error && <FeedbackMessage type="error" message={faqData.error} onClose={faqData.dismissError} retry={faqData.retry}/>}
      {!serviceFAQ?.faqs.length && <ContentEmptyState title="Services FAQ" description="Questions and answers about our services will appear here when available."/>}
      {serviceFAQ?.faqs.length! > 0 && (<FAQSection faqSection={serviceFAQ!}/>)}
      
      {viewService && (<ServiceModal service={viewService} onClose={() => setViewService(null)}/>)}
      <Footer />
    </main>);
}
