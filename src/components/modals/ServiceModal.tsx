import { uiClasses, iconLabel } from "../../utils/presentation";
import type { ServiceData } from "../../types/daoTypes";
import { textColors } from "../../utils/colorClasses";
export default function ServiceModal({ service, onClose, }: {
    service: ServiceData;
    onClose: () => void;
}) {
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0" />
      <div className={uiClasses(`relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-8 ${service.featured
        ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white"
        : "bg-slate-700 text-white border border-slate-600"}`)} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center">
          <i className="ri-close-line" />
        </button>

        <div className="flex items-center">
        <span aria-hidden="true">{iconLabel(`${service.icon} ${textColors[service.serviceColor]} text-2xl leading-none`)}</span>             
        
          <div>
            <h3>{service.title}</h3>
            <p className={uiClasses(`${service.featured ? "text-blue-100" : `${textColors[service.serviceColor]}`} font-semibold`)}>
              {service.subtitle}
            </p>
          </div>
        </div>

        <p className={uiClasses(`mb-6 ${service.featured ? "text-blue-100" : "text-slate-300"}`)}>
          {service.description}
        </p>

        <div>
          <h4>{service.primaryList.title}</h4>
          <ul>
            {service.primaryList.items.map((item, i) => (<li key={i} className={uiClasses(`flex items-center ${service.featured ? "text-blue-100" : "text-slate-300"}`)}>
                <i className={uiClasses(`ri-check-line mr-2 ${service.featured ? "text-green-300" : "text-green-400"}`)}/>
                {item.text}
              </li>))}
          </ul>
        </div>
        
        {service.secondaryLists.map((list, i) => (<div key={i} className={uiClasses(`p-4 rounded-lg ${service.featured ? "bg-white/10" : "bg-slate-600"}`)}>
          <h5>
            {list.title}
          </h5>
          <div className={uiClasses(`text-sm space-y-1 ${service.featured ? "text-blue-100" : "text-slate-300"}`)}>
            {list.items.map((item, i) => (<div key={i}>• {item.text}</div>))}
          </div>
        </div>))}

      </div>
    </div>);
}
