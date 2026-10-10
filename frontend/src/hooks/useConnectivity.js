import {
    useEffect,
    useState
} from "react";


import {
    isOnline,
    subscribeToConnectivity
} from "../services/sync/connectivityService";


function useConnectivity() {

    const [
        online,
        setOnline
    ] = useState(
        isOnline()
    );


    useEffect(() => {

        const unsubscribe =
            subscribeToConnectivity(

                () => {
                    setOnline(true);
                },

                () => {
                    setOnline(false);
                }

            );


        return unsubscribe;

    }, []);


    return {

        isOnline:
            online,

        status:
            online
                ? "ONLINE"
                : "OFFLINE"
    };
}


export default useConnectivity;