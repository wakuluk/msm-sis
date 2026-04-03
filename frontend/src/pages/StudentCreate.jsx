import { useState } from "react";
import { authFetch } from "../services/authService";

const initialFormState = {
    firstName: "",
    lastName: "",
    email: "",
};

function StudentCreate() {
    const [formData, setFormData] = useState(initialFormState);
    const [createdStudent, setCreatedStudent] = useState(null);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreatedStudent(null);
        setError("");

        const payload = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
        };

        if (!payload.firstName || !payload.lastName) {
            setError("First name and last name are required.");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await authFetch("/api/students", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                setError(`Request failed with status ${res.status}`);
                return;
            }

            const data = await res.json();
            setCreatedStudent(data);
            setFormData(initialFormState);
        } catch (err) {
            console.error("Create student error:", err);
            setError("Something went wrong while creating the student.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h2>Create Student</h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "10px" }}>
                    <input
                        type="text"
                        name="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleChange}
                        style={{ padding: "8px", width: "280px" }}
                    />
                </div>

                <div style={{ marginBottom: "10px" }}>
                    <input
                        type="text"
                        name="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        style={{ padding: "8px", width: "280px" }}
                    />
                </div>

                <div style={{ marginBottom: "10px" }}>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        style={{ padding: "8px", width: "280px" }}
                    />
                </div>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Student"}
                </button>
            </form>

            {error && <p>{error}</p>}

            {createdStudent && (
                <div style={{ marginTop: "20px" }}>
                    <p><strong>Student created.</strong></p>
                    <p><strong>ID:</strong> {createdStudent.id}</p>
                    <p><strong>Name:</strong> {createdStudent.firstName} {createdStudent.lastName}</p>
                    <p><strong>Email:</strong> {createdStudent.email || "N/A"}</p>
                </div>
            )}
        </div>
    );
}

export default StudentCreate;
