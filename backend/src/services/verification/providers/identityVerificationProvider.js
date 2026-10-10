import {
    VERIFICATION_RESULTS,
    VERIFICATION_REASONS
} from "../verificationConstants.js";


// ============================================================
// IDENTITY VERIFICATION
// ============================================================

export async function verifyIdentity({
    user,
    faculty
}) {

    if (!user) {

        return {

            type: "IDENTITY",

            result:
                VERIFICATION_RESULTS.FAILED,

            reason:
                "Authenticated user is unavailable."

        };

    }


    if (!faculty) {

        return {

            type: "IDENTITY",

            result:
                VERIFICATION_RESULTS.FAILED,

            reason:
                "Faculty profile is unavailable."

        };

    }


    // --------------------------------------------------------
    // Identity is derived from authenticated server-side
    // user + faculty relationship.
    // --------------------------------------------------------

    if (
        user.facultyId !==
        faculty.facultyId
    ) {

        return {

            type: "IDENTITY",

            result:
                VERIFICATION_RESULTS.FAILED,

            reason:
                "Authenticated identity does not match faculty profile."

        };

    }


    return {

        type: "IDENTITY",

        result:
            VERIFICATION_RESULTS.VERIFIED,

        reason:
            VERIFICATION_REASONS.IDENTITY_VERIFIED,

        metadata: {

            userId:
                user.userId,

            facultyId:
                faculty.facultyId

        }

    };

}