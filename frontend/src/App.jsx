import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./Home";
import PdfList from "./PdfList";
import PdfUpload from "./PdfUpload";
import StudentSearch from "./StudentSearch";
import StudentSearchById from "./StudentSearchById";
import StudentCreate from "./StudentCreate";

function App() {
    return (
        <Router>
            <div style={{ padding: "20px" }}>
                <h1>MSM SIS</h1>

                <nav style={{ marginBottom: "20px" }}>
                    <Link to="/" style={{ marginRight: "10px" }}>
                        Home
                    </Link>
                    <Link to="/students" style={{ marginRight: "10px" }}>
                        Search Students
                    </Link>
                    <Link to="/students/id" style={{ marginRight: "10px" }}>
                        Search Student By ID
                    </Link>
                    <Link to="/students/new" style={{ marginRight: "10px" }}>
                        Create Student
                    </Link>
                    <Link to="/pdfs" style={{ marginRight: "10px" }}>
                        List PDFs
                    </Link>
                    <Link to="/pdfs/new">
                        Upload PDF
                    </Link>
                </nav>

                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/students" element={<StudentSearch />} />
                    <Route path="/students/id" element={<StudentSearchById />} />
                    <Route path="/students/new" element={<StudentCreate />} />
                    <Route path="/pdfs" element={<PdfList />} />
                    <Route path="/pdfs/new" element={<PdfUpload />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
