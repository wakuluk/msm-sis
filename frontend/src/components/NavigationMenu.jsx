import { NavLink, useNavigate } from "react-router-dom";
import { getAccessibleNavigationPages } from "../config/appPages";
import { useAuth } from "../contexts/useAuth";

function formatRole(role) {
    return role
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function NavigationMenu() {
    const navigate = useNavigate();
    const { currentUser, userRoles, logout } = useAuth();
    const visibleNavigationItems = getAccessibleNavigationPages(userRoles);
    const displayName = currentUser?.username ?? "User";
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
        <aside className="app-navigation">
            <div className="app-profile">
                <div className="app-profile__avatar">{initials}</div>
                <div className="app-profile__name">{displayName}</div>
                <div className="app-profile__role">{roleLabel}</div>
            </div>

            <div className="app-navigation__section">My Account</div>

            <nav className="app-nav" aria-label="Main navigation">
                {visibleNavigationItems.map((item) => {
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `app-nav__link${isActive ? " app-nav__link--active" : ""}`
                            }
                        >
                            <span>{item.label}</span>
                            <span className="app-nav__chevron">&gt;</span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className="app-navigation__footer">
                <button
                    type="button"
                    className="app-navigation__logout"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default NavigationMenu;
