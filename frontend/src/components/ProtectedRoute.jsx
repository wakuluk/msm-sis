import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

function ProtectedRoute() {
    const location = useLocation();
    const { isAuthenticated, isLoadingAuth } = useAuth();

    if (isLoadingAuth) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
