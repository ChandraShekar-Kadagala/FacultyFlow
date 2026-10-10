function PolicySection({
    title,
    description,
    children
}) {
    return (
        <section className="dashboard-card policy-config-section">

            <div className="card-header">

                <div>
                    <span className="card-label">
                        POLICY
                    </span>

                    <h2>
                        {title}
                    </h2>

                    <p>
                        {description}
                    </p>
                </div>

            </div>

            <div className="policy-config-content">
                {children}
            </div>

        </section>
    );
}

export default PolicySection;