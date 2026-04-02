import { useState } from "react";

function StudentSearchById() {
    const [studentId, setStudentId] = useState("");
    const [student, setStudent] = useState(null);
    const [error, setError] = useState("");

    const searchStudentById = async () => {
        setStudent(null);
        setError("");

        const trimmedId = studentId.trim();

        if (!trimmedId) {
            setError("Please enter a student ID.");
            return;
        }

        if (!/^\d+$/.test(trimmedId)) {
            setError("Student ID must be a number.");
            return;
        }

        try {
            const res = await fetch(`/api/students/${encodeURIComponent(trimmedId)}`);

            if (res.status === 404) {
                setError("Student not found.");
                return;
            }

            if (!res.ok) {
                setError(`Request failed with status ${res.status}`);
                return;
            }

            const data = await res.json();
            setStudent(data);
        } catch (err) {
            console.error("Student lookup error:", err);
            setError("Something went wrong while loading the student.");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        searchStudentById();
    };

    return (
        <div>
            <h2>Search Student By ID</h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Enter student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    style={{ padding: "8px", marginRight: "10px" }}
                />
                <button type="submit">
                    Search
                </button>
            </form>

            {error && <p>{error}</p>}

            {student && (
                <div style={{ marginTop: "20px" }}>
                    <p><strong>ID:</strong> {student.id}</p>
                    <p><strong>Name:</strong> {student.firstName} {student.lastName}</p>
                    <p><strong>Email:</strong> {student.email || "N/A"}</p>
                    <p><strong>Created At:</strong> {student.createdAt || "N/A"}</p>
                </div>
            )}
        </div>
    );
}

export default StudentSearchById;
