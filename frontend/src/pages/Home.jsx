import { useAuth } from "../contexts/useAuth";
import "./Home.css";

function Home() {
    const { currentUser, userRoles, isLoadingAuth, authError } = useAuth();
    const welcomeName = currentUser?.username ?? "there";

    return (
        <div className="home-page">
            <section className="home-card home-card--intro">
                <div>
                    <p className="home-eyebrow">Dashboard Overview</p>
                    <h1>Welcome back, {welcomeName}</h1>
                    <p className="home-intro-copy">
                        This home page keeps the same structure as your reference:
                        school context across the top, a strong left navigation rail,
                        and clean dashboard cards for notes, alerts, and status details.
                    </p>

                    <div className="home-user-meta">
                        {isLoadingAuth ? (
                            <span className="home-user-meta__message">Loading account details...</span>
                        ) : null}

                        {!isLoadingAuth && authError ? (
                            <span className="home-user-meta__message home-user-meta__message--error">
                                {authError}
                            </span>
                        ) : null}

                        {!isLoadingAuth && !authError && userRoles.length > 0 ? (
                            userRoles.map((role) => (
                                <span key={role} className="home-role-chip">
                                    {role}
                                </span>
                            ))
                        ) : null}
                    </div>
                </div>

                <div className="home-stat-strip">
                    <div className="home-stat">
                        <span className="home-stat__label">Campus</span>
                        <strong>Greenwood International School</strong>
                    </div>
                    <div className="home-stat">
                        <span className="home-stat__label">Term</span>
                        <strong>2025-2026</strong>
                    </div>
                    <div className="home-stat">
                        <span className="home-stat__label">Quarter</span>
                        <strong>Quarter 4</strong>
                    </div>
                </div>
            </section>

            <section className="home-card">
                <div className="home-section-heading">
                    <h2>Notes</h2>
                    <span>1 active note found</span>
                </div>

                <div className="home-note-table" role="table" aria-label="Home notes">
                    <div className="home-note-table__head" role="row">
                        <span>Date Posted</span>
                        <span>Title</span>
                        <span>Note</span>
                        <span>School</span>
                    </div>

                    <div className="home-note-table__row" role="row">
                        <span>Oct 27, 2025</span>
                        <strong>Welcome</strong>
                        <span>Welcome to the Greenwood International School dashboard.</span>
                        <span>All School</span>
                    </div>
                </div>
            </section>

            <section className="home-card">
                <div className="home-section-heading">
                    <h2>System Status</h2>
                    <span>Today</span>
                </div>

                <ul className="home-status-list">
                    <li><span>Attendance alerts</span><strong>3 open</strong></li>
                    <li><span>New student records</span><strong>12 pending review</strong></li>
                    <li><span>Document uploads</span><strong>4 queued</strong></li>
                </ul>
            </section>
        </div>
    );
}

export default Home;
