function LoadingState({
    message = "Loading..."
}) {
    return (
        <div className="state-card">
            <p>{message}</p>
        </div>
    );
}

export default LoadingState;