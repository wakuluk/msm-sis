import { authFetch } from "./authService";

export async function fetchStudentProfile() {
  const response = await authFetch("/api/students/profile");

  if (response.status === 404) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message ?? "Failed to load student profile.");
  }

  return payload;
}
