import { siteConfig } from "../config/site";
import { uiClasses, iconLabel } from "../utils/presentation";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import NavbarDropdown from "./NavbarDropdown";
import { useAuth } from "../auth/AuthContext";
import { getPortalHome } from "../auth/roles";
export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const auth = useAuth();
    const isAuthenticated = auth.status === "authenticated";
    const isSolid = isScrolled || menuOpen;
    const portalHome = getPortalHome(auth.groups);
    const accountLinks = [
        ...(portalHome ? [{ text: "Dashboard", to: portalHome }] : []),
        { text: "Logout", to: "/logout" },
    ];
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = "hidden";
        }
        else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [menuOpen]);
    return (<header className={uiClasses(`w-full top-0 z-50 ${isScrolled ? "fixed" : "absolute"}`)}>
      
      <div className={uiClasses(`absolute inset-0 border-b transition-all duration-300 ease-out ${isSolid
        ? "bg-slate-900/95 backdrop-blur-md border-slate-700 opacity-100 shadow-lg"
        : "bg-slate-900/95 border-transparent opacity-0"}`)}/>

      
      <div className="relative">
        <div className="flex items-center justify-between">
          
          <Link className="z-1000" to="/">
            {siteConfig.name}
          </Link>

          
          <nav className="hidden lg:flex items-center">
            <Link to="/">
              Home
            </Link>

            <Link to="/services">
              Services
            </Link>

            <Link to="/portfolio">
              Portfolio
            </Link>

            <Link to="/about">
              About
            </Link>

            <Link to="/faq">
              FAQ
            </Link>

            <Link to="/contact">
              Contact
            </Link>

            {isAuthenticated ? (<NavbarDropdown title="Account" links={accountLinks}/>) : (<Link to="/login">
                Client Login
              </Link>)}
          </nav>

          
          <button className="lg:hidden z-50" onClick={() => setMenuOpen((prev) => !prev)} aria-label="Toggle menu">
            {menuOpen ? (<span aria-hidden="true">{iconLabel("ri-close-line text-2xl")}</span>) : (<span aria-hidden="true">{iconLabel("ri-menu-line text-2xl")}</span>)}
          </button>
        </div>
      </div>

      
    
    <div className={uiClasses(`fixed inset-x-0 top-0 z-40 overflow-hidden bg-slate-900/95 backdrop-blur-md transition-[height] duration-300 ease-out lg:hidden ${menuOpen ? "h-screen" : "h-0"}`)}>
  <div className={uiClasses(`flex flex-col px-6 pt-28 transition-all duration-200 ease-out ${menuOpen
        ? "opacity-100 translate-y-0"
        : "opacity-0 -translate-y-2"}`)}>
    {[
            { to: "/", label: "Home" },
            { to: "/services", label: "Services" },
            { to: "/portfolio", label: "Portfolio" },
            { to: "/about", label: "About" },
            { to: "/faq", label: "FAQ" },
            { to: "/contact", label: "Contact" },
        ].map(({ to, label }) => (<Link className="w-full" key={to} to={to} onClick={() => setMenuOpen(false)}>
        {label}
      </Link>))}

    {isAuthenticated ? (<div>
        <NavbarDropdown title="Account" links={accountLinks}/>
      </div>) : (<Link to="/login" onClick={() => setMenuOpen(false)}>
        Client Login
      </Link>)}
  </div>
    </div>
    </header>);
}
