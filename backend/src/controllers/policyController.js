import {

    getActiveAttendancePolicy,

    getAllPolicies,

    getPolicyById,

    createAttendancePolicy,

    updateAttendancePolicy,

    activateAttendancePolicy,

    deactivateAttendancePolicy

} from "../services/attendance/policyService.js";


import {

    recordPolicyAttempt,

    recordPolicySuccess,

    recordPolicyFailure

} from "../services/audit/auditService.js";


import {

    AUDIT_ACTIONS

} from "../services/audit/auditConstants.js";


// ============================================================
// GET ACTIVE POLICY
// ============================================================

export async function getActivePolicyController(

    req,

    res,

    next

) {

    try {

        const policy =
            await getActiveAttendancePolicy();


        return res

            .status(200)

            .json({

                success:
                    true,

                policy

            });

    } catch (error) {

        next(error);

    }

}


// ============================================================
// GET ALL POLICIES
// ============================================================

export async function getAllPoliciesController(

    req,

    res,

    next

) {

    try {

        const policies =
            await getAllPolicies();


        return res

            .status(200)

            .json({

                success:
                    true,

                count:
                    policies.length,

                policies

            });

    } catch (error) {

        next(error);

    }

}


// ============================================================
// GET POLICY BY ID
// ============================================================

export async function getPolicyByIdController(

    req,

    res,

    next

) {

    try {

        const policy =
            await getPolicyById(

                req.params.policyId

            );


        return res

            .status(200)

            .json({

                success:
                    true,

                policy

            });

    } catch (error) {

        next(error);

    }

}


// ============================================================
// CREATE POLICY
// ============================================================

export async function createPolicyController(

    req,

    res,

    next

) {

    const actorId =
        req.user?.userId;

    const actorRole =
        req.user?.role;


    let createdPolicyId =
        null;


    // ========================================================
    // AUDIT — ATTEMPT
    // ========================================================

    try {

        await recordPolicyAttempt({

            actorId,

            actorRole,

            action:
                AUDIT_ACTIONS
                    .POLICY_CREATE_ATTEMPT

        });

    } catch (auditError) {

        console.error(

            "Failed to record policy create attempt audit:",

            auditError

        );

    }


    // ========================================================
    // CREATE POLICY
    // ========================================================

    try {

        const policy =
            await createAttendancePolicy(

                req.body

            );


        createdPolicyId =
            policy.policyId;


        // ====================================================
        // AUDIT — SUCCESS
        // ====================================================

        try {

            await recordPolicySuccess({

                actorId,

                actorRole,

                action:
                    AUDIT_ACTIONS
                        .POLICY_CREATE_SUCCESS,

                policyId:
                    createdPolicyId

            });

        } catch (auditError) {

            console.error(

                "Failed to record policy create success audit:",

                auditError

            );

        }


        return res

            .status(201)

            .json({

                success:
                    true,

                code:
                    "ATTENDANCE_POLICY_CREATED",

                message:
                    "Attendance policy created successfully.",

                policy

            });

    } catch (error) {

        // ====================================================
        // AUDIT — FAILURE
        // ====================================================

        try {

            await recordPolicyFailure({

                actorId,

                actorRole,

                action:
                    AUDIT_ACTIONS
                        .POLICY_CREATE_FAILED,

                policyId:
                    createdPolicyId,

                reason:
                    error.message ||
                    "Attendance policy creation failed."

            });

        } catch (auditError) {

            console.error(

                "Failed to record policy create failure audit:",

                auditError

            );

        }


        next(error);

    }

}


// ============================================================
// UPDATE POLICY
// ============================================================

export async function updatePolicyController(

    req,

    res,

    next

) {

    const actorId =
        req.user?.userId;

    const actorRole =
        req.user?.role;

    const policyId =
        req.params.policyId;


    // ========================================================
    // AUDIT — ATTEMPT
    // ========================================================

    try {

        await recordPolicyAttempt({

            actorId,

            actorRole,

            action:
                AUDIT_ACTIONS
                    .POLICY_UPDATE_ATTEMPT,

            policyId

        });

    } catch (auditError) {

        console.error(

            "Failed to record policy update attempt audit:",

            auditError

        );

    }


    // ========================================================
    // UPDATE POLICY
    // ========================================================

    try {

        const policy =
            await updateAttendancePolicy(

                policyId,

                req.body

            );


        // ====================================================
        // AUDIT — SUCCESS
        // ====================================================

        try {

            await recordPolicySuccess({

                actorId,

                actorRole,

                action:
                    AUDIT_ACTIONS
                        .POLICY_UPDATE_SUCCESS,

                policyId

            });

        } catch (auditError) {

            console.error(

                "Failed to record policy update success audit:",

                auditError

            );

        }


        return res

            .status(200)

            .json({

                success:
                    true,

                code:
                    "ATTENDANCE_POLICY_UPDATED",

                message:
                    "Attendance policy updated successfully.",

                policy

            });

    } catch (error) {

        // ====================================================
        // AUDIT — FAILURE
        // ====================================================

        try {

            await recordPolicyFailure({

                actorId,

                actorRole,

                action:
                    AUDIT_ACTIONS
                        .POLICY_UPDATE_FAILED,

                policyId,

                reason:
                    error.message ||
                    "Attendance policy update failed."

            });

        } catch (auditError) {

            console.error(

                "Failed to record policy update failure audit:",

                auditError

            );

        }


        next(error);

    }

}


// ============================================================
// ACTIVATE POLICY
// ============================================================

export async function activatePolicyController(

    req,

    res,

    next

) {

    const actorId =
        req.user?.userId;

    const actorRole =
        req.user?.role;

    const policyId =
        req.params.policyId;


    // ========================================================
    // AUDIT — ATTEMPT
    // ========================================================

    try {

        await recordPolicyAttempt({

            actorId,

            actorRole,

            action:
                AUDIT_ACTIONS
                    .POLICY_ACTIVATE_ATTEMPT,

            policyId

        });

    } catch (auditError) {

        console.error(

            "Failed to record policy activate attempt audit:",

            auditError

        );

    }


    // ========================================================
    // ACTIVATE POLICY
    // ========================================================

    try {

        const policy =
            await activateAttendancePolicy(

                policyId

            );


        // ====================================================
        // AUDIT — SUCCESS
        // ====================================================

        try {

            await recordPolicySuccess({

                actorId,

                actorRole,

                action:
                    AUDIT_ACTIONS
                        .POLICY_ACTIVATE_SUCCESS,

                policyId

            });

        } catch (auditError) {

            console.error(

                "Failed to record policy activate success audit:",

                auditError

            );

        }


        return res

            .status(200)

            .json({

                success:
                    true,

                code:
                    "ATTENDANCE_POLICY_ACTIVATED",

                message:
                    "Attendance policy activated successfully.",

                policy

            });

    } catch (error) {

        // ====================================================
        // AUDIT — FAILURE
        // ====================================================

        try {

            await recordPolicyFailure({

                actorId,

                actorRole,

                action:
                    AUDIT_ACTIONS
                        .POLICY_ACTIVATE_FAILED,

                policyId,

                reason:
                    error.message ||
                    "Attendance policy activation failed."

            });

        } catch (auditError) {

            console.error(

                "Failed to record policy activate failure audit:",

                auditError

            );

        }


        next(error);

    }

}


// ============================================================
// DEACTIVATE POLICY
// ============================================================

export async function deactivatePolicyController(

    req,

    res,

    next

) {

    const actorId =
        req.user?.userId;

    const actorRole =
        req.user?.role;

    const policyId =
        req.params.policyId;


    // ========================================================
    // AUDIT — ATTEMPT
    // ========================================================

    try {

        await recordPolicyAttempt({

            actorId,

            actorRole,

            action:
                AUDIT_ACTIONS
                    .POLICY_DEACTIVATE_ATTEMPT,

            policyId

        });

    } catch (auditError) {

        console.error(

            "Failed to record policy deactivate attempt audit:",

            auditError

        );

    }


    // ========================================================
    // DEACTIVATE POLICY
    // ========================================================

    try {

        const policy =
            await deactivateAttendancePolicy(

                policyId

            );


        // ====================================================
        // AUDIT — SUCCESS
        // ====================================================

        try {

            await recordPolicySuccess({

                actorId,

                actorRole,

                action:
                    AUDIT_ACTIONS
                        .POLICY_DEACTIVATE_SUCCESS,

                policyId

            });

        } catch (auditError) {

            console.error(

                "Failed to record policy deactivate success audit:",

                auditError

            );

        }


        return res

            .status(200)

            .json({

                success:
                    true,

                code:
                    "ATTENDANCE_POLICY_DEACTIVATED",

                message:
                    "Attendance policy deactivated successfully.",

                policy

            });

    } catch (error) {

        // ====================================================
        // AUDIT — FAILURE
        // ====================================================

        try {

            await recordPolicyFailure({

                actorId,

                actorRole,

                action:
                    AUDIT_ACTIONS
                        .POLICY_DEACTIVATE_FAILED,

                policyId,

                reason:
                    error.message ||
                    "Attendance policy deactivation failed."

            });

        } catch (auditError) {

            console.error(

                "Failed to record policy deactivate failure audit:",

                auditError

            );

        }


        next(error);

    }

}