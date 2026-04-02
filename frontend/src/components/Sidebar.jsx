import { Link, useNavigate } from "react-router-dom";
import { getAccessibleNavigationItems } from "../config/navigationConfig";
import { getAuthState, getUserRoles, logout } from "../services/authService";

function formatRole(role) {
    return role
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function Sidebar({ pathname }) {
    const navigate = useNavigate();
    const authState = getAuthState();
    const userRoles = getUserRoles();
    const visibleNavigationItems = getAccessibleNavigationItems(userRoles);
    const displayName = authState?.email ?? "User";
    const initialsSource = displayName.split("@")[0] || displayName;
    const initials = initialsSource.slice(0, 2).toUpperCase();
    const roleLabel = userRoles.length > 0
        ? userRoles.map(formatRole).join(", ")
        : "Authenticated User";

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <aside className="app-sidebar">
            <div className="app-profile">
                <div className="app-profile__avatar">{initials}</div>
                <div className="app-profile__name">{displayName}</div>
                <div className="app-profile__role">{roleLabel}</div>
            </div>

            <div className="app-sidebar__section">My Account</div>

            <nav className="app-nav" aria-label="Main navigation">
                {visibleNavigationItems.map((item) => {
                    const isActive = pathname === item.to;

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`app-nav__link${isActive ? " app-nav__link--active" : ""}`}
                        >
                            <span>{item.label}</span>
                            <span className="app-nav__chevron">&gt;</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="app-sidebar__footer">
                <button
                    type="button"
                    className="app-sidebar__logout"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
