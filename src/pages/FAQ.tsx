import { siteConfig } from "../config/site";
import { iconLabel } from "../utils/presentation";
import { useBusinessInfo } from "../hooks/useBusinessInfo";
import { useFAQ } from "../hooks/useFAQ";
import ContentEmptyState from "../components/ContentEmptyState";
import FeedbackMessage from "../components/FeedbackMessage";
import FAQSection from "../components/FAQSection";
import Footer from "../components/Footer";
import Header from "../components/Header";
import SEO from "../components/SEO";
import HeroSection from "../components/HeroSection";
export default function FAQ() {
    const businessData = useBusinessInfo();
    const businessSlice = businessData.slice;
    const faqData = useFAQ();
    const faqs = faqData.items.filter(section => section.faqs.length > 0);
    return (<main className="min-h-screen">
      <SEO title={"Bytewave Sites | FAQ".replaceAll("Bytewave Sites", siteConfig.name)} description="Explore our Frequently Asked Questions" canonicalPath="/faq"/>
      <Header />
      
      
      <HeroSection title="Frequently Asked Questions" subtitle="Find answers to common questions about our services, pricing, and technical details"/>

      
      <section>
        <div>
          {faqData.error && <FeedbackMessage type="error" message={faqData.error} onClose={faqData.dismissError} retry={faqData.retry}/>}
          {faqs.length === 0 && (<ContentEmptyState title="Frequently Asked Questions" description="Common questions and answers will appear here when available."/>)}

          {faqs.length > 0 && (faqs.map((faqSection, index) => (<FAQSection key={index} faqSection={faqSection}/>)))}
          
          

    

        </div>
      </section>

      
      <section>
        <div>
          <div className="max-w-2xl">
            <h2>Still Have Questions?</h2>
            <p>
              Can't find the answer you're looking for? Our team is here to help you with any questions about our services.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="w-12 h-12 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-mail-line text-white text-xl")}</span>
                </div>
                <h3>Email Support</h3>
                <p>Get detailed answers via email</p>
                <a href="/contact" className="inline-block">
                  Contact Us
                </a>
              </div>
              
              <div>
                {businessData.error && <FeedbackMessage type="error" message={businessData.error} onClose={businessData.dismissError} retry={businessData.retry}/>}
                <div className="w-12 h-12 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-phone-line text-white text-xl")}</span>
                </div>
                <h3>Phone Consultation</h3>
                <p>Speak directly with our team</p>
                {businessSlice.info?.phoneNumber ? <a href={`tel:${businessSlice.info?.phoneNumber?.replace(/\D/g, "")}`} className="inline-block">
                  Call {businessSlice.info?.phoneNumber}
                </a> : <p>Phone consultation details will appear here when available.</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>);
}
