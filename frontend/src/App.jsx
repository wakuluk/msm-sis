import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import { APP_PAGES } from "./config/appPages";
import NavigationMenu from "./components/NavigationMenu";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/useAuth";
import Home from "./pages/Home";
import Forbidden from "./pages/Forbidden";
import Login from "./pages/Login";
import PdfList from "./pages/PdfList";
import PdfUpload from "./pages/PdfUpload";
import StudentCreate from "./pages/StudentCreate";
import StudentSearch from "./pages/StudentSearch";
import StudentSearchById from "./pages/StudentSearchById";
import "./App.css";

function AuthenticatedLayout({ children }) {
    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="app-header__title">Mount St. Mary's Univeristy</div>
            </header>

            <div className="app-main">
                <NavigationMenu />

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
                element={isAuthenticated ? <Navigate to={APP_PAGES.HOME.path} replace /> : <Login />}
            />

            <Route element={<ProtectedRoute />}>
                <Route element={<AuthenticatedLayout />}>
                    <Route path={APP_PAGES.HOME.path} element={<Home />} />
                    <Route path={APP_PAGES.FORBIDDEN.path} element={<Forbidden />} />

                    <Route element={<RoleRoute allowedRoles={APP_PAGES.STUDENTS.roles} />}>
                        <Route path={APP_PAGES.STUDENTS.path} element={<StudentSearch />} />
                    </Route>

                    <Route element={<RoleRoute allowedRoles={APP_PAGES.STUDENT_ID_SEARCH.roles} />}>
                        <Route path={APP_PAGES.STUDENT_ID_SEARCH.path} element={<StudentSearchById />} />
                    </Route>

                    <Route element={<RoleRoute allowedRoles={APP_PAGES.STUDENT_CREATE.roles} />}>
                        <Route path={APP_PAGES.STUDENT_CREATE.path} element={<StudentCreate />} />
                    </Route>

                    <Route element={<RoleRoute allowedRoles={APP_PAGES.PDFS.roles} />}>
                        <Route path={APP_PAGES.PDFS.path} element={<PdfList />} />
                    </Route>

                    <Route element={<RoleRoute allowedRoles={APP_PAGES.PDF_UPLOAD.roles} />}>
                        <Route path={APP_PAGES.PDF_UPLOAD.path} element={<PdfUpload />} />
                    </Route>
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
