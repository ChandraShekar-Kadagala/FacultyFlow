import {
    useEffect,
    useState
} from "react";

import {
    getConnectivityStatus,
    subscribeToConnectivity
} from "./connectivityService";


function useConnectivity() {
    const [
        status,
        setStatus
    ] = useState(
        getConnectivityStatus()
    );


    useEffect(() => {
        const unsubscribe =
            subscribeToConnectivity(
                () => {
                    setStatus("ONLINE");
                },

                () => {
                    setStatus("OFFLINE");
                }
            );


        return unsubscribe;
    }, []);


    return {
        status,
        isOnline: status === "ONLINE",
        isOffline: status === "OFFLINE"
    };
}


export default useConnectivity;