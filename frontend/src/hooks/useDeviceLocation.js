import {
    useCallback,
    useState
} from "react";


import {
    getCurrentBrowserLocation,
    isBrowserLocationSupported
} from "../services/location/browserLocation";


function useDeviceLocation() {

    const [

        location,

        setLocation

    ] = useState(null);


    const [

        loading,

        setLoading

    ] = useState(false);


    const [

        error,

        setError

    ] = useState(null);


    const captureLocation =
        useCallback(

            async () => {

                setLoading(true);

                setError(null);


                try {

                    const currentLocation =
                        await getCurrentBrowserLocation();


                    setLocation(
                        currentLocation
                    );


                    return currentLocation;

                } catch (error) {

                    setLocation(null);

                    setError(error);


                    throw error;

                } finally {

                    setLoading(false);

                }

            },

            []

        );


    return {

        location,

        loading,

        error,

        supported:
            isBrowserLocationSupported(),

        captureLocation

    };

}


export default useDeviceLocation;