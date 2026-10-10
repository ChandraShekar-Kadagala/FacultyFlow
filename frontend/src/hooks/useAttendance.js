import { useState } from "react";

const initialVerification = {
    identity: true,
    biometric: true,
    network: true,
    location: true,
    schedule: true
};

const initialAttendance = {
    date: new Date().toISOString().split("T")[0],
    checkInTime: null,
    checkOutTime: null,
    status: "Not Checked In",
    syncStatus: "DEMO_LOCAL"
};

function getCurrentTime() {
    return new Date().toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }
    );
}

function useAttendance() {
    const [attendance, setAttendance] = useState(
        initialAttendance
    );

    const [verification] = useState(
        initialVerification
    );

    const [isProcessing, setIsProcessing] =
        useState(false);

    const [message, setMessage] =
        useState(null);

    function clearMessage() {
        setTimeout(() => {
            setMessage(null);
        }, 3000);
    }

    function checkVerification() {
        const failedCheck = Object.entries(
            verification
        ).find(([, value]) => value !== true);

        if (failedCheck) {
            return {
                success: false,
                reason: `${failedCheck[0]} verification failed.`
            };
        }

        return {
            success: true
        };
    }

    async function checkIn() {
        if (attendance.checkInTime) {
            setMessage({
                type: "error",
                text: "Check-in has already been recorded today."
            });

            clearMessage();

            return;
        }

        setIsProcessing(true);
        setMessage(null);

        await new Promise(resolve =>
            setTimeout(resolve, 700)
        );

        const verificationResult =
            checkVerification();

        if (!verificationResult.success) {
            setIsProcessing(false);

            setMessage({
                type: "error",
                text: verificationResult.reason
            });

            clearMessage();

            return;
        }

        const time = getCurrentTime();

        setAttendance(previous => ({
            ...previous,
            checkInTime: time,
            status: "Present",
            syncStatus: "DEMO_LOCAL"
        }));

        setIsProcessing(false);

        setMessage({
            type: "success",
            text: `Check-in recorded at ${time}.`
        });

        clearMessage();
    }

    async function checkOut() {
        if (!attendance.checkInTime) {
            setMessage({
                type: "error",
                text: "You must check in before checking out."
            });

            clearMessage();

            return;
        }

        if (attendance.checkOutTime) {
            setMessage({
                type: "error",
                text: "Check-out has already been recorded today."
            });

            clearMessage();

            return;
        }

        setIsProcessing(true);
        setMessage(null);

        await new Promise(resolve =>
            setTimeout(resolve, 700)
        );

        const verificationResult =
            checkVerification();

        if (!verificationResult.success) {
            setIsProcessing(false);

            setMessage({
                type: "error",
                text: verificationResult.reason
            });

            clearMessage();

            return;
        }

        const time = getCurrentTime();

        setAttendance(previous => ({
            ...previous,
            checkOutTime: time,
            status: "Present",
            syncStatus: "DEMO_LOCAL"
        }));

        setIsProcessing(false);

        setMessage({
            type: "success",
            text: `Check-out recorded at ${time}.`
        });

        clearMessage();
    }

    return {
        attendance,
        verification,
        checkIn,
        checkOut,
        isProcessing,
        message
    };
}

export default useAttendance;