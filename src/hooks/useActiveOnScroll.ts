import { useEffect, useRef, useState } from "react";

export const useActiveOnScroll = () => {
    // const [activeId, setActiveId] = useState<number | null>(null);
    const [activeId, setActiveId] = useState<string[]>([]);
    const elementsRef = useRef<Map<string, HTMLElement>>(new Map());
    const ACTIVATION_THRESHOLD = 150;
    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 1024px)");
        
        let ticking = false;

        const updateActive = () => {
        if(mediaQuery.matches){
            setActiveId([]);
            ticking = false;
            return;
        }
            const viewportCenter = window.innerHeight / 2;            
            let closestIds: string[] = [];
            let closestDistance = Infinity;

            elementsRef.current.forEach((el, id) => {
                if(!el) return;

                const rect = el.getBoundingClientRect();
                const elementCenter = rect.top + rect.height / 2
                const distance = Math.abs(viewportCenter - elementCenter);
       

                if(distance < closestDistance){
                    closestDistance = distance;
                    closestIds = [id];
                }else if(distance <= closestDistance){
                    closestDistance = distance;
                    closestIds.push(id);
                }
            })
            // setActiveId(closestIds);
            if(closestDistance < ACTIVATION_THRESHOLD && !mediaQuery.matches){
                setActiveId(closestIds);
            }else{
                setActiveId([]);
            }            
            ticking = false;
        }

        const handleScroll = () => {
            if(!ticking){
                requestAnimationFrame(updateActive);
                ticking = true;
            }
        }

        const handleResize = () => updateActive();

        window.addEventListener("resize", handleResize);

        window.addEventListener("scroll", handleScroll);
        
        requestAnimationFrame(updateActive);
        return() => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const setRef = (id: string) => (el: HTMLElement | null) => {
        if(el){
            elementsRef.current.set(id, el);
        }else{
            elementsRef.current.delete(id);
        }
    }
    return {activeIds: activeId, setRef};

}

// import { useEffect, useRef, useState } from "react";

// export const useActiveOnScroll = () => {
//     // const [activeId, setActiveId] = useState<number | null>(null);
//     const [activeId, setActiveId] = useState<string | null>(null);
//     const elementsRef = useRef<Map<string, HTMLElement>>(new Map());
//     const ACTIVATION_THRESHOLD = 150;
//     useEffect(() => {
//         const mediaQuery = window.matchMedia("(min-width: 1024px)");
        
//         let ticking = false;

//         const updateActive = () => {
//         if(mediaQuery.matches){
//             setActiveId(null);
//             ticking = false;
//             return;
//         }
//             const viewportCenter = window.innerHeight / 2;
            
//             let closestId: string | null = null;
//             let closestDistance = Infinity;

//             elementsRef.current.forEach((el, id) => {
//                 if(!el) return;

//                 const rect = el.getBoundingClientRect();
//                 const elementCenter = rect.top + rect.height / 2
//                 const distance = Math.abs(viewportCenter - elementCenter);
       

//                 if(distance < closestDistance){
//                     closestDistance = distance;
//                     closestId = id;
//                 }
//             })
//             setActiveId(closestId);

//             if(closestDistance < ACTIVATION_THRESHOLD && !mediaQuery.matches){
//                 setActiveId(closestId);
//             }else{
//                 setActiveId(null);
//             }            
//             ticking = false;
//         }

//         const handleScroll = () => {
//             if(!ticking){
//                 requestAnimationFrame(updateActive);
//                 ticking = true;
//             }
//         }

//         const handleResize = () => updateActive();

//         window.addEventListener("resize", handleResize);

//         window.addEventListener("scroll", handleScroll);
        
//         requestAnimationFrame(updateActive);
//         return() => {
//             window.removeEventListener("scroll", handleScroll);
//             window.removeEventListener("resize", handleResize);
//         };
//     }, []);

//     const setRef = (id: string) => (el: HTMLElement | null) => {
//         if(el){
//             elementsRef.current.set(id, el);
//         }else{
//             elementsRef.current.delete(id);
//         }
//     }
//     return {activeId, setRef};

// }