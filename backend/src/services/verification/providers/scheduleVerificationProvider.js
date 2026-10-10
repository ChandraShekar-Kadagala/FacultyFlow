import {
    verifyScheduleTime
} from "../schedule/scheduleVerificationService.js";


// ============================================================
// SCHEDULE VERIFICATION PROVIDER
// ============================================================

export async function verifySchedule({

    action = "CHECK_IN",

    serverTime = new Date()

} = {}) {

    return verifyScheduleTime({

        action,

        serverTime

    });

}