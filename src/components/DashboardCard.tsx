import { uiClasses, iconLabel } from "../utils/presentation";
export type colors = "blue" | "green" | "purple" | "orange" | "cyan" | "red";
interface DashboardCardProps {
    title: string;
    value: string;
    subtitle: string;
    icon: string;
    color: colors;
    isLoading: boolean;
}
export default function DashboardCard({ title, value, subtitle, icon, color, isLoading }: DashboardCardProps) {
    const getColorClasses = (selectedColor: colors) => {
        const colors = {
            blue: 'bg-blue-600 text-blue-100',
            green: 'bg-green-600 text-green-100',
            purple: 'bg-purple-600 text-purple-100',
            orange: 'bg-orange-600 text-orange-100',
            cyan: 'bg-cyan-600 text-cyan-100',
            red: 'bg-red-600 text-red-100'
        };
        return colors[selectedColor as keyof typeof colors] || colors.blue;
    };
    return (<div>
            <div className="flex items-center">
                <div className={uiClasses(`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(color)}`)}>
                    <span aria-hidden="true">{iconLabel(`${icon} text-xl`)}</span>
                </div>
            </div>

            <div>
                <p>{title}</p>
            </div>
            
            <div>
                {isLoading ? (<div className="h-9"></div>) : (<p>{value}</p>)}
              </div>
                            
              <div>
                {isLoading ? (<div className="h-4 w-2/3"></div>) : (<p>{subtitle}</p>)}
              </div>

        </div>);
}
