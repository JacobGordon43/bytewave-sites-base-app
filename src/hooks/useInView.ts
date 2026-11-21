import { useEffect, useRef, useState } from "react";

export const useInView = (threshold = 0.4) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if(entry.isIntersecting){
                    setIsVisible(true);
                    observer.disconnect();
                }
                // else{
                //     setIsVisible(false);
                // }
            }, { threshold }
        )

        if(ref.current){
            observer.observe(ref.current);
        }
    }, []);
    return { ref, isVisible };
}