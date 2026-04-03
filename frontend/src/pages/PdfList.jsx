import { useEffect, useState } from "react";
import { authFetch } from "../services/authService";

function PdfList() {
    const [documents, setDocuments] = useState([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadDocuments = async () => {
            setError("");
            setIsLoading(true);

            try {
                const res = await authFetch("/api/pdfs");

                if (!res.ok) {
                    if (isMounted) {
                        setError(`Request failed with status ${res.status}`);
                    }
                    return;
                }

                const data = await res.json();

                if (isMounted) {
                    setDocuments(data);
                }
            } catch (err) {
                console.error("PDF list error:", err);

                if (isMounted) {
                    setError("Something went wrong while loading PDFs.");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadDocuments();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div>
            <h2>PDF Documents</h2>

            {isLoading && <p>Loading PDFs...</p>}
            {error && <p>{error}</p>}

            {!isLoading && !error && documents.length === 0 && (
                <p>No PDF documents found.</p>
            )}

            {!isLoading && !error && documents.length > 0 && (
                <ul style={{ textAlign: "left" }}>
                    {documents.map((document) => (
                        <li key={document.id} style={{ marginBottom: "12px" }}>
                            <a
                                href={`/api/pdfs/${document.id}/download`}
                                style={{ fontWeight: "bold" }}
                            >
                                {document.originalFileName}
                            </a>
                            <div>ID: {document.id}</div>
                            <div>Path: {document.filePath}</div>
                            <div>Created At: {document.createdAt || "N/A"}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default PdfList;
