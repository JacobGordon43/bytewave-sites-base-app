import { uiClasses, uiStyle, iconLabel } from "../utils/presentation";
type FeedbackMessageProps = {
    type: "success" | "error";
    message: string;
    onClose: () => void;
    retry?: () => void;
    className?: string;
};
const feedbackStyles = {
    success: {
        container: "border-green-500 bg-green-600/20 text-green-300",
        button: "text-green-400 hover:text-green-300",
        icon: "ri-checkbox-circle-line",
    },
    error: {
        container: "border-red-500 bg-red-600/20 text-red-300",
        button: "text-red-400 hover:text-red-300",
        icon: "ri-error-warning-line",
    },
} as const;
export default function FeedbackMessage({ type, message, onClose, retry, className = "", }: FeedbackMessageProps) {
    const styles = feedbackStyles[type];
    return (<div role={type === "error" ? "alert" : "status"} aria-live={type === "error" ? "assertive" : "polite"} style={uiStyle(type === "error" ? { width: "fit-content", maxWidth: "min(100%, 42rem)" } : undefined)} className={uiClasses(`flex items-start justify-between gap-3 rounded-lg border p-3 text-sm ${styles.container} ${className}`)}>
      <div className="flex min-w-0 items-start gap-2">
        <span aria-hidden="true">{iconLabel(`${styles.icon} mt-0.5 shrink-0`)}</span>
        <div className="min-w-0">
          <span>{message}</span>
          {type === "error" && typeof retry === "function" && (<button type="button" onClick={retry} className={uiClasses(`ml-2 cursor-pointer font-medium underline underline-offset-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${styles.button}`)}>
              Try again
            </button>)}
        </div>
      </div>
      <button type="button" onClick={onClose} aria-label={`Dismiss ${type} message`} className={uiClasses(`shrink-0 transition-colors ${styles.button}`)}>
        <span aria-hidden="true">{iconLabel("ri-close-line")}</span>
      </button>
    </div>);
}
