import {
    useEffect,
    useState
} from "react";

import PolicySection
    from "../components/AdminPolicy/PolicySection";

import PolicyForm
    from "../components/AdminPolicy/PolicyForm";

import {
    getActiveAttendancePolicy,
    saveAttendancePolicy
} from "../services/admin/policyService";

import {
    validatePolicy
} from "../utils/admin/policyValidation";

import useAuth
    from "../hooks/useAuth";


// ============================================================
// BACKEND → FRONTEND POLICY ADAPTER
// ============================================================

function mapBackendPolicyToForm(
    backendPolicy
) {

    const requiredSignals =
        backendPolicy?.requiredSignals || [];

    const attendanceMode =
        backendPolicy?.attendanceMode ||
        (requiredSignals.includes("SCHEDULE") ? "SCHEDULED" : "FLEXIBLE");

    return {

        // ----------------------------------------------------
        // POLICY ID & MODE
        // ----------------------------------------------------

        policyId:
            backendPolicy?.policyId || null,

        attendanceMode,

        minWorkingHours:
            backendPolicy?.minWorkingHours ?? 8,

        // ----------------------------------------------------
        // ATTENDANCE WINDOW
        // ----------------------------------------------------

        checkInStartTime:
            backendPolicy?.startTime || "",

        checkInEndTime:
            backendPolicy?.endTime || "",


        // ----------------------------------------------------
        // POLICY TIMINGS
        // ----------------------------------------------------

        gracePeriodMinutes:
            backendPolicy?.gracePeriod ?? 0,

        lateThreshold:
            backendPolicy?.lateThreshold ?? 0,

        earlyExitThreshold:
            backendPolicy?.earlyExitThreshold ?? 0,

        timezone:
            backendPolicy?.timezone || "Asia/Kolkata",


        // ----------------------------------------------------
        // VERIFICATION SETTINGS
        // ----------------------------------------------------

        identityVerification:
            requiredSignals.includes(
                "IDENTITY"
            ),

        biometricVerification:
            requiredSignals.includes(
                "DEVICE"
            ),

        networkVerification:
            requiredSignals.includes(
                "NETWORK"
            ),

        locationVerification:
            requiredSignals.includes(
                "LOCATION"
            ),

        scheduleVerification:
            requiredSignals.includes(
                "SCHEDULE"
            ),


        // ----------------------------------------------------
        // ACTIVE STATE
        // ----------------------------------------------------

        active:
            Boolean(
                backendPolicy?.active
            )

    };

}


// ============================================================
// FRONTEND → BACKEND POLICY ADAPTER
// ============================================================

function mapFormPolicyToBackend(
    policy
) {

    const requiredSignals = [];


    // --------------------------------------------------------
    // IDENTITY
    // --------------------------------------------------------

    if (
        policy.identityVerification
    ) {

        requiredSignals.push(
            "IDENTITY"
        );

    }


    // --------------------------------------------------------
    // DEVICE / BIOMETRIC
    // --------------------------------------------------------

    if (
        policy.biometricVerification
    ) {

        requiredSignals.push(
            "DEVICE"
        );

    }


    // --------------------------------------------------------
    // NETWORK
    // --------------------------------------------------------

    if (
        policy.networkVerification
    ) {

        requiredSignals.push(
            "NETWORK"
        );

    }


    // --------------------------------------------------------
    // LOCATION
    // --------------------------------------------------------

    if (
        policy.locationVerification
    ) {

        requiredSignals.push(
            "LOCATION"
        );

    }


    // --------------------------------------------------------
    // SCHEDULE (Only when scheduled mode is strictly active)
    // --------------------------------------------------------

    if (
        policy.attendanceMode === "SCHEDULED" &&
        policy.scheduleVerification !== false
    ) {

        requiredSignals.push(
            "SCHEDULE"
        );

    }


    return {

        attendanceMode:
            policy.attendanceMode || "FLEXIBLE",

        startTime:
            policy.checkInStartTime || null,

        endTime:
            policy.checkInEndTime || null,

        gracePeriod:
            policy.gracePeriodMinutes !== "" && policy.gracePeriodMinutes !== undefined && policy.gracePeriodMinutes !== null
                ? Number(policy.gracePeriodMinutes)
                : 0,

        lateThreshold:
            Number(
                policy.lateThreshold || 0
            ),

        earlyExitThreshold:
            Number(
                policy.earlyExitThreshold || 0
            ),

        minWorkingHours:
            Number(
                policy.minWorkingHours || 0
            ),

        requiredSignals,

        timezone:
            policy.timezone || "Asia/Kolkata",

        active:
            Boolean(
                policy.active
            )

    };

}


// ============================================================
// PAGE
// ============================================================

function PolicyConfigurationPage() {

    const {
        accessToken
    } = useAuth();


    // ========================================================
    // POLICY STATE
    // ========================================================

    const [
        policy,
        setPolicy
    ] = useState(null);

    const [
        initialPolicy,
        setInitialPolicy
    ] = useState(null);


    // ========================================================
    // LOADING STATE
    // ========================================================

    const [
        loading,
        setLoading
    ] = useState(true);


    // ========================================================
    // SAVING STATE
    // ========================================================

    const [
        saving,
        setSaving
    ] = useState(false);


    // ========================================================
    // ERROR STATE
    // ========================================================

    const [
        error,
        setError
    ] = useState("");


    // ========================================================
    // VALIDATION ERRORS
    // ========================================================

    const [
        errors,
        setErrors
    ] = useState({});


    // ========================================================
    // STATUS MESSAGE
    // ========================================================

    const [
        message,
        setMessage
    ] = useState("");


    // ========================================================
    // LOAD ACTIVE POLICY
    // ========================================================

    useEffect(() => {

        async function loadPolicy() {

            // ------------------------------------------------
            // AUTH CHECK
            // ------------------------------------------------

            if (!accessToken) {

                setLoading(false);

                setError(
                    "Authentication session is missing."
                );

                return;

            }


            setLoading(true);

            setError("");

            setMessage("");


            try {

                // --------------------------------------------
                // CALL BACKEND
                // --------------------------------------------

                const response =
                    await getActiveAttendancePolicy(
                        accessToken
                    );


                // --------------------------------------------
                // BACKEND RESPONSE
                // --------------------------------------------

                const backendPolicy =
                    response?.policy ||
                    response?.data?.policy ||
                    null;


                // --------------------------------------------
                // NO ACTIVE POLICY
                // --------------------------------------------

                if (!backendPolicy) {

                    setPolicy(null);

                    setError(
                        "No active attendance policy is configured."
                    );

                    return;

                }


                // --------------------------------------------
                // MAP BACKEND → UI
                // --------------------------------------------

                const formPolicy =
                    mapBackendPolicyToForm(
                        backendPolicy
                    );

                setPolicy(
                    formPolicy
                );

                setInitialPolicy(
                    formPolicy
                );

                setErrors({});

            } catch (requestError) {

                console.error(
                    "Failed to load attendance policy:",
                    requestError
                );

                setPolicy(null);
                setInitialPolicy(null);

                setError(
                    requestError?.message ||
                    "Failed to load attendance policy."
                );

            } finally {

                setLoading(false);

            }

        }

        loadPolicy();

    }, [accessToken]);


    // ========================================================
    // FIELD CHANGE
    // ========================================================

    function handleChange(
        field,
        value
    ) {

        setPolicy(
            current => ({

                ...current,

                [field]:
                    value

            })
        );

        setErrors(
            current => ({

                ...current,

                [field]:
                    undefined

            })
        );

        setMessage("");

    }


    // ========================================================
    // TOGGLE
    // ========================================================

    function handleToggle(
        field
    ) {

        setPolicy(
            current => ({

                ...current,

                [field]:
                    !current[field]

            })
        );

        setErrors(
            current => ({

                ...current,

                requiredVerification:
                    undefined

            })
        );

        setMessage("");

    }


    // ========================================================
    // SAVE POLICY
    // ========================================================

    async function handleSave() {

        if (!policy) {

            return;

        }


        // ====================================================
        // FRONTEND VALIDATION
        // ====================================================

        const validation =
            validatePolicy(
                policy
            );


        if (!validation.isValid) {

            setErrors(
                validation.errors
            );

            setMessage(
                "Please correct the highlighted policy fields."
            );

            return;

        }


        // ====================================================
        // AUTH CHECK
        // ====================================================

        if (!accessToken) {

            setMessage(
                "Authentication session is missing."
            );

            return;

        }


        setSaving(true);

        setMessage("");

        setError("");


        try {

            // =================================================
            // UI MODEL → BACKEND MODEL
            // =================================================

            const backendPolicy =
                mapFormPolicyToBackend(
                    policy
                );


            // =================================================
            // PRESERVE POLICY ID
            // =================================================
            //
            // Existing policy:
            // PUT /api/admin/policy/:policyId
            //
            // New policy:
            // POST /api/admin/policy
            //
            // =================================================

            if (policy.policyId) {

                backendPolicy.policyId =
                    policy.policyId;

            }


            // =================================================
            // SAVE TO BACKEND
            // =================================================

            const response =
                await saveAttendancePolicy(
                    backendPolicy,
                    accessToken
                );


            // =================================================
            // EXTRACT SAVED POLICY
            // =================================================

            const savedBackendPolicy =
                response?.policy ||
                response?.data?.policy ||
                null;


            if (!savedBackendPolicy) {

                throw new Error(
                    "The server did not return the saved policy."
                );

            }


            // =================================================
            // BACKEND → UI MODEL
            // =================================================

            const savedFormPolicy =
                mapBackendPolicyToForm(
                    savedBackendPolicy
                );


            // =================================================
            // UPDATE UI
            // =================================================

            setPolicy(
                savedFormPolicy
            );

            setInitialPolicy(
                savedFormPolicy
            );

            setErrors({});


            // =================================================
            // SUCCESS MESSAGE
            // =================================================

            setMessage(
                "Attendance policy saved successfully."
            );

        } catch (requestError) {

            console.error(
                "Failed to save attendance policy:",
                requestError
            );


            setMessage(
                requestError?.message ||
                "Failed to save attendance policy."
            );

        } finally {

            setSaving(false);

        }

    }


    // ========================================================
    // RESET
    // ========================================================
    // Reverts any unsaved changes back to the active server
    // configuration loaded from MongoDB.
    // ========================================================

    function handleReset() {

        if (initialPolicy) {
            setPolicy({
                ...initialPolicy
            });

            setErrors({});

            setMessage(
                "Policy form has been reset to the active server configuration."
            );
        } else {
            setMessage(
                "No baseline server configuration is loaded to reset."
            );
        }

    }


    // ========================================================
    // LOADING UI
    // ========================================================

    if (loading) {

        return (

            <section className="admin-dashboard">

                <div className="page-header dashboard-header">

                    <div>

                        <span className="eyebrow">
                            ADMIN WORKSPACE
                        </span>

                        <h1>
                            Policy Configuration
                        </h1>

                        <p>
                            Loading attendance policy...
                        </p>

                    </div>

                </div>


                <div className="loading-state">

                    <h2>
                        Loading Policy
                    </h2>

                    <p>
                        Fetching the active attendance policy from the server.
                    </p>

                </div>

            </section>

        );

    }


    // ========================================================
    // ERROR UI
    // ========================================================

    if (error && !policy) {

        return (

            <section className="admin-dashboard">

                <div className="page-header dashboard-header">

                    <div>

                        <span className="eyebrow">
                            ADMIN WORKSPACE
                        </span>

                        <h1>
                            Policy Configuration
                        </h1>

                        <p>
                            Configure attendance windows, grace period and verification rules.
                        </p>

                    </div>

                    <span className="policy-status">
                        UNAVAILABLE
                    </span>

                </div>


                <div className="error-state">

                    <h2>
                        Unable to Load Policy
                    </h2>

                    <p>
                        {error}
                    </p>

                </div>

            </section>

        );

    }


    // ========================================================
    // VERIFICATION COUNT
    // ========================================================

    const enabledCount = [

        policy?.identityVerification,

        policy?.biometricVerification,

        policy?.networkVerification,

        policy?.locationVerification,

        policy?.scheduleVerification

    ].filter(Boolean).length;


    // ========================================================
    // PAGE
    // ========================================================

    return (

        <section className="admin-dashboard">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="page-header dashboard-header">

                <div>

                    <span className="eyebrow">
                        ADMIN WORKSPACE
                    </span>

                    <h1>
                        Policy Configuration
                    </h1>

                    <p>
                        Configure attendance windows, grace period and verification rules.
                    </p>

                </div>


                <span className="policy-status">

                    {policy?.active
                        ? "ACTIVE"
                        : "INACTIVE"}

                </span>

            </div>


            {/* ==================================================
                STATUS MESSAGE
            ================================================== */}

            {message && (

                <div className="policy-message">

                    {message}

                </div>

            )}


            {/* ==================================================
                BACKEND ERROR
            ================================================== */}

            {error && (

                <div className="policy-message">

                    {error}

                </div>

            )}


            {/* ==================================================
                FORM
            ================================================== */}

            <PolicySection

                title="Attendance Policy"

                description="Configure when faculty can record attendance."

            >

                <PolicyForm

                    policy={policy}

                    errors={errors}

                    onChange={handleChange}

                    onToggle={handleToggle}

                    onSave={handleSave}

                    onReset={handleReset}

                    saving={saving}

                />

            </PolicySection>


            {/* ==================================================
                CURRENT CONFIGURATION
            ================================================== */}

            <PolicySection

                title="Current Configuration"

                description="Review the currently configured attendance rules."

            >

                <div className="policy-current-grid">


                    {/* ------------------------------------------
                        ATTENDANCE MODE
                    ------------------------------------------ */}

                    <div className="policy-current-card">

                        <span>
                            Attendance Mode
                        </span>

                        <strong>
                            {policy?.attendanceMode === "SCHEDULED" ? "Scheduled Window" : "Flexible Attendance"}
                        </strong>

                    </div>


                    {/* ------------------------------------------
                        CHECK-IN WINDOW
                    ------------------------------------------ */}

                    <div className="policy-current-card">

                        <span>
                            Check-in Window
                        </span>

                        <strong>

                            {policy?.attendanceMode === "SCHEDULED" || (policy?.checkInStartTime && policy?.checkInEndTime)
                                ? `${policy?.checkInStartTime || "—"} – ${policy?.checkInEndTime || "—"}`
                                : "Any time (Flexible)"}

                        </strong>

                    </div>


                    {/* ------------------------------------------
                        WORKING HOURS / GRACE PERIOD
                    ------------------------------------------ */}

                    <div className="policy-current-card">

                        <span>
                            {policy?.attendanceMode === "SCHEDULED" ? "Grace Period" : "Target Work Hours"}
                        </span>

                        <strong>

                            {policy?.attendanceMode === "SCHEDULED"
                                ? `${policy?.gracePeriodMinutes || 0} minutes`
                                : `${policy?.minWorkingHours || 8} hours`}

                        </strong>

                    </div>


                    {/* ------------------------------------------
                        VERIFICATION
                    ------------------------------------------ */}

                    <div className="policy-current-card">

                        <span>
                            Verification Methods
                        </span>

                        <strong>

                            {enabledCount}

                            {" enabled"}

                        </strong>

                    </div>


                    {/* ------------------------------------------
                        POLICY STATUS
                    ------------------------------------------ */}

                    <div className="policy-current-card">

                        <span>
                            Policy Status
                        </span>

                        <strong>

                            {policy?.active
                                ? "Active"
                                : "Inactive"}

                        </strong>

                    </div>

                </div>

            </PolicySection>


            {/* ==================================================
                SECURITY NOTE
            ================================================== */}

            <div className="profile-note">

                <div className="note-icon">
                    !
                </div>

                <div>

                    <strong>
                        Policy authority
                    </strong>

                    <p>

                        Attendance policy is now loaded from the
                        backend service. The backend remains the
                        authoritative source for attendance
                        enforcement and server-side policy decisions.

                    </p>

                </div>

            </div>


        </section>

    );

}


export default PolicyConfigurationPage;