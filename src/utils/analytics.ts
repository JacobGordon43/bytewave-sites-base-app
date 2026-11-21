declare global{
    interface Window{
        gtag: (...args: any[]) => void;
    }
}

    export const pageView = (url:string) => {
        if(typeof window.gtag !== "undefined"){
            window.gtag("event", "page_view", {
                page_path: url
            });
        }
    }

    export const trackEvent = (action:string, params?:Record<string, any>) =>{
        if(typeof window.gtag !== "undefined"){
            window.gtag("event", action, params);
        }
    }