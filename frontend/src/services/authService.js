const AUTH_STORAGE_KEY = "msm-sis-auth";
const LAST_EMAIL_STORAGE_KEY = "msm-sis-last-email";

function getStoredItem(key) {
  return localStorage.getItem(key);
}

function setStoredItem(key, value) {
  localStorage.setItem(key, value);
}

export async function login(email, password) {
  const trimmedEmail = email.trim();

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: trimmedEmail,
      password,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message ?? "Login failed.");
  }

  const authState = {
    ...payload,
    expiresAt: Date.now() + (Number(payload.expiresIn) * 1000),
  };

  setStoredItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  setStoredItem(LAST_EMAIL_STORAGE_KEY, trimmedEmail);

  return authState;
}

export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getLastEmail() {
  return getStoredItem(LAST_EMAIL_STORAGE_KEY) ?? "";
}

export function getAuthState() {
  const serializedAuthState = getStoredItem(AUTH_STORAGE_KEY);

  if (!serializedAuthState) {
    return null;
  }

  try {
    const authState = JSON.parse(serializedAuthState);

    if (!authState?.token) {
      logout();
      return null;
    }

    if (authState.expiresAt && Date.now() >= authState.expiresAt) {
      logout();
      return null;
    }

    return authState;
  } catch (error) {
    console.error("Failed to parse auth state:", error);
    logout();
    return null;
  }
}

export function isAuthenticated() {
  return getAuthState() !== null;
}

export function getAccessToken() {
  return getAuthState()?.token ?? null;
}

export function getUserRoles() {
  const roles = getAuthState()?.roles;

  if (!Array.isArray(roles)) {
    return [];
  }

  return roles.filter((role) => typeof role === "string" && role.trim() !== "");
}

export async function fetchCurrentUser() {
  const token = getAccessToken();

  if (!token) {
    return null;
  }

  const response = await fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    logout();
    return null;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message ?? "Failed to load current user.");
  }

  return payload;
}
