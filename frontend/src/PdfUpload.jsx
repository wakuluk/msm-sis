import { useState } from "react";

function PdfUpload() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadedDocument, setUploadedDocument] = useState(null);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
        setUploadedDocument(null);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploadedDocument(null);
        setError("");

        if (!selectedFile) {
            setError("Please choose a PDF file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/pdfs", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                setError(`Request failed with status ${res.status}`);
                return;
            }

            const data = await res.json();
            setUploadedDocument(data);
            setSelectedFile(null);
            e.target.reset();
        } catch (err) {
            console.error("PDF upload error:", err);
            setError("Something went wrong while uploading the PDF.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h2>Upload PDF</h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "10px" }}>
                    <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handleFileChange}
                    />
                </div>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Uploading..." : "Upload PDF"}
                </button>
            </form>

            {error && <p style={{ marginTop: "12px" }}>{error}</p>}

            {uploadedDocument && (
                <div style={{ marginTop: "20px" }}>
                    <p><strong>PDF uploaded.</strong></p>
                    <p><strong>ID:</strong> {uploadedDocument.id}</p>
                    <p><strong>Original File Name:</strong> {uploadedDocument.originalFileName}</p>
                    <p><strong>Stored Path:</strong> {uploadedDocument.filePath}</p>
                </div>
            )}
        </div>
    );
}

export default PdfUpload;
