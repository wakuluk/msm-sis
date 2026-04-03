import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

function RoleRoute({ allowedRoles = [], redirectTo = "/forbidden" }) {
    const location = useLocation();
    const { isLoadingAuth, userRoles } = useAuth();

    if (isLoadingAuth) {
        return null;
    }

    const isAuthorized = allowedRoles.length === 0
        || allowedRoles.some((role) => userRoles.includes(role));

    if (!isAuthorized) {
        return <Navigate to={redirectTo} replace state={{ from: location }} />;
    }

    return <Outlet />;
}

export default RoleRoute;
