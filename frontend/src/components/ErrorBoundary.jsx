import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error, errorInfo) {
        console.error(
            "FacultyFlow Error Boundary:",
            error,
            errorInfo
        );
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <main className="error-page">

                    <div className="error-card">

                        <span className="error-icon">
                            !
                        </span>

                        <span className="eyebrow">
                            SYSTEM ERROR
                        </span>

                        <h1>
                            Something went wrong
                        </h1>

                        <p>
                            FacultyFlow encountered an unexpected
                            error while rendering this screen.
                        </p>

                        <button
                            type="button"
                            onClick={this.handleRetry}
                            className="primary-button"
                        >
                            Try Again
                        </button>

                    </div>

                </main>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;