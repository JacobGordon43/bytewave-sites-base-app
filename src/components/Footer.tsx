import { siteConfig } from "../config/site";
import { uiClasses, iconLabel } from "../utils/presentation";
import { useSelector } from "react-redux";
import { Link } from "react-router";
import type { RootState } from "../redux/store";
import { selectServices } from "../redux/selectors/servicesSelector";
import type { SocialMedia } from "../types/daoTypes";
const badges = [
    { icon: "ri-chat-3-line", label: "Free Consultation" },
    { icon: "ri-code-s-slash-line", label: "Custom-Built Websites" },
    { icon: "ri-lock-2-line", label: "SSL Included" },
    { icon: "ri-price-tag-3-line", label: "No Hidden Fees" },
];
const quickLinks = [
    { to: "/about", label: "About Us" },
    { to: "/portfolio", label: "Portfolio" },
    { to: "/contact", label: "Contact" },
    { to: "/faq", label: "FAQ" },
    { to: "/login", label: "Client Login" },
];
const socialPlatforms: Array<{
    key: keyof SocialMedia;
    label: string;
    icon: string;
}> = [
    { key: "facebook", label: "Facebook", icon: "ri-facebook-fill" },
    { key: "instagram", label: "Instagram", icon: "ri-instagram-line" },
    { key: "twitter", label: "Twitter / X", icon: "ri-twitter-x-line" },
    { key: "tiktok", label: "TikTok", icon: "ri-tiktok-line" },
];
const getExternalUrl = (url: string) => /^https?:\/\//i.test(url) ? url : `https://${url}`;
export default function Footer() {
    const businessInfo = useSelector((state: RootState) => state.businessInfo.info);
    const services = useSelector(selectServices);
    const phoneHref = businessInfo?.phoneNumber?.replace(/\D/g, "");
    const currentYear = new Date().getFullYear();
    const socialLinks = socialPlatforms.flatMap((platform) => {
        const configuredUrl = businessInfo?.socialMedia?.[platform.key]?.trim();
        return configuredUrl
            ? [{ ...platform, href: getExternalUrl(configuredUrl) }]
            : [];
    });
    return (<footer className="w-full">
      <div className="w-full">
        <div className="flex flex-wrap justify-center gap-3">
          {badges.map((badge) => (<span key={badge.label} className="flex items-center gap-2">
              <i className={uiClasses(`${badge.icon} text-blue-400`)} aria-hidden="true"/>
              {badge.label}
            </span>))}
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link to="/">
              {siteConfig.name}
            </Link>
            <p className="max-w-sm">
              Professional web development, design, and hosting solutions for businesses of all sizes.
            </p>
            <Link to="/contact" className="inline-block">
              Start Your Project
            </Link>
            {socialLinks.length > 0 && (<div className="flex items-center gap-3">
                {socialLinks.map((socialLink) => (<a key={socialLink.key} href={socialLink.href} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${siteConfig.name} on ${socialLink.label}`} title={socialLink.label} className="flex h-10 w-10 items-center justify-center">
                    <span aria-hidden="true">{iconLabel(`${socialLink.icon} text-lg`)}</span>
                  </a>))}
              </div>)}
          </div>

          <div className="grid grid-cols-2 gap-8 sm:max-w-xl lg:col-span-7 lg:justify-self-end lg:gap-16">
            <div>
              <h4>Services</h4>
              <ul>
                {services.map((service) => (<li key={service.id}>
                    <Link to="/services">
                      {service.title}
                    </Link>
                  </li>))}
              </ul>
            </div>

            <div>
              <h4>Quick Links</h4>
              <ul>
                {quickLinks.map((link) => (<li key={link.to}>
                    <Link to={link.to}>
                      {link.label}
                    </Link>
                  </li>))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-start">
            {businessInfo?.address && (<span className="flex items-center gap-2">
                <i className="ri-map-pin-line" aria-hidden="true"/>
                {businessInfo.address}
              </span>)}
            {businessInfo?.phoneNumber && phoneHref && (<a href={`tel:${phoneHref}`} className="flex items-center gap-2">
                <i className="ri-phone-line" aria-hidden="true"/>
                {businessInfo.phoneNumber}
              </a>)}
          </div>
          <span>
            © {currentYear} {siteConfig.name}. All rights reserved.
          </span>
        </div>
      </div>
    </footer>);
}
