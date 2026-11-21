import { siteConfig } from "../config/site";
import { uiClasses, iconLabel } from "../utils/presentation";
import { useBusinessInfo } from "../hooks/useBusinessInfo";
import { useServices } from "../hooks/useServices";
import { useFAQ } from "../hooks/useFAQ";
import ContentEmptyState from "../components/ContentEmptyState";
import FeedbackMessage from "../components/FeedbackMessage";
import Footer from "../components/Footer";
import ContactForm from "../components/forms/ContactForm";
import Header from "../components/Header";
import SEO from "../components/SEO";
import FAQSection from "../components/FAQSection";
import { textColors } from "../utils/colorClasses";
import HeroSection from "../components/HeroSection";
export default function Contact() {
    const businessData = useBusinessInfo();
    const businessSlice = businessData.slice;
    const servicesData = useServices();
    const services = servicesData.items;
    const faqData = useFAQ();
    const contactFAQ = faqData.items.find(faqSection => faqSection.title.includes("Contact"));
    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };
    return (<main className="min-h-screen">
      <SEO title={"Bytewave Sites | Contact".replaceAll("Bytewave Sites", siteConfig.name)} description={"Reach out to Bytewave Sites for questions, issues, or free consultations.".replaceAll("Bytewave Sites", siteConfig.name)} canonicalPath="/contact"/>

      <Header />
      
      
      <HeroSection title="Contact Us" subtitle={"Reach out to Bytewave Sites for questions, issues, or free consultations.".replaceAll("Bytewave Sites", siteConfig.name)}/>

      
      <section>
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            
            <ContactForm />

            
            <div>
              {businessData.error && <FeedbackMessage type="error" message={businessData.error} onClose={businessData.dismissError} retry={businessData.retry}/>}
              <div>
                <h2>Get in Touch</h2>
                <p>
                  Ready to take your business online? We're here to help you every step of the way. 
                  Contact us today for a free consultation.
                </p>
              </div>

              <div>
                <div className="flex items-start">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <span aria-hidden="true">{iconLabel("ri-mail-line text-white text-xl")}</span>
                  </div>
                  <div>
                    <h3>Email Us</h3>
                    {!businessSlice.info?.emails?.length && <p>Email contact details will appear here when available.</p>}
                    {businessSlice.info?.emails?.map((email, i) => (<p key={i}>{email.address}</p>))}
                   </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <span aria-hidden="true">{iconLabel("ri-phone-line text-white text-xl")}</span>
                  </div>
                  <div>
                    <h3>Call Or Text Us</h3>
                    <p>{businessSlice.info?.phoneNumber || "Phone contact details will appear here when available."}</p>
                    {!businessSlice.info?.businessHours?.length && <p>Business hours will appear here when available.</p>}
                    

            {businessSlice.info?.businessHours && (businessSlice.info?.businessHours.map((day, index) => (<span key={index}>
                  <p>{day.day}: {day.closed ? "Closed" : `${formatTime(day.openTime)} - ${formatTime(day.closeTime)}`}</p>
                  
                  
                </span>)))}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <span aria-hidden="true">{iconLabel("ri-map-pin-line text-white text-xl")}</span>
                  </div>
                  
                  <div>
                    <h3>{businessSlice.info?.addressPrecursor === 'based-in' ? 'Based In' : 'Located At'}</h3>
                    <p>{businessSlice.info?.address || "Location details will appear here when available."}</p>
                    <p>Serving clients nationwide</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <span aria-hidden="true">{iconLabel("ri-time-line text-white text-xl")}</span>
                  </div>
                  <div>
                    <h3>Response Time</h3>
                    <p>Within 24 hours</p>
                    <p>Emergency support available</p>
                  </div>
                </div>
              </div>

              
              <div>
                {servicesData.error && <FeedbackMessage type="error" message={servicesData.error} onClose={servicesData.dismissError} retry={servicesData.retry}/>}
                <h3>Quick Services</h3>
                {services.length === 0 && <p>Service offerings and pricing will appear here when available.</p>}
                <div className="grid grid-cols-2 gap-4">
                  {services?.map((service, index) => (<div key={index}>
                      <div className={uiClasses(`text-2xl font-bold ${textColors[service.serviceColor]}`)}>{service.price}</div>
                      <div>{service.title}</div>
                    </div>))}
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      {faqData.error && <FeedbackMessage type="error" message={faqData.error} onClose={faqData.dismissError} retry={faqData.retry}/>}
      {!contactFAQ?.faqs.length && <ContentEmptyState title="Contact FAQ" description="Questions and answers about getting in touch will appear here when available."/>}
      {contactFAQ?.faqs.length! > 0 && (<div>
            <FAQSection faqSection={contactFAQ!}/>
          </div>)}

      <Footer />
    </main>);
}
