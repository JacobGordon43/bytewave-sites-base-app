import { uiClasses, uiStyle, iconLabel } from "../../utils/presentation";
import type { ServiceData } from "../../types/daoTypes";
import { textColors } from "../../utils/colorClasses";
export default function ServiceCard({ service, ref, onViewMore, isVisible }: {
    service: ServiceData;
    onViewMore: () => void;
    isVisible: boolean;
    ref: React.Ref<HTMLDivElement>;
}) {
    return (<div ref={ref} className={uiClasses(`
        rounded-2xl p-6 flex flex-col h-[460px]
        transition-all duration-700 ease-out

        ${isVisible
        ? "opacity-100 translate-y-0 scale-100"
        : "opacity-0 translate-y-8 scale-95"}

        ${service.featured
        ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white"
        : "bg-slate-700 border border-slate-600"}
      `)}>
      <div className="flex items-center gap-3">
        <span aria-hidden="true">{iconLabel(`${service.icon} ${service.featured ? 'text-white' : `${textColors[service.serviceColor]}`}  text-2xl leading-none`)}</span>   
        <div className="min-w-0">
          <h3>
            {service.title}
          </h3>
          <p className={uiClasses(`text-sm font-semibold ${service.featured ? "text-blue-100" : `${textColors[service.serviceColor]}`}`)}>
            {service.price}
          </p>
        </div>
      </div>

      <p className={uiClasses(`text-sm mb-4 shrink-0 line-clamp-2 leading-relaxed ${service.featured ? "text-blue-100" : "text-slate-300"}`)}>
        {service.description}
      </p>

      <div className="flex-1 min-h-0 flex flex-col">
        <h4>
          {service.primaryList.title}
        </h4>
        <div className={uiClasses(`flex-1 overflow-y-auto pr-2 -mr-2 ${service.featured ? 'scrollbar-blue' : 'scrollbar-slate'}`)}>
          <ul>
            {service.primaryList.items.map((item, i) => (<li key={i} className={uiClasses(`
                  flex items-start text-sm leading-relaxed
                  transition-all duration-500 ease-out

                  ${isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2"}

                  ${service.featured ? "text-blue-100" : "text-slate-300"}
                `)} style={uiStyle({
            transitionDelay: `${i * 75}ms`,
        })}>
                <i className={uiClasses(`ri-check-line mr-2.5 mt-0.5 shrink-0 ${service.featured ? "text-green-300" : "text-green-400"}`)}/>
                <span>{item.text}</span>
              </li>))}
          </ul>
        </div>
      </div>

      <div>
        <button onClick={onViewMore} className={uiClasses(`w-full cursor-pointer py-3 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap ${service.featured
        ? "bg-white text-blue-600 hover:bg-blue-50"
        : "bg-blue-600 text-white hover:bg-blue-700"}`)}>
          View More
        </button>
      </div>
    </div>);
}
