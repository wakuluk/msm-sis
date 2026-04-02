import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import PdfList from "./pages/PdfList";
import PdfUpload from "./pages/PdfUpload";
import StudentSearch from "./pages/StudentSearch";
import StudentSearchById from "./pages/StudentSearchById";
import StudentCreate from "./pages/StudentCreate";
import { isAuthenticated } from "./services/authService";
import "./App.css";

function AuthenticatedLayout({ children, pathname }) {
    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="app-header__title">Mount St. Mary's Univeristy</div>
            </header>

            <div className="app-main">
                <Sidebar pathname={pathname} />

                <main className="app-content">
                    {children}
                </main>
            </div>
        </div>
    );
}

function AppLayout() {
    const location = useLocation();
    const isLoginPage = location.pathname === "/login";
    const authenticated = isAuthenticated();

    return (
        isLoginPage ? (
            authenticated ? (
                <Navigate to="/" replace />
            ) : (
                <Routes>
                    <Route path="/login" element={<Login />} />
                </Routes>
            )
        ) : (
            authenticated ? (
                <AuthenticatedLayout pathname={location.pathname}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/students" element={<StudentSearch />} />
                        <Route path="/students/id" element={<StudentSearchById />} />
                        <Route path="/students/new" element={<StudentCreate />} />
                        <Route path="/pdfs" element={<PdfList />} />
                        <Route path="/pdfs/new" element={<PdfUpload />} />
                    </Routes>
                </AuthenticatedLayout>
            ) : (
                <Navigate to="/login" replace />
            )
        )
    );
}

function App() {
    return (
        <Router>
            <AppLayout />
        </Router>
    );
}

export default App;
