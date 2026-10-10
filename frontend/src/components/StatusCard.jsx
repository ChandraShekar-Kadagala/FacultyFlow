function StatusCard({
    title,
    value,
    description,
    status = "default"
}) {
    return (
        <article
            className={`status-card ${status}`}
        >
            <span className="status-card-title">
                {title}
            </span>

            <strong className="status-card-value">
                {value}
            </strong>

            {description && (
                <p>
                    {description}
                </p>
            )}
        </article>
    );
}

export default StatusCard;