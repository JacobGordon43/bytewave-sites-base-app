import { uiClasses, uiStyle, iconLabel } from "../utils/presentation";
import { useState } from 'react';
import type { FAQSectionData } from '../types/daoTypes';
import { useInView } from '../hooks/useInView';
interface FAQSectionProps {
    faqSection: FAQSectionData;
}
export default function FAQSection({ faqSection }: FAQSectionProps) {
    const [openId, setOpenId] = useState<string | null>(null);
    const toggleFAQ = (id: string) => {
        setOpenId(openId === id ? null : id);
    };
    const { ref, isVisible } = useInView();
    return (<div ref={ref} className={uiClasses(`
        container m-auto mb-16
        transition-all duration-700 ease-out

        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
      `)}>      
      <h2>{faqSection.title}</h2>
      <div className="max-w-4xl">
        {faqSection.faqs.map((faq, i) => (<div key={faq.id} className={uiClasses(`
              bg-slate-700 rounded-xl border border-slate-600 overflow-hidden
              transition-all duration-500 ease-out

              ${isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6"}
            `)} style={uiStyle({
            transitionDelay: `${i * 100}ms`,
        })}>            
            <button onClick={() => toggleFAQ(faq.id)} className="w-full flex items-center justify-between">
              <h3>{faq.question}</h3>
              <div className="flex-shrink-0">
                <span aria-hidden="true">{iconLabel(`ri-arrow-down-s-line block text-slate-400 text-xl transition-transform duration-300 ease-in-out ${openId === faq.id ? 'rotate-180' : 'rotate-0'}`)}</span>
              </div>
            </button>
            
            <div className={uiClasses(`overflow-hidden transition-all duration-300 ${openId === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`)}>
              <div>
                <p>{faq.answer}</p>
              </div>
            </div>
          </div>))}
      </div>
    </div>);
}
