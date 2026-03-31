import { useEffect, useState } from "react";

function App() {
    const [health, setHealth] = useState(null);
    const [student, setStudent] = useState(null);
    const [studentId, setStudentId] = useState("");

    useEffect(() => {
        fetch('/api/health')
            .then(res => res.json())
            .then(data => setHealth(data))
            .catch(err => console.error("Health error:", err));
    }, []);

    return (
        <div>
            <h1>React → Spring Test</h1>

            <h2>Health</h2>
            <pre>{JSON.stringify(health, null, 2)}</pre>

            <h2>Lookup Student</h2>

            <input
                type="text"
                placeholder="Enter student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                style={{ padding: "8px", marginRight: "10px" }}
            />

            <button
                onClick={() => {
                    fetch(`/api/students/${studentId}`)
                        .then(res => res.json())
                        .then(data => setStudent(data))
                        .catch(err => console.error("Student error:", err));
                }}
            >
                Fetch Student
            </button>

            <h2>Student</h2>
            <pre>{JSON.stringify(student, null, 2)}</pre>

            <button
                style={{
                    padding: "10px 16px",
                    fontSize: "16px",
                    cursor: "pointer"
                }}
                onClick={() => {
                    window.location.href = "/opensis/bridge_to_add_student.php";
                }}
            >
                ← Back to OpenSIS (Add Student)
            </button>
        </div>
    );
}

export default App;