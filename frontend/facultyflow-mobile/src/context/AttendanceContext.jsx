import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";
import { useAuth } from "./AuthContext";
import {
    getTodayAttendance,
    checkInAttendance,
    checkOutAttendance,
    getActiveAttendancePolicy
} from "../services/attendance/attendanceApi";
import {
    getDeviceSignal,
    getLocationSignal
} from "../services/device/deviceLocationHelper";
import {
    isNetworkConnected,
    subscribeNetworkStatus
} from "../services/sync/networkMonitor";
import {
    syncUserEvents
} from "../services/sync/syncEngine";
import {
    enqueueOfflineEvent,
    generateSyncEventId,
    getPendingCount,
    getFailedCount,
    retryFailedEvents
} from "../services/storage/sqliteQueue";

const AttendanceContext = createContext(null);

export function getAttendanceErrorMessage(error, fallbackMessage = "Attendance operation failed.") {
    const code = error?.code || error?.data?.code;
    const msg = error?.message || error?.data?.message;
    const verif = error?.verification || error?.data?.verification;
    const blockingTypes = error?.blockingTypes || error?.data?.blockingTypes || verif?.blockingTypes || [];

    if (code === "ATTENDANCE_VERIFICATION_FAILED" || verif?.result === "FAILED") {
        if (Array.isArray(blockingTypes) && blockingTypes.length > 0) {
            const reasons = [];
            if (blockingTypes.includes("LOCATION")) {
                reasons.push("Campus geofence check failed: Your device is outside the authorized campus perimeter.");
            }
            if (blockingTypes.includes("DEVICE")) {
                reasons.push("Device biometric check failed: Native biometric verification was not completed.");
            }
            if (blockingTypes.includes("NETWORK")) {
                reasons.push("Campus network check failed: Not connected to an authorized university network.");
            }
            if (blockingTypes.includes("SCHEDULE")) {
                reasons.push("Schedule check failed: Attendance is outside permitted institutional hours.");
            }
            if (reasons.length > 0) {
                return reasons.join(" ");
            }
        }
        if (verif?.reason && verif.reason !== "One or more required verification checks failed.") {
            return verif.reason;
        }
        return "One or more required verification checks failed (location, biometric, network, or schedule).";
    }

    switch (code) {
        case "ATTENDANCE_ALREADY_EXISTS":
            return "You have already checked in today.";
        case "CHECK_IN_REQUIRED":
            return "Check-in is required before you can check out.";
        case "CHECK_OUT_ALREADY_COMPLETED":
            return "You have already checked out today.";
        case "FACULTY_INACTIVE":
            return "Your faculty account is currently inactive. Contact your administrator.";
        case "FACULTY_NOT_FOUND":
            return "Faculty profile was not found.";
        case "FACULTY_PROFILE_UNAVAILABLE":
            return "Authenticated faculty profile is not available.";
        case "ATTENDANCE_VERIFICATION_INCOMPLETE":
            return msg || "Attendance verification is incomplete.";
        case "ATTENDANCE_BEFORE_START_WINDOW":
            return msg || "Attendance check-in has not started yet.";
        case "ATTENDANCE_AFTER_END_WINDOW":
            return msg || "Attendance check-in window has ended.";
        case "ATTENDANCE_OUTSIDE_ALLOWED_TIME":
            return msg || "Attendance cannot be recorded outside the permitted schedule window.";
        case "NETWORK_ERROR":
            return "Unable to connect to the FacultyFlow server. Please check your internet connection.";
        case "TIMEOUT_ERROR":
            return "The request timed out. Please try again.";
        case "AUTH_ERROR":
            return "Your authentication session has expired. Please sign in again.";
        default:
            return msg || fallbackMessage;
    }
}


export function AttendanceProvider({ children }) {
    const { user, accessToken } = useAuth();
    const currentUserId = user?.id || user?.userId || user?.facultyId || null;

    const [attendance, setAttendance] = useState(null);
    const [verification, setVerification] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Synchronization States (Phase 3 & Phase 4 Hardening)
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncingState, setIsSyncingState] = useState(false);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);
    const [failedSyncCount, setFailedSyncCount] = useState(0);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    // Refresh pending & failed offline queue counts for current faculty member
    const refreshPendingCount = useCallback(async () => {
        if (!currentUserId) {
            setPendingSyncCount(0);
            setFailedSyncCount(0);
            return;
        }
        try {
            const [pending, failed] = await Promise.all([
                getPendingCount(currentUserId),
                getFailedCount ? getFailedCount(currentUserId) : 0
            ]);
            setPendingSyncCount(pending);
            setFailedSyncCount(failed);
        } catch (err) {
            console.error("Failed to fetch pending sync count:", err);
        }
    }, [currentUserId]);

    // Refresh today's attendance record from authoritative server
    const refreshAttendance = useCallback(async (silent = false) => {
        if (!accessToken) {
            setAttendance(null);
            setVerification(null);
            return;
        }

        if (!silent) setLoading(true);
        setError(null);

        try {
            const response = await getTodayAttendance(accessToken);
            if (response?.success) {
                setAttendance(response.attendance || null);
                setVerification(response.verification || null);
            } else {
                setAttendance(null);
                setVerification(null);
            }
        } catch (err) {
            // If offline, do not overwrite optimistic offline state with null
            const online = await isNetworkConnected();
            if (!online) {
                // Keep local attendance state intact
            } else {
                console.error("Failed to fetch today attendance:", err);
                setError(getAttendanceErrorMessage(err, "Unable to load attendance status."));
            }
        } finally {
            if (!silent) setLoading(false);
            await refreshPendingCount();
        }
    }, [accessToken, refreshPendingCount]);

    // Manual or automatic synchronization trigger
    const triggerSync = useCallback(async () => {
        if (!accessToken || !currentUserId || isSyncingState) {
            return { success: false, skipped: true };
        }

        setIsSyncingState(true);
        try {
            const result = await syncUserEvents(accessToken, currentUserId);
            await refreshPendingCount();

            if (result.syncedCount > 0) {
                setLastSyncTime(new Date().toISOString());
                // Refresh from server to get authoritative timestamps
                await refreshAttendance(true);
            }

            return result;
        } catch (err) {
            console.error("Sync run error:", err);
            return { success: false, error: err.message };
        } finally {
            setIsSyncingState(false);
        }
    }, [accessToken, currentUserId, isSyncingState, refreshPendingCount, refreshAttendance]);

    const [activePolicy, setActivePolicy] = useState(null);
    const [policyLoading, setPolicyLoading] = useState(false);

    // Fetch active policy from server
    const fetchPolicy = useCallback(async () => {
        if (!accessToken) return null;
        setPolicyLoading(true);
        try {
            const res = await getActiveAttendancePolicy(accessToken);
            if (res?.success && res.policy) {
                setActivePolicy(res.policy);
                return res.policy;
            }
        } catch (err) {
            console.warn("Could not fetch active policy:", err.message);
        } finally {
            setPolicyLoading(false);
        }
        return null;
    }, [accessToken]);

    // Initial load when user/token changes
    useEffect(() => {
        if (accessToken) {
            refreshAttendance(false);
            refreshPendingCount();
            fetchPolicy();
        } else {
            setAttendance(null);
            setVerification(null);
            setActivePolicy(null);
            setError(null);
            setSuccessMessage(null);
            setPendingSyncCount(0);
        }
    }, [accessToken, currentUserId, refreshAttendance, refreshPendingCount, fetchPolicy]);

    // Monitor network connectivity and auto-trigger sync on reconnection
    useEffect(() => {
        let isMounted = true;

        isNetworkConnected().then((online) => {
            if (isMounted) setIsOnline(online);
        });

        const unsubscribe = subscribeNetworkStatus(async (connected) => {
            if (!isMounted) return;
            setIsOnline(connected);

            // Reconnected to internet: trigger background synchronization
            if (connected && accessToken && currentUserId) {
                try {
                    await triggerSync();
                } catch (err) {
                    console.error("Auto-sync error on reconnect:", err);
                }
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [accessToken, currentUserId, triggerSync]);

    // Perform Check-In (Online with Seamless Offline Fallback)
    const performCheckIn = useCallback(async (customSignals = null) => {
        if (!accessToken || !currentUserId) {
            setError("You must be logged in to check in.");
            return { success: false, error: "Not authenticated" };
        }

        if (actionLoading) {
            return { success: false, error: "Request already in progress" };
        }

        setActionLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Use custom collected observations if provided, or collect default device & location
            let payloadSignals = customSignals;
            if (!payloadSignals) {
                const [device, locationResult] = await Promise.all([
                    getDeviceSignal(),
                    getLocationSignal()
                ]);

                payloadSignals = {
                    device,
                    location: locationResult?.signal || null,
                    network: null
                };
            }

            const connected = await isNetworkConnected();

            // PATH 1: Online authoritative check-in
            if (connected) {
                try {
                    const response = await checkInAttendance({
                        accessToken,
                        device: payloadSignals.device,
                        location: payloadSignals.location,
                        network: payloadSignals.network
                    });

                    if (response?.success) {
                        setAttendance(response.attendance);
                        setVerification(response.verification || null);
                        const msg = response.message || "Attendance checked in successfully.";
                        setSuccessMessage(msg);
                        return {
                            success: true,
                            attendance: response.attendance,
                            verification: response.verification
                        };
                    }
                    throw new Error(response?.message || "Check-in failed.");
                } catch (apiErr) {
                    const isNetworkFailure = apiErr?.isNetworkError || apiErr?.code === "NETWORK_ERROR" || apiErr?.status === 0;
                    if (!isNetworkFailure) {
                        // Business logic error from server (e.g. outside schedule, duplicate)
                        throw apiErr;
                    }
                    // Network dropped mid-call — fall through to offline queue
                    console.warn("Network error during online check-in, queuing offline event.");
                }
            }

            // PATH 2: Offline durable SQLite queuing
            const syncEventId = generateSyncEventId(currentUserId, "CHECK_IN");
            const clientTimestamp = new Date().toISOString();

            await enqueueOfflineEvent({
                eventId: syncEventId,
                userId: currentUserId,
                eventType: "CHECK_IN",
                payload: payloadSignals,
                clientTimestamp
            });

            // Optimistic local attendance state
            const optimisticAttendance = {
                date: clientTimestamp,
                checkInTime: clientTimestamp,
                checkOutTime: null,
                status: "Present",
                verificationStatus: "Pending Sync",
                syncStatus: "PENDING_SYNC",
                syncEventId
            };

            setAttendance(optimisticAttendance);
            await refreshPendingCount();

            const offlineMsg = "Offline check-in saved to device. It will automatically synchronize when connection returns.";
            setSuccessMessage(offlineMsg);

            return {
                success: true,
                offline: true,
                attendance: optimisticAttendance,
                syncEventId
            };
        } catch (err) {
            console.error("Check-in error:", err);

            const verifData = err?.verification || err?.data?.verification || null;
            if (verifData && verifData.result === "FAILED") {
                setVerification(verifData);
            }

            const friendlyError = getAttendanceErrorMessage(err, "Check-in failed.");
            setError(friendlyError);
            return {
                success: false,
                error: friendlyError,
                verification: verifData,
                blockingTypes: err?.blockingTypes || err?.data?.blockingTypes || verifData?.blockingTypes || []
            };
        } finally {
            setActionLoading(false);
        }
    }, [accessToken, currentUserId, actionLoading, refreshPendingCount]);


    // Perform Check-Out (Online with Seamless Offline Fallback)
    const performCheckOut = useCallback(async () => {
        if (!accessToken || !currentUserId) {
            setError("You must be logged in to check out.");
            return { success: false, error: "Not authenticated" };
        }

        if (actionLoading) {
            return { success: false, error: "Request already in progress" };
        }

        setActionLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const [device, locationResult] = await Promise.all([
                getDeviceSignal(),
                getLocationSignal()
            ]);

            const payloadSignals = {
                device,
                location: locationResult?.signal || null,
                network: null
            };

            const connected = await isNetworkConnected();

            // PATH 1: Online authoritative check-out
            if (connected) {
                try {
                    const response = await checkOutAttendance({
                        accessToken,
                        device: payloadSignals.device,
                        location: payloadSignals.location,
                        network: payloadSignals.network
                    });

                    if (response?.success) {
                        setAttendance(response.attendance);
                        setVerification(response.verification || null);
                        const msg = response.message || "Attendance checked out successfully.";
                        setSuccessMessage(msg);
                        return {
                            success: true,
                            attendance: response.attendance,
                            verification: response.verification
                        };
                    }
                    throw new Error(response?.message || "Check-out failed.");
                } catch (apiErr) {
                    const isNetworkFailure = apiErr?.isNetworkError || apiErr?.code === "NETWORK_ERROR" || apiErr?.status === 0;
                    if (!isNetworkFailure) {
                        throw apiErr;
                    }
                    console.warn("Network error during online check-out, queuing offline event.");
                }
            }

            // PATH 2: Offline durable SQLite queuing
            const syncEventId = generateSyncEventId(currentUserId, "CHECK_OUT");
            const clientTimestamp = new Date().toISOString();

            await enqueueOfflineEvent({
                eventId: syncEventId,
                userId: currentUserId,
                eventType: "CHECK_OUT",
                payload: payloadSignals,
                clientTimestamp
            });

            // Optimistic update of existing record
            setAttendance((prev) => ({
                ...(prev || {}),
                date: prev?.date || clientTimestamp,
                checkOutTime: clientTimestamp,
                syncStatus: "PENDING_SYNC",
                checkOutSyncEventId: syncEventId
            }));

            await refreshPendingCount();

            const offlineMsg = "Offline check-out saved to device. It will automatically synchronize when connection returns.";
            setSuccessMessage(offlineMsg);

            return {
                success: true,
                offline: true,
                syncEventId
            };
        } catch (err) {
            console.error("Check-out error:", err);

            if (err?.verification) {
                setVerification(err.verification);
            } else if (err?.data?.verification) {
                setVerification(err.data.verification);
            }

            const friendlyError = getAttendanceErrorMessage(err, "Check-out failed.");
            setError(friendlyError);
            return { success: false, error: friendlyError };
        } finally {
            setActionLoading(false);
        }
    }, [accessToken, currentUserId, actionLoading, refreshPendingCount]);

    const clearMessages = useCallback(() => {
        setError(null);
        setSuccessMessage(null);
    }, []);

    // State machine helpers
    const isCheckedIn = Boolean(attendance?.checkInTime);
    const isCheckedOut = Boolean(attendance?.checkOutTime);
    const canCheckIn = !isCheckedIn && !actionLoading;
    const canCheckOut = isCheckedIn && !isCheckedOut && !actionLoading;
    const attendanceStatus = attendance?.status || (isCheckedIn ? "Present" : "Not Checked In");
    const verificationStatus = attendance?.verificationStatus || verification?.result || (isCheckedIn && attendance?.syncStatus === "PENDING_SYNC" ? "Pending Sync" : "Pending");

    const retryFailedSync = useCallback(async () => {
        if (!currentUserId) return;
        await retryFailedEvents(currentUserId);
        await refreshPendingCount();
        await triggerSync();
    }, [currentUserId, refreshPendingCount, triggerSync]);

    // Unified sync status for UI
    const syncStatus = !isOnline
        ? "OFFLINE"
        : isSyncingState
            ? "SYNCING"
            : failedSyncCount > 0
                ? "FAILED"
                : pendingSyncCount > 0
                    ? "PENDING_SYNC"
                    : "SYNCED";

    const value = useMemo(() => ({
        attendance,
        verification,
        activePolicy,
        policyLoading,
        fetchPolicy,
        loading,
        actionLoading,
        error,
        successMessage,
        isCheckedIn,
        isCheckedOut,
        canCheckIn,
        canCheckOut,
        attendanceStatus,
        verificationStatus,
        // Phase 3 & 4 Synchronization
        isOnline,
        isSyncing: isSyncingState,
        pendingCount: pendingSyncCount,
        pendingSyncCount,
        failedCount: failedSyncCount,
        failedSyncCount,
        lastSyncTime,
        syncStatus,
        triggerSync,
        retryFailedSync,
        refreshAttendance,
        performCheckIn,
        performCheckOut,
        clearMessages
    }), [
        attendance,
        verification,
        activePolicy,
        policyLoading,
        fetchPolicy,
        loading,
        actionLoading,
        error,
        successMessage,
        isCheckedIn,
        isCheckedOut,
        canCheckIn,
        canCheckOut,
        attendanceStatus,
        verificationStatus,
        isOnline,
        isSyncingState,
        pendingSyncCount,
        failedSyncCount,
        lastSyncTime,
        syncStatus,
        triggerSync,
        retryFailedSync,
        refreshAttendance,
        performCheckIn,
        performCheckOut,
        clearMessages
    ]);


    return (
        <AttendanceContext.Provider value={value}>
            {children}
        </AttendanceContext.Provider>
    );
}

export function useAttendance() {
    const context = useContext(AttendanceContext);
    if (!context) {
        throw new Error("useAttendance must be used within an AttendanceProvider");
    }
    return context;
}

export default AttendanceContext;