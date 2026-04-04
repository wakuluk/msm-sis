import * as Accordion from "@radix-ui/react-accordion";
import { useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getAccessibleNavigationGroups } from "../config/appPages";
import { useAuth } from "../contexts/useAuth";

function NavigationMenu() {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, userRoles, logout } = useAuth();
    const navigationGroups = useMemo(
        () => getAccessibleNavigationGroups(userRoles),
        [userRoles],
    );
    const displayName = currentUser?.username ?? "User";
    const initialsSource = displayName.split("@")[0] || displayName;
    const initials = initialsSource.slice(0, 2).toUpperCase();
    const roleLabel = userRoles.length > 0
        ? userRoles.join(", ")
        : "Authenticated User";
    const defaultOpenGroupHeader = useMemo(() => {
        const activeGroup = navigationGroups.find((group) => (
            group.pages.some((page) => page.path === location.pathname)
        ));

        return activeGroup?.header ?? navigationGroups[0]?.header ?? null;
    }, [location.pathname, navigationGroups]);

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
            <nav className="app-nav" aria-label="Main navigation">
                <Accordion.Root
                    className="app-nav-accordion"
                    type="single"
                    collapsible
                    defaultValue={defaultOpenGroupHeader ?? undefined}
                >
                    {navigationGroups.map((group) => {
                        if (group.pages.length === 1) {
                            const item = group.pages[0];

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end
                                    className={({ isActive }) =>
                                        `app-nav__primary-link${isActive ? " app-nav__primary-link--active" : ""}`
                                    }
                                >
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        }

                        return (
                            <Accordion.Item
                                key={group.header}
                                className="app-nav-group"
                                value={group.header}
                            >
                                <Accordion.Header className="app-nav-group__header">
                                    <Accordion.Trigger className="app-nav-group__toggle">
                                        <span>{group.header}</span>
                                        <span className="app-nav-group__chevron" aria-hidden="true">
                                            ›
                                        </span>
                                    </Accordion.Trigger>
                                </Accordion.Header>

                                <Accordion.Content className="app-nav-group__content">
                                    <div className="app-nav-group__items">
                                        {group.pages.map((item) => (
                                            <NavLink
                                                key={item.path}
                                                to={item.path}
                                                end
                                                className={({ isActive }) =>
                                                    `app-nav__link${isActive ? " app-nav__link--active" : ""}`
                                                }
                                            >
                                                <span>{item.label}</span>
                                            </NavLink>
                                        ))}
                                    </div>
                                </Accordion.Content>
                            </Accordion.Item>
                        );
                    })}
                </Accordion.Root>
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
