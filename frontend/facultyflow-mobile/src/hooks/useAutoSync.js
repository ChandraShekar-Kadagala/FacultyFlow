import {
    useEffect
} from "react";

import useConnectivity from "../services/sync/useConnectivity";

import {
    syncPendingEvents
} from "../services/sync/syncOrchestrator";


function useAutoSync(
    syncFunction
) {

    const {
        isOnline
    } = useConnectivity();


    useEffect(() => {

        if (!isOnline) {
            return;
        }


        syncPendingEvents(
            syncFunction
        )
            .then(result => {

                console.log(
                    "Automatic sync result:",
                    result
                );

            })
            .catch(error => {

                console.error(
                    "Automatic sync failed:",
                    error
                );

            });

    }, [
        isOnline,
        syncFunction
    ]);
}


export default useAutoSync;