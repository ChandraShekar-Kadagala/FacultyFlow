import KPICard
    from "./KPICard";


function KPIGrid({
    kpiData
}) {

    if (!kpiData) {
        return null;
    }


    const cards = [
        {
            title: "Total Faculty",
            value:
                kpiData.totalFaculty,
            subtitle:
                "Registered faculty",
            icon: "👥",
            variant: "blue"
        },

        {
            title: "Present Today",
            value:
                kpiData.presentToday,
            subtitle:
                "Faculty present",
            icon: "✓",
            variant: "green"
        },

        {
            title: "Late Today",
            value:
                kpiData.lateToday,
            subtitle:
                "Late attendance",
            icon: "◷",
            variant: "orange"
        },

        {
            title: "Absent Today",
            value:
                kpiData.absentToday,
            subtitle:
                "No attendance record",
            icon: "−",
            variant: "red"
        },

        {
            title: "Verified Today",
            value:
                kpiData.verifiedToday,
            subtitle:
                "Verified records",
            icon: "✓",
            variant: "purple"
        },

        {
            title: "Pending Verification",
            value:
                kpiData.pendingVerification,
            subtitle:
                "Awaiting verification",
            icon: "!",
            variant: "yellow"
        },

        {
            title: "Attendance Rate",
            value:
                `${kpiData.attendanceRate}%`,
            subtitle:
                "Today's attendance",
            icon: "%",
            variant: "cyan"
        },

        {
            title: "Verification Rate",
            value:
                `${kpiData.verificationRate}%`,
            subtitle:
                "Today's verification",
            icon: "✓",
            variant: "indigo"
        }
    ];


    return (
        <div className="admin-kpi-grid">

            {cards.map(card => (

                <KPICard
                    key={card.title}
                    icon={card.icon}
                    title={card.title}
                    value={card.value}
                    subtitle={card.subtitle}
                    variant={card.variant}
                />

            ))}

        </div>
    );
}


export default KPIGrid;