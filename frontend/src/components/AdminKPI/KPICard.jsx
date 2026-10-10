function KPICard({
    icon,
    title,
    value,
    subtitle,
    variant = "blue"
}) {

    return (
        <article
            className={`admin-kpi-card ${variant}`}
        >

            <div className="admin-kpi-icon">
                {icon}
            </div>

            <div className="admin-kpi-content">

                <span className="admin-kpi-title">
                    {title}
                </span>

                <strong className="admin-kpi-value">
                    {value}
                </strong>

                <p className="admin-kpi-subtitle">
                    {subtitle}
                </p>

            </div>

        </article>
    );
}


export default KPICard;