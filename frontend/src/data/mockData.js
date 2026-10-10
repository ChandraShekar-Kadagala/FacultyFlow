export const demoCredentials = {
    faculty: {
        id: "F101",
        name: "Faculty User",
        email: "faculty@facultyflow.com",
        password: "Faculty@123",
        role: "faculty",
        department: "CSE",
        designation: "Assistant Professor"
    },

    admin: {
        id: "A001",
        name: "Admin User",
        email: "admin@facultyflow.com",
        password: "Admin@123",
        role: "admin",
        department: "Administration",
        designation: "System Administrator"
    }
};

export const faculty = {
    facultyId: "F101",
    name: "Faculty User",
    department: "CSE",
    designation: "Assistant Professor",
    email: "faculty@facultyflow.com",
    status: "Active"
};

export const facultyMembers = [
    {
        id: "F101",
        name: "Faculty User",
        department: "CSE",
        designation: "Assistant Professor",
        email: "faculty@facultyflow.com",
        status: "Active"
    },
    {
        id: "F102",
        name: "Faculty Two",
        department: "ECE",
        designation: "Associate Professor",
        email: "faculty2@facultyflow.com",
        status: "Active"
    },
    {
        id: "F103",
        name: "Faculty Three",
        department: "AIML",
        designation: "Assistant Professor",
        email: "faculty3@facultyflow.com",
        status: "Active"
    }
];

export const attendanceHistory = [
    {
        id: "A001",
        facultyId: "F101",
        date: "2026-09-04",
        status: "Present",
        checkInTime: "09:15 AM",
        checkOutTime: null,
        verificationStatus: "Verified"
    },
    {
        id: "A002",
        facultyId: "F101",
        date: "2026-09-03",
        status: "Present",
        checkInTime: "09:20 AM",
        checkOutTime: "05:05 PM",
        verificationStatus: "Verified"
    },
    {
        id: "A003",
        facultyId: "F101",
        date: "2026-09-02",
        status: "Late",
        checkInTime: "09:48 AM",
        checkOutTime: "05:00 PM",
        verificationStatus: "Verified"
    },
    {
        id: "A004",
        facultyId: "F101",
        date: "2026-09-01",
        status: "Present",
        checkInTime: "09:10 AM",
        checkOutTime: "05:00 PM",
        verificationStatus: "Verified"
    }
];

export const attendancePolicies = {
    checkInStartTime: "09:00 AM",
    checkInEndTime: "10:00 AM",
    gracePeriodMinutes: 15,
    requiredVerification: true,
    requireIdentityVerification: true,
    requireBiometricVerification: true,
    requireNetworkVerification: true,
    requireLocationVerification: true,
    preventDuplicateCheckIn: true,
    requireCheckInBeforeCheckOut: true
};