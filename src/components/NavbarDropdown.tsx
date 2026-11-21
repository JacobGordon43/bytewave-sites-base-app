import { uiClasses, iconLabel } from "../utils/presentation";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
type DropdownLink = {
    text: string;
    to: string;
};
type NavbarDropdownProps = {
    title: string;
    links: DropdownLink[];
};
export default function NavbarDropdown({ title, links }: NavbarDropdownProps) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return (<div className="relative w-full" ref={dropdownRef}>
            <button onClick={() => setOpen((prev) => !prev)} className="flex items-center" aria-haspopup="true" aria-expanded={open}>
                <span>{title}</span>
                <span aria-hidden="true">{iconLabel(`ri-arrow-down-s-line transition-transform ${open ? "rotate-180" : ""}`)}</span>
            </button>
            
            <div className={uiClasses(`lg:hidden overflow-hidden transition-all duration-300 ${open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`)}>
                <div className="flex flex-col">
                    {links.map((link) => (<Link className="w-full" key={link.text} to={link.to} onClick={() => setOpen(false)}>
                            {link.text}
                        </Link>))}
                </div>
            </div>
            
            <div className={uiClasses(`hidden lg:block absolute right-0 mt-3 w-48 rounded-lg border border-slate-700 bg-slate-900 shadow-xl transition-all duration-200 origin-top-right ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`)}>
                <div className="flex flex-col">
                    {links.map((link) => (<Link key={link.text} to={link.to} onClick={() => setOpen(false)}>{link.text}</Link>))}
                </div>
            </div>
        </div>);
}
