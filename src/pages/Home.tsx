import { siteConfig } from "../config/site";
import { uiClasses, iconLabel } from "../utils/presentation";
import { useServices } from "../hooks/useServices";
import FeedbackMessage from "../components/FeedbackMessage";
import ServicesEmptyState from "../components/ServicesEmptyState";
import ConsultationForm from "../components/forms/ConsultationForm";
import Footer from "../components/Footer";
import Header from "../components/Header";
import SEO from "../components/SEO";
import { hoveredOnLargeShadowColors, hoveredShadowColors, shadowColors, textColors } from "../utils/colorClasses";
import { useActiveOnScroll } from "../hooks/useActiveOnScroll";
import AnimatedBackground from "../components/AnimatedBackground";
export default function Home() {
    const servicesData = useServices();
    const services = servicesData.items;
    const featuredServices = services.filter((service) => service.featured);
    const { activeIds, setRef } = useActiveOnScroll();
    return (<main className="min-h-screen">
      <SEO title={"Bytewave Sites | Home".replaceAll("Bytewave Sites", siteConfig.name)} description={"Learn about Bytewave Sites and explore our services.".replaceAll("Bytewave Sites", siteConfig.name)} canonicalPath="/"/>
      <Header />
      
      

    <section className="relative min-h-screen flex items-center overflow-hidden">
      <AnimatedBackground />

      <div className="absolute inset-0" />

      <div className="relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div>
            <h1>
              Professional Web
              <span className="block">Solutions</span>
            </h1>

            <p>
              From stunning websites to reliable hosting, we deliver complete digital solutions that help your business thrive online.
            </p>

            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-shield-check-line text-white text-sm")}</span>
                </div>
                <span>Free SSL Certificates</span>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-global-line text-white text-sm")}</span>
                </div>
                <span>Free Domain Names</span>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-gift-line text-white text-sm")}</span>
                </div>
                <span>3 Months Free Hosting*</span>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-cloud-line text-white text-sm")}</span>
                </div>
                <span>AWS Cloud Solutions</span>
              </div>
            </div>

            <div>
              <p>
                <span>*Referral Bonus:</span> For every client you refer, you get 3 months of free hosting!
              </p>
            </div>
          </div>

          
          <div>
            <ConsultationForm />
          </div>
        </div>
      </div>

    </section>
      {servicesData.error && <FeedbackMessage type="error" message={servicesData.error} onClose={servicesData.dismissError} retry={servicesData.retry}/>}
    <div className="flex flex-wrap justify-center gap-8 items-stretch">
  {services.length === 0 && <ServicesEmptyState />}
  {services
            .filter(service => !service.featured)
            .map((service) => {
            return (<div key={service.id} ref={setRef(service.id)} className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] flex">
        <div className={uiClasses(`
            w-full bg-slate-700 p-8 rounded-xl border border-slate-600
            transition-all duration-300 flex flex-col
            
          
            ${activeIds.includes(service.id)
                ? `-translate-y-2 shadow-xl ${shadowColors[service.serviceColor]}`
                : ""}

            lg:hover:-translate-y-2 lg:hover:shadow-xl ${hoveredOnLargeShadowColors[service.serviceColor]}
          `)}>

          <div className="flex items-center gap-3">
            <span aria-hidden="true">{iconLabel(`${service.icon} ${textColors[service.serviceColor]} text-2xl leading-none`)}</span>
            <h3>
              {service.title}
            </h3>
          </div>

          <p>
            {service.shortDescription}
          </p>

          <div>
            {service.subtitle}
          </div>
        </div>
      </div>);
        })}
    </div>

      
      {featuredServices.length > 0 && (featuredServices.map((service) => (<section key={service.id} ref={setRef(service.id)}>
              <div>
                <div className="max-w-4xl">
                  <h2>{service.featuredTitle}</h2>
                  <p>
                    {service.featuredDescription}
                  </p>
                  <div className={uiClasses(`
                      group relative bg-gradient-to-r from-blue-600 to-purple-600 
                      p-8 rounded-2xl overflow-hidden
                      transition-all duration-300

                      ${activeIds.includes(service.id)
            ? `-translate-y-2 shadow-xl scale-[1.02] ${shadowColors[service.serviceColor]}`
            : "scale-100"}

                      hover:-translate-y-2 hover:shadow-xl ${hoveredShadowColors[service.serviceColor]}
                    `)}>                    
                    <div>
                      <h3>{service.title}</h3>
                      <p>{service.shortDescription}</p>
                      <div>{service.price}</div>
                      <p>{service.subtitle}</p>
                    </div>
                  </div>

                </div>
              </div>
            </section>)))}
      

      <Footer />
    </main>);
}
