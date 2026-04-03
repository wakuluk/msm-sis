import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import { ROLES } from "./config/roles";
import Sidebar from "./components/Sidebar";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/useAuth";
import Home from "./pages/Home";
import Forbidden from "./pages/Forbidden";
import Login from "./pages/Login";
import PdfList from "./pages/PdfList";
import PdfUpload from "./pages/PdfUpload";
import StudentSearch from "./pages/StudentSearch";
import StudentSearchById from "./pages/StudentSearchById";
import StudentCreate from "./pages/StudentCreate";
import "./App.css";

function AuthenticatedLayout({ children }) {
    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="app-header__title">Mount St. Mary's Univeristy</div>
            </header>

            <div className="app-main">
                <Sidebar />

                <main className="app-content">
                    {children ?? <Outlet />}
                </main>
            </div>
        </div>
    );
}

function AppRoutes() {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
            />

            <Route element={<ProtectedRoute />}>
                <Route element={<AuthenticatedLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/forbidden" element={<Forbidden />} />
                    <Route path="/students" element={<StudentSearch />} />
                    <Route path="/students/id" element={<StudentSearchById />} />
                    <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
                        <Route path="/students/new" element={<StudentCreate />} />
                    </Route>

                    <Route path="/pdfs" element={<PdfList />} />
                    <Route path="/pdfs/new" element={<PdfUpload />} />
                </Route>
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}

export default App;
