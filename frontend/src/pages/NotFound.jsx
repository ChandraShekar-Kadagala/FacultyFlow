import { Link } from "react-router-dom";

function NotFound() {
    return (
        <main className="center-page">
            <section className="page-card">
                <h1>Page Not Found</h1>

                <p>
                    The page you requested does not exist.
                </p>

                <Link
                    to="/login"
                    className="primary-link"
                >
                    Go to Login
                </Link>
            </section>
        </main>
    );
}

export default NotFound;