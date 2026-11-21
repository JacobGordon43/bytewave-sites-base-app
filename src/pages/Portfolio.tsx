import { siteConfig } from "../config/site";
import { uiClasses } from "../utils/presentation";
import { usePortfolio } from "../hooks/usePortfolio";
import FeedbackMessage from "../components/FeedbackMessage";
import Footer from "../components/Footer";
import Header from "../components/Header";
import PortfolioGrid from "../components/PortfolioGrid";
import SEO from "../components/SEO";
import { hoveredOnLargeShadowColors, shadowColors } from "../utils/colorClasses";
import HeroSection from "../components/HeroSection";
import { useActiveOnScroll } from "../hooks/useActiveOnScroll";
export default function Portfolio() {
    const portfolioData = usePortfolio();
    const portfolio = portfolioData.items;
    const { activeIds, setRef } = useActiveOnScroll();
    const calculateDisplayedProjectCount = () => {
        if (!portfolio || portfolio.length === 0)
            return 0;
        const count = portfolio.length;
        if (count < 11) {
            return count.toString();
        }
        else if (count % 10 === 0) {
            return count.toString();
        }
        else {
            const remainder = count % 10;
            return (count - remainder).toString() + "+";
        }
    };
    const stats = [
        {
            id: "projects",
            color: "blue",
            value: calculateDisplayedProjectCount(),
            label: `${portfolio.length === 1 ? "Project" : "Projects"} Completed`,
            textColor: "text-blue-400",
        },
        {
            id: "timeline",
            color: "green",
            value: "1-2 Weeks",
            label: "Average Completion Time",
            textColor: "text-green-400",
        },
        {
            id: "hosting",
            color: "purple",
            value: "All-in-One",
            label: "Website Development + Hosting",
            textColor: "text-purple-400",
        },
        {
            id: "custom",
            color: "orange",
            value: "100%",
            label: "Custom Built",
            textColor: "text-orange-400",
        },
    ];
    return (<main className="min-h-screen">
      <SEO title={"Bytewave Sites | Portfolio".replaceAll("Bytewave Sites", siteConfig.name)} description={"View the various websites that Bytewave Sites has developed for satisfied clients.".replaceAll("Bytewave Sites", siteConfig.name)} canonicalPath="/portfolio"/>

      <Header />
      
      
      <HeroSection title="Our Portfolio" subtitle="Showcasing successful projects that helped businesses thrive online"/>

      
      <section>
  <div>
    <div className="flex flex-wrap justify-center gap-8">
  {stats.map((stat) => {
            return (<div key={stat.id} ref={setRef(stat.id)} className={uiClasses(`
        flex-1 min-w-[220px] max-w-[300px]
        bg-slate-700 p-6 rounded-xl border border-slate-600
        transition-all duration-300

        ${activeIds.includes(stat.id)
                ? `-translate-y-2 shadow-xl ${shadowColors[stat.color]}`
                : ""}

        lg:hover:-translate-y-2 lg:hover:shadow-xl
        ${hoveredOnLargeShadowColors[stat.color]}
      `)}>
      <div className={uiClasses(`text-3xl font-bold mb-2 ${stat.textColor}`)}>
        {stat.value}
      </div>

      <div>
        {stat.label}
      </div>
    </div>);
        })}
    </div>

  </div>
    </section>
      

      
      {portfolioData.error && <FeedbackMessage type="error" message={portfolioData.error} onClose={portfolioData.dismissError} retry={portfolioData.retry}/>}
      <PortfolioGrid />

      
      <section>
        <div>
          <div className="max-w-4xl">
            <h2>Ready to Start Your Project?</h2>
            <p>
              Join our satisfied clients and let us help you build your digital presence
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/contact">
                Start Your Project
              </a>
              <a href="/services">
                View Our Services
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>);
}
