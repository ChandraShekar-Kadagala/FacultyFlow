import { useEffect, useState } from "react";
import { isNetworkConnected, subscribeNetworkStatus } from "./networkMonitor.js";

/**
 * Hook providing real-time network connectivity state across mobile, web, and tests.
 */
export default function useConnectivity() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        let isMounted = true;

        isNetworkConnected().then((online) => {
            if (isMounted) setIsOnline(online);
        });

        const unsubscribe = subscribeNetworkStatus((connected) => {
            if (isMounted) setIsOnline(connected);
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    return {
        isOnline,
        isOffline: !isOnline,
        status: isOnline ? "ONLINE" : "OFFLINE"
    };
}