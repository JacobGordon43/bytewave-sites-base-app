import { siteConfig } from "../config/site";
import { uiClasses, iconLabel } from "../utils/presentation";
import { useAbout } from "../hooks/useAbout";
import ContentEmptyState from "../components/ContentEmptyState";
import FeedbackMessage from "../components/FeedbackMessage";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { Link } from "react-router";
import SEO from "../components/SEO";
import HeroSection from "../components/HeroSection";
export default function About() {
    const aboutData = useAbout();
    const sections = aboutData.items;
    const getFlexItemWidth = (columns: number) => {
        switch (columns) {
            case 1:
                return 'w-full';
            case 2:
                return 'w-full md:w-[calc(50%-0.75rem)]';
            case 3:
                return 'w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]';
            default:
                return 'w-full';
        }
    };
    return (<main className="min-h-screen">
      <SEO title={"Bytewave Sites | About".replaceAll("Bytewave Sites", siteConfig.name)} description={"Learn more about the values and story of Bytewave Sites".replaceAll("Bytewave Sites", siteConfig.name)} canonicalPath="/about"/>
      <Header />

      
      <HeroSection title="About Us" subtitle={"Learn more about the values and story of Bytewave Sites".replaceAll("Bytewave Sites", siteConfig.name)}/>
      {aboutData.error && <FeedbackMessage type="error" message={aboutData.error} onClose={aboutData.dismissError} retry={aboutData.retry}/>}

      
      {sections.length === 0 && <ContentEmptyState title="Our Story" description="Our story, values, and team information will appear here when available."/>}
      {sections.map((section, sectionIndex) => (<section key={section.id || sectionIndex}>
          <div>
            <div className={uiClasses(`${section.backgroundColor || 'bg-slate-800'} rounded-xl p-8`)}>
              {section.title && (<div>
                  <h2>
                    {section.title}
                  </h2>
                  {section.subtitle && (<p>{section.subtitle}</p>)}
                </div>)}

              
              <div className="flex flex-wrap justify-center gap-6">
                {section.blocks?.map((block, blockIndex) => (<div key={block.id || blockIndex} className={uiClasses(`${getFlexItemWidth(section.columns)} flex`)}>
                    
                    {block.type === 'image' ? (<div className="overflow-hidden w-full">
                        {block.imageUrl ? (<img className="w-full" src={block.imageUrl} alt={block.title || 'Content'}/>) : (<div className="w-full h-48 flex items-center justify-center">
                            <span aria-hidden="true">{iconLabel("ri-image-line text-slate-400 text-3xl")}</span>
                          </div>)}
                      </div>) : section.isCard ? (<div className="h-full w-full">
                        {section.cardType === 'icon' && (<div className={uiClasses(`w-14 h-14 ${block.iconColor || 'bg-blue-600'} rounded-xl flex items-center justify-center mx-auto mb-4`)}>
                            <span aria-hidden="true">{iconLabel(`${block.icon || 'ri-star-line'} text-white text-xl`)}</span>
                          </div>)}

                        {section.cardType === 'image' && (<div className="w-full h-32 overflow-hidden">
                            {block.imageUrl ? (<img className="w-full h-full" src={block.imageUrl} alt={block.title || 'Content'}/>) : (<div className="w-full h-full flex items-center justify-center">
                                <span aria-hidden="true">{iconLabel("ri-image-line text-slate-400 text-2xl")}</span>
                              </div>)}
                          </div>)}

                        {block.title && (<h3>
                            {block.title}
                          </h3>)}

                        <p>
                          {block.description || ''}
                        </p>
                      </div>) : (<div className="h-full w-full">
                        {block.title && (<h3>
                            {block.title}
                          </h3>)}
                        <p>
                          {block.description || 'Block description...'}
                        </p>
                      </div>)}
                  </div>))}
              </div>
            </div>
          </div>
        </section>))}

      
      <section>
        <div>
          <div className="max-w-4xl">
            <h2>
              Ready to Work Together?
            </h2>
            <p>
              Let's discuss how we can help your business succeed online
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                Get In Touch
              </Link>
              <Link to="/portfolio">
                View Our Work
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>);
}
