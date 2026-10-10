import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";


import NetInfo
    from "@react-native-community/netinfo";


import {
    ATTENDANCE_STATUS,
    SYNC_STATUS,
    checkIn,
    checkOut
} from "../services/attendance/attendanceEngine";


import {
    createAttendanceEvent,
    saveAndSync,
    syncPendingEvents
} from "../services/sync/syncEngine";


import {
    getPendingEvents
} from "../services/sync/storageService";


import {
    useAuth
} from "./AuthContext";


const AttendanceContext =
    createContext(null);


// ============================================================
// DEFAULT ATTENDANCE
// ============================================================

const defaultAttendance = {

    facultyId:
        null,

    date:
        null,

    status:
        ATTENDANCE_STATUS.NOT_CHECKED_IN,

    checkInTime:
        null,

    checkOutTime:
        null,

    syncStatus:
        SYNC_STATUS.LOCAL,

    lastEvent:
        null,

    lastVerification:
        null,

    lastError:
        null

};


// ============================================================
// LOCAL POLICY
// ============================================================

const attendancePolicy = {

    requiredSignals: [

        "identity",

        "schedule"

    ]

};


// ============================================================
// PROVIDER
// ============================================================

export function AttendanceProvider({

    children

}) {

    // ========================================================
    // AUTHENTICATION
    // ========================================================

    const {

        user,

        accessToken,

        loading:
            authLoading

    } = useAuth();


    // ========================================================
    // ATTENDANCE STATE
    // ========================================================

    const [

        attendance,

        setAttendance

    ] = useState(
        defaultAttendance
    );


    const [

        processing,

        setProcessing

    ] = useState(false);


    const [

        networkConnected,

        setNetworkConnected

    ] = useState(true);


    const [

        pendingCount,

        setPendingCount

    ] = useState(0);


    const [

        syncProcessing,

        setSyncProcessing

    ] = useState(false);


    // ========================================================
    // REFRESH PENDING COUNT
    // ========================================================

    async function refreshPendingCount() {

        try {

            const pendingEvents =
                await getPendingEvents();


            setPendingCount(

                pendingEvents.length

            );

        } catch (error) {

            console.error(

                "Failed to refresh pending count:",

                error

            );

        }

    }


    // ========================================================
    // INITIALIZE + MONITOR NETWORK
    // ========================================================

    useEffect(() => {

        let unsubscribe;


        async function initializeSync() {

            try {

                const network =
                    await NetInfo.fetch();


                const connected =
                    Boolean(
                        network.isConnected
                    );


                setNetworkConnected(
                    connected
                );


                await refreshPendingCount();


                // ------------------------------------------------
                // Only sync when authenticated
                // ------------------------------------------------

                if (
                    connected &&
                    accessToken
                ) {

                    setSyncProcessing(
                        true
                    );


                    const result =
                        await syncPendingEvents(

                            accessToken

                        );


                    setSyncProcessing(
                        false
                    );


                    if (
                        result.status ===
                        "SYNCED"
                    ) {

                        setAttendance(

                            current => ({

                                ...current,

                                syncStatus:
                                    SYNC_STATUS.SYNCED,

                                lastError:
                                    null

                            })

                        );

                    }


                    await refreshPendingCount();

                }

            } catch (error) {

                setSyncProcessing(
                    false
                );


                console.error(

                    "Sync initialization failed:",

                    error

                );

            }

        }


        // --------------------------------------------------------
        // Wait until authentication restoration finishes
        // --------------------------------------------------------

        if (
            !authLoading
        ) {

            initializeSync();

        }


        // ========================================================
        // NETWORK LISTENER
        // ========================================================

        unsubscribe =
            NetInfo.addEventListener(

                async state => {

                    const connected =
                        Boolean(
                            state.isConnected
                        );


                    setNetworkConnected(
                        connected
                    );


                    if (
                        connected &&
                        accessToken
                    ) {

                        setSyncProcessing(
                            true
                        );


                        try {

                            const result =
                                await syncPendingEvents(

                                    accessToken

                                );


                            if (
                                result.status ===
                                "SYNCED"
                            ) {

                                setAttendance(

                                    current => ({

                                        ...current,

                                        syncStatus:
                                            SYNC_STATUS.SYNCED,

                                        lastError:
                                            null

                                    })

                                );

                            }


                            await refreshPendingCount();

                        } catch (error) {

                            console.error(

                                "Automatic sync failed:",

                                error

                            );

                        } finally {

                            setSyncProcessing(
                                false
                            );

                        }

                    } else if (
                        !connected
                    ) {

                        setAttendance(

                            current => ({

                                ...current,

                                syncStatus:
                                    SYNC_STATUS.PENDING_SYNC

                            })

                        );

                    }

                }

            );


        return () => {

            if (
                unsubscribe
            ) {

                unsubscribe();

            }

        };

    }, [

        accessToken,

        authLoading

    ]);


    // ============================================================
    // CHECK-IN
    // ============================================================

    async function performCheckIn(
        currentUser = user
    ) {

        if (
            processing
        ) {

            return {

                success:
                    false,

                reason:
                    "An attendance operation is already in progress."

            };

        }


        // --------------------------------------------------------
        // Authentication check
        // --------------------------------------------------------

        if (
            !accessToken
        ) {

            return {

                success:
                    false,

                reason:
                    "Authentication session is missing."

            };

        }


        setProcessing(
            true
        );


        try {

            // ----------------------------------------------------
            // Local attendance engine
            //
            // This preserves the existing offline flow.
            // ----------------------------------------------------

            const result =
                await checkIn({

                    user:
                        currentUser,

                    attendance,

                    policy:
                        attendancePolicy

                });


            if (
                !result.success
            ) {

                setAttendance(

                    current => ({

                        ...current,

                        lastVerification:
                            result.verification,

                        lastError:
                            result.reason

                    })

                );


                return result;

            }


            // ----------------------------------------------------
            // Create local event
            // ----------------------------------------------------

            const event =
                createAttendanceEvent({

                    eventType:
                        "CHECK_IN",

                    facultyId:

                        result.attendance
                            ?.facultyId ||

                        currentUser
                            ?.facultyId ||

                        null,

                    attendance:
                        result.attendance,

                    verification:
                        result.verification

                });


            // ----------------------------------------------------
            // Save locally + authenticated sync
            // ----------------------------------------------------

            const syncResult =
                await saveAndSync(

                    event,

                    accessToken

                );


            const finalSyncStatus =
                syncResult.status ||

                SYNC_STATUS.PENDING_SYNC;


            // ----------------------------------------------------
            // Update UI
            // ----------------------------------------------------

            setAttendance({

                ...result.attendance,

                syncStatus:
                    finalSyncStatus,

                lastEvent:
                    event,

                lastVerification:
                    result.verification,

                lastError:

                    syncResult.success

                        ? null

                        : syncResult.error ||

                          null

            });


            await refreshPendingCount();


            return {

                ...result,

                event,

                syncStatus:
                    finalSyncStatus,

                syncResult

            };

        } catch (error) {

            setAttendance(

                current => ({

                    ...current,

                    syncStatus:
                        SYNC_STATUS.PENDING_SYNC,

                    lastError:
                        error?.message

                })

            );


            return {

                success:
                    false,

                reason:
                    error?.message ||

                    "Check-in failed."

            };

        } finally {

            setProcessing(
                false
            );

        }

    }


    // ============================================================
    // CHECK-OUT
    // ============================================================

    async function performCheckOut(
        currentUser = user
    ) {

        if (
            processing
        ) {

            return {

                success:
                    false,

                reason:
                    "An attendance operation is already in progress."

            };

        }


        if (
            !accessToken
        ) {

            return {

                success:
                    false,

                reason:
                    "Authentication session is missing."

            };

        }


        setProcessing(
            true
        );


        try {

            // ----------------------------------------------------
            // Existing local attendance engine
            // ----------------------------------------------------

            const result =
                await checkOut({

                    user:
                        currentUser,

                    attendance,

                    policy:
                        attendancePolicy

                });


            if (
                !result.success
            ) {

                setAttendance(

                    current => ({

                        ...current,

                        lastVerification:
                            result.verification,

                        lastError:
                            result.reason

                    })

                );


                return result;

            }


            // ----------------------------------------------------
            // Create local event
            // ----------------------------------------------------

            const event =
                createAttendanceEvent({

                    eventType:
                        "CHECK_OUT",

                    facultyId:

                        result.attendance
                            ?.facultyId ||

                        currentUser
                            ?.facultyId ||

                        null,

                    attendance:
                        result.attendance,

                    verification:
                        result.verification

                });


            // ----------------------------------------------------
            // Save locally + authenticated sync
            // ----------------------------------------------------

            const syncResult =
                await saveAndSync(

                    event,

                    accessToken

                );


            const finalSyncStatus =
                syncResult.status ||

                SYNC_STATUS.PENDING_SYNC;


            // ----------------------------------------------------
            // Update UI
            // ----------------------------------------------------

            setAttendance({

                ...result.attendance,

                syncStatus:
                    finalSyncStatus,

                lastEvent:
                    event,

                lastVerification:
                    result.verification,

                lastError:

                    syncResult.success

                        ? null

                        : syncResult.error ||

                          null

            });


            await refreshPendingCount();


            return {

                ...result,

                event,

                syncStatus:
                    finalSyncStatus,

                syncResult

            };

        } catch (error) {

            setAttendance(

                current => ({

                    ...current,

                    syncStatus:
                        SYNC_STATUS.PENDING_SYNC,

                    lastError:
                        error?.message

                })

            );


            return {

                success:
                    false,

                reason:
                    error?.message ||

                    "Check-out failed."

            };

        } finally {

            setProcessing(
                false
            );

        }

    }


    // ============================================================
    // MANUAL RETRY
    // ============================================================

    async function retryPendingSync() {

        if (
            syncProcessing
        ) {

            return {

                success:
                    false,

                status:
                    "SYNC_IN_PROGRESS"

            };

        }


        if (
            !networkConnected
        ) {

            return {

                success:
                    false,

                status:
                    "OFFLINE"

            };

        }


        if (
            !accessToken
        ) {

            return {

                success:
                    false,

                status:
                    "AUTHENTICATION_REQUIRED"

            };

        }


        setSyncProcessing(
            true
        );


        try {

            const result =
                await syncPendingEvents(

                    accessToken

                );


            await refreshPendingCount();


            if (
                result.status ===
                "SYNCED"
            ) {

                setAttendance(

                    current => ({

                        ...current,

                        syncStatus:
                            SYNC_STATUS.SYNCED,

                        lastError:
                            null

                    })

                );

            } else if (
                result.status ===
                "PARTIAL_SYNC"
            ) {

                setAttendance(

                    current => ({

                        ...current,

                        syncStatus:
                            SYNC_STATUS.PENDING_SYNC

                    })

                );

            }


            return result;

        } finally {

            setSyncProcessing(
                false
            );

        }

    }


    // ============================================================
    // RESET LOCAL UI
    // ============================================================

    function resetAttendance() {

        setAttendance(
            defaultAttendance
        );

    }


    // ============================================================
    // CONTEXT VALUE
    // ============================================================

    const value =
        useMemo(

            () => ({

                attendance,

                processing,

                networkConnected,

                pendingCount,

                syncProcessing,

                performCheckIn,

                performCheckOut,

                retryPendingSync,

                refreshPendingCount,

                resetAttendance

            }),

            [

                attendance,

                processing,

                networkConnected,

                pendingCount,

                syncProcessing

            ]

        );


    return (

        <AttendanceContext.Provider
            value={value}
        >

            {children}

        </AttendanceContext.Provider>

    );

}


// ============================================================
// useAttendance
// ============================================================

export function useAttendance() {

    const context =
        useContext(
            AttendanceContext
        );


    if (!context) {

        throw new Error(
            "useAttendance must be used inside AttendanceProvider."
        );

    }


    return context;

}