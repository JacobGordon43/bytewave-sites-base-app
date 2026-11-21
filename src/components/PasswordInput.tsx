import { uiClasses } from "../utils/presentation";
import { useState, type InputHTMLAttributes } from "react";
interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    visibilityLabel?: string;
}
export default function PasswordInput({ className = "", visibilityLabel = "password", ...inputProps }: PasswordInputProps) {
    const [visible, setVisible] = useState(false);
    return (<div className="relative">
      <input {...inputProps} type={visible ? "text" : "password"} className={uiClasses(`${className} pr-12`)}/>
      <button type="button" onClick={() => setVisible((current) => !current)} aria-label={`${visible ? "Hide" : "Show"} ${visibilityLabel}`} aria-pressed={visible} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center">
        <i className={uiClasses(visible ? "ri-eye-off-line text-lg" : "ri-eye-line text-lg")} aria-hidden="true"/>
      </button>
    </div>);
}
