import { useState } from "react";
import { authFetch } from "../services/authService";

function StudentSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [error, setError] = useState("");

    const searchStudents = async () => {
        setResults([]);
        setError("");

        if (!query.trim()) {
            setError("Please enter a search term.");
            return;
        }

        try {
            const res = await authFetch(`/api/students?lastName=${encodeURIComponent(query)}`);

            if (!res.ok) {
                setError(`Request failed with status ${res.status}`);
                return;
            }

            const data = await res.json();
            setResults(data);
        } catch (err) {
            console.error("Search error:", err);
            setError("Something went wrong while searching.");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        searchStudents();
    };

    return (
        <div>
            <h2>Search Students</h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Search by first or last name"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ padding: "8px", marginRight: "10px" }}
                />
                <button type="submit">
                    Search
                </button>
            </form>

            {error && <p>{error}</p>}

            <ul>
                {results.map((student) => (
                    <li key={student.id}>
                        {student.firstName} {student.lastName}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default StudentSearch;
