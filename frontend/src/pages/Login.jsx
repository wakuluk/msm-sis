import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { getSavedLoginEmail } from "../services/authService";
import "./Login.css";

function getErrorMessage(error) {
    if (error instanceof Error && error.message.trim() !== "") {
        return error.message;
    }

    return "Something went wrong while signing in.";
}

function Login() {
    const navigate = useNavigate();
    const { login: loginUser } = useAuth();
    const [email, setEmail] = useState(() => getSavedLoginEmail());
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const trimmedEmail = email.trim();

        if (!trimmedEmail || !password) {
            setError("Enter both email and password.");
            return;
        }

        setIsSubmitting(true);

        try {
            await loginUser(trimmedEmail, password);
            setPassword("");
            navigate("/");
        } catch (submissionError) {
            console.error("Login error:", submissionError);
            setError(getErrorMessage(submissionError));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-content">
                <div className="login-card">
                    <h2>Login</h2>
                    <p className="login-subtitle">
                        Sign in with your MSM SIS account.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="login-field">
                            <input
                                className="login-input"
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="login-field login-field-last">
                            <input
                                className="login-input"
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        {error ? (
                            <p className="login-error" role="alert">
                                {error}
                            </p>
                        ) : null}

                        <button className="login-button" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Signing In..." : "Sign In"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
