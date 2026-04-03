import { Link, useLocation } from "react-router-dom";

function Forbidden() {
    const location = useLocation();
    const requestedPath = location.state?.from?.pathname ?? "";

    return (
        <div className="app-state-page">
            <section className="app-state-card">
                <p className="app-state-eyebrow app-state-eyebrow--danger">403 Forbidden</p>
                <h1>Access not allowed</h1>
                <p className="app-state-copy">
                    Your account is signed in, but it does not have permission to open this page.
                </p>

                {requestedPath ? (
                    <p className="app-state-detail">
                        Requested path: <strong>{requestedPath}</strong>
                    </p>
                ) : null}

                <div className="app-state-actions">
                    <Link className="app-link-button" to="/">
                        Return home
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default Forbidden;
