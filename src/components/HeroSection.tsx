import AnimatedHeroBackground from "./AnimatedHeroBackground";
export default function HeroSection({ title, subtitle }: {
    title: string;
    subtitle: string;
}) {
    return (<section className="relative overflow-hidden">
            <AnimatedHeroBackground />
            <div className="relative z-10container">
            <h1>{title}</h1>
            <p className="max-w-2xl">
                {subtitle}
            </p>
            </div>
        </section>);
}
