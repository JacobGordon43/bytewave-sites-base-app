import { useEffect, useRef } from "react";

type TurnstileTheme = "auto" | "light" | "dark";

type TurnstileOptions = {
  sitekey: string;
  theme?: TurnstileTheme;
  "response-field"?: boolean;
  "response-field-name"?: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      remove?: (widgetId: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  className?: string;
  theme?: TurnstileTheme;
};

export default function TurnstileWidget({ className, theme = "auto" }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = import.meta.env.VITE_APP_TURNSTILE_SITE_KEY;
  useEffect(() => {
    if (!siteKey || !containerRef.current || widgetIdRef.current) return;

    let cancelled = false;
    let intervalId: number | null = null;

    const renderTurnstile = () => {
      if (cancelled || !containerRef.current || widgetIdRef.current || !window.turnstile) {
        return false;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        "response-field": true,
        "response-field-name": "cf-turnstile-response",
      });
      return true;
    };

    if (!renderTurnstile()) {
      intervalId = window.setInterval(() => {
        if (renderTurnstile() && intervalId) {
          window.clearInterval(intervalId);
        }
      }, 250);
    }

    return () => {
      cancelled = true;

      if (intervalId) {
        window.clearInterval(intervalId);
      }

      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }

      widgetIdRef.current = null;
    };
  }, [siteKey, theme]);

  if (!siteKey) {
    return <p >Security check is not configured.</p>;
  }

  return <div ref={containerRef} className={className} />;
}
