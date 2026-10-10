// ============================================================
// SCHEDULE MATCHER
// ============================================================


// ============================================================
// CONVERT HH:MM TO MINUTES
// ============================================================

export function timeToMinutes(
    time
) {

    if (
        typeof time !==
        "string"
    ) {

        return null;

    }


    const match =
        time.match(
            /^([01]\d|2[0-3]):([0-5]\d)$/
        );


    if (!match) {

        return null;

    }


    const hours =
        Number(
            match[1]
        );


    const minutes =
        Number(
            match[2]
        );


    return (
        hours * 60
    ) + minutes;

}


// ============================================================
// CONVERT DATE TO MINUTES
// ============================================================
//
// IMPORTANT:
// This uses the SERVER Date object passed into the function.
// The client clock is never used here.
// ============================================================

export function dateToMinutes(
    date
) {

    if (
        !(date instanceof Date) ||
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return (
        date.getHours() * 60
    ) +
    date.getMinutes();

}


// ============================================================
// CALCULATE DIFFERENCE
// ============================================================

export function differenceInMinutes(
    first,
    second
) {

    return (
        first - second
    );

}


// ============================================================
// CHECK START WINDOW
// ============================================================

export function isWithinStartWindow({

    currentMinutes,

    startMinutes,

    gracePeriod

}) {

    return (

        currentMinutes >=
        startMinutes

        &&

        currentMinutes <=
        (
            startMinutes +
            gracePeriod
        )

    );

}


// ============================================================
// CHECK ATTENDANCE WINDOW
// ============================================================

export function isWithinAttendanceWindow({

    currentMinutes,

    startMinutes,

    endMinutes

}) {

    return (

        currentMinutes >=
        startMinutes

        &&

        currentMinutes <=
        endMinutes

    );

}


// ============================================================
// CHECK AFTER END
// ============================================================

export function isAfterEndTime({

    currentMinutes,

    endMinutes

}) {

    return (
        currentMinutes >
        endMinutes
    );

}