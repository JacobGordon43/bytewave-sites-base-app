import { useEffect, useState } from "react";

export function useCurrentTime(intervalMs = 60_000){
    const [now, setNow] = useState<number | null>(null);

    useEffect(()=>{
        const updateTime = () => setNow(Date.now());

        const initialTimeout = window.setTimeout(updateTime, 0);
        const intervalId = window.setInterval(updateTime, intervalMs);

        return () => {
            window.clearTimeout(initialTimeout);
            window.clearInterval(intervalId);
        }
    }, [intervalMs])

    return now;
}