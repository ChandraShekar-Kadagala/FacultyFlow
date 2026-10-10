export function isOnline() {
    return navigator.onLine;
}


export function getConnectivityStatus() {

    return navigator.onLine
        ? "ONLINE"
        : "OFFLINE";
}


export function subscribeToConnectivity(
    onOnline,
    onOffline
) {

    function handleOnline() {

        if (
            typeof onOnline ===
            "function"
        ) {

            onOnline();
        }
    }


    function handleOffline() {

        if (
            typeof onOffline ===
            "function"
        ) {

            onOffline();
        }
    }


    window.addEventListener(
        "online",
        handleOnline
    );


    window.addEventListener(
        "offline",
        handleOffline
    );


    return function unsubscribe() {

        window.removeEventListener(
            "online",
            handleOnline
        );


        window.removeEventListener(
            "offline",
            handleOffline
        );
    };
}