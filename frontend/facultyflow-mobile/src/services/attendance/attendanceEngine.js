import {
    runVerification
} from "../verification/verificationEngine";

export const ATTENDANCE_STATUS = {
    NOT_CHECKED_IN: "NOT_CHECKED_IN",
    CHECKED_IN: "CHECKED_IN",
    CHECKED_OUT: "CHECKED_OUT"
};

export const SYNC_STATUS = {
    LOCAL: "LOCAL",
    PENDING_SYNC: "PENDING_SYNC",
    SYNCED: "SYNCED"
};

function getCurrentDate() {
    return new Date()
        .toISOString()
        .split("T")[0];
}

function getCurrentTimestamp() {
    return new Date().toISOString();
}

function generateEventId() {
    return `attendance_${Date.now()}`;
}

function getCurrentTime() {
    const now = new Date();

    return {
        hours: now.getHours(),
        minutes: now.getMinutes()
    };
}

function createFailure(
    action,
    reason,
    verification = null
) {
    return {
        success: false,
        action,
        status: "REJECTED",
        reason,
        verification,
        attendance: null,
        event: null
    };
}

function createSuccess(
    action,
    attendance,
    verification
) {
    return {
        success: true,
        action,
        status: "APPROVED",
        reason: null,
        attendance,
        verification,
        event: {
            id: generateEventId(),
            type: action,
            facultyId: attendance.facultyId,
            date: attendance.date,
            timestamp: getCurrentTimestamp(),
            syncStatus: SYNC_STATUS.PENDING_SYNC
        }
    };
}

export async function checkIn({
    user,
    attendance,
    policy
}) {
    if (!user) {
        return createFailure(
            "CHECK_IN",
            "Authenticated faculty is required."
        );
    }

    if (
        attendance.status ===
        ATTENDANCE_STATUS.CHECKED_IN
    ) {
        return createFailure(
            "CHECK_IN",
            "You have already checked in today."
        );
    }

    if (
        attendance.status ===
        ATTENDANCE_STATUS.CHECKED_OUT
    ) {
        return createFailure(
            "CHECK_IN",
            "Today's attendance is already completed."
        );
    }

    const verification =
        await runVerification({
            user,
            currentTime: getCurrentTime(),
            policy
        });

    const requiredSignals =
        policy?.requiredSignals || [
            "identity",
            "schedule"
        ];

    const failedChecks =
        verification.results.filter(
            result =>
                requiredSignals.includes(
                    result.key
                ) &&
                !result.passed
        );

    if (failedChecks.length > 0) {
        return createFailure(
            "CHECK_IN",
            failedChecks[0].reason ||
                "Required verification failed.",
            verification
        );
    }

    const updatedAttendance = {
        ...attendance,

        facultyId: user.id,

        date: getCurrentDate(),

        status:
            ATTENDANCE_STATUS.CHECKED_IN,

        checkInTime:
            getCurrentTimestamp(),

        checkOutTime: null,

        syncStatus:
            SYNC_STATUS.PENDING_SYNC
    };

    return createSuccess(
        "CHECK_IN",
        updatedAttendance,
        verification
    );
}

export async function checkOut({
    user,
    attendance,
    policy
}) {
    if (!user) {
        return createFailure(
            "CHECK_OUT",
            "Authenticated faculty is required."
        );
    }

    if (
        attendance.status ===
        ATTENDANCE_STATUS.NOT_CHECKED_IN
    ) {
        return createFailure(
            "CHECK_OUT",
            "You must check in before checking out."
        );
    }

    if (
        attendance.status ===
        ATTENDANCE_STATUS.CHECKED_OUT
    ) {
        return createFailure(
            "CHECK_OUT",
            "You have already checked out today."
        );
    }

    const verification =
        await runVerification({
            user,
            currentTime: getCurrentTime(),
            policy
        });

    const requiredSignals =
        policy?.requiredSignals || [
            "identity"
        ];

    const failedChecks =
        verification.results.filter(
            result =>
                requiredSignals.includes(
                    result.key
                ) &&
                !result.passed
        );

    if (failedChecks.length > 0) {
        return createFailure(
            "CHECK_OUT",
            failedChecks[0].reason ||
                "Required verification failed.",
            verification
        );
    }

    const updatedAttendance = {
        ...attendance,

        status:
            ATTENDANCE_STATUS.CHECKED_OUT,

        checkOutTime:
            getCurrentTimestamp(),

        syncStatus:
            SYNC_STATUS.PENDING_SYNC
    };

    return createSuccess(
        "CHECK_OUT",
        updatedAttendance,
        verification
    );
}