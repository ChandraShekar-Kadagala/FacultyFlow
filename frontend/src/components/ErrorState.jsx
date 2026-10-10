function ErrorState({
    message = "Something went wrong."
}) {
    return (
        <div className="state-card error-state">
            <h3>Unable to load data</h3>
            <p>{message}</p>
        </div>
    );
}

export default ErrorState;