import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    async function handleSubmit(event) {
        event.preventDefault();
        if (isSubmitting) return;

        setError("");
        setIsSubmitting(true);

        try {
            const result = await login(
                email.trim(),
                password
            );

            if (!result.success) {
                setError(
                    result.message || "Invalid email or password."
                );
                return;
            }

            navigate(
                result.user.role === "admin"
                    ? "/admin"
                    : "/faculty",
                {
                    replace: true
                }
            );
        } catch (err) {
            setError(
                err.message || "Unable to sign in. Please verify your connection."
            );
        } finally {
            setIsSubmitting(false);
        }
    }
    function fillDemoAccount(type) {
        if (type === "faculty") {
            setEmail("faculty@facultyflow.com");
            setPassword("Faculty@123");
        } else {
            setEmail("admin@facultyflow.com");
            setPassword("Admin@123");
        }

        setError("");
    }

    return (
        <main className="login-page">
            <section className="login-card">

                <div className="login-brand">
                    <div className="login-logo">
                        F
                    </div>

                    <div>
                        <h1>FacultyFlow</h1>
                        <p>Attendance Management System</p>
                    </div>
                </div>

                <div className="login-heading">
                    <h2>Welcome back</h2>
                    <p>
                        Sign in to access your FacultyFlow workspace.
                    </p>
                </div>

                {error && (
                    <div className="login-error">
                        <strong>Sign-in failed</strong>
                        <span>{error}</span>
                    </div>
                )}

                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                >
                    <div className="form-group">
                        <label htmlFor="email">
                            Email address
                        </label>

                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={event =>
                                setEmail(event.target.value)
                            }
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <div className="form-label-row">
                            <label htmlFor="password">
                                Password
                            </label>
                        </div>

                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={event =>
                                setPassword(event.target.value)
                            }
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    <button
                        className="login-submit"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? "Signing in..."
                            : "Sign In"}
                    </button>
                </form>

                <div className="demo-credentials">

                    <div className="demo-header">
                        <div>
                            <span className="eyebrow">
                                DEVELOPMENT
                            </span>

                            <h3>Demo Accounts</h3>
                        </div>

                        <span className="demo-badge">
                            DEMO
                        </span>
                    </div>

                    <div className="demo-account">
                        <div>
                            <strong>Faculty</strong>

                            <span>
                                faculty@facultyflow.com
                            </span>

                            <span>
                                Faculty@123
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                fillDemoAccount("faculty")
                            }
                        >
                            Use
                        </button>
                    </div>

                    <div className="demo-account">
                        <div>
                            <strong>Administrator</strong>

                            <span>
                                admin@facultyflow.com
                            </span>

                            <span>
                                Admin@123
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                fillDemoAccount("admin")
                            }
                        >
                            Use
                        </button>
                    </div>

                </div>

                <p className="login-footer">
                    FacultyFlow • Development Environment
                </p>

            </section>
        </main>
    );
}

export default Login;