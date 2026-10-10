import {
    facultyMembers,
    attendanceHistory
} from "../../data/mockData";

import {
    calculateAdminKPIs
} from "../../utils/admin/kpiCalculations";


function getTodayDate() {
    return new Date()
        .toLocaleDateString(
            "en-CA",
            {
                timeZone: "Asia/Kolkata"
            }
        );
}


export function getAdminKPIs() {

    const today =
        getTodayDate();

    const todayRecords =
        attendanceHistory.filter(
            record =>
                record.date === today
        );

    return calculateAdminKPIs({
        facultyMembers,
        attendanceRecords:
            todayRecords
    });
}


export function getAdminKPIsForDate(
    selectedDate
) {

    const date =
        selectedDate ||
        getTodayDate();

    const records =
        attendanceHistory.filter(
            record =>
                record.date === date
        );

    return calculateAdminKPIs({
        facultyMembers,
        attendanceRecords:
            records
    });
}


export {
    getTodayDate
};