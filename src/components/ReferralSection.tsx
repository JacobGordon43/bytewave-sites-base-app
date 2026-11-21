import { uiClasses, uiStyle, iconLabel } from "../utils/presentation";
import { useInView } from "../hooks/useInView";
export default function ReferralSection() {
    const { ref, isVisible } = useInView();
    const steps = [
        {
            icon: "ri-user-add-line",
            title: "Refer a Friend",
            desc: "Share our services with someone who needs a website",
        },
        {
            icon: "ri-team-line",
            title: "They Sign Up",
            desc: "Your referral becomes our happy client",
        },
        {
            icon: "ri-gift-line",
            title: "You Get Rewarded",
            desc: "Receive 3 months of free hosting!",
        },
    ];
    return (<section ref={ref} className={uiClasses(`
            py-20 bg-slate-900
            transition-all duration-700 ease-out

            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
        `)}>        
        <div>
          <div className="max-w-4xl">
            <h2>Referral Program</h2>
            <p>
              Love our services? Share the love and get rewarded!
            </p>
            
            <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, i) => (<div key={i} className={uiClasses(`
                            transition-all duration-700 ease-out

                            ${isVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-10 scale-95"}
                        `)} style={uiStyle({
            transitionDelay: `${i * 150}ms`,
        })}>
                        <div className="w-16 h-16 flex items-center justify-center">
                            <span aria-hidden="true">{iconLabel(`${step.icon} text-2xl`)}</span>
                        </div>
                        <h3>{step.title}</h3>
                        <p>{step.desc}</p>
                        </div>))}
                </div>
            </div>
          </div>
        </div>
      </section>);
}
