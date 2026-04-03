const AUTH_STORAGE_KEY = "msm-sis-auth";
const LOGIN_EMAIL_STORAGE_KEY = "msm-sis-login-email";
const LEGACY_LAST_EMAIL_STORAGE_KEY = "msm-sis-last-email";
const AUTH_STATE_CHANGED_EVENT = "msm-sis-auth-state-changed";

function getStoredItem(key) {
  return localStorage.getItem(key);
}

function setStoredItem(key, value) {
  localStorage.setItem(key, value);
}

function notifyAuthStateChanged(authState) {
  window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGED_EVENT, {
    detail: {
      authState,
    },
  }));
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
  setStoredItem(LOGIN_EMAIL_STORAGE_KEY, payload.email.trim());
  localStorage.removeItem(LEGACY_LAST_EMAIL_STORAGE_KEY);
  notifyAuthStateChanged(authState);

  return authState;
}

export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  notifyAuthStateChanged(null);
}

export function subscribeToAuthStateChanges(listener) {
  const handleAuthStateChanged = (event) => {
    listener(event.detail?.authState ?? getAuthState());
  };

  const handleStorageChanged = (event) => {
    if (event.key && event.key !== AUTH_STORAGE_KEY) {
      return;
    }

    listener(getAuthState());
  };

  window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged);
  window.addEventListener("storage", handleStorageChanged);

  return () => {
    window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged);
    window.removeEventListener("storage", handleStorageChanged);
  };
}

export function getSavedLoginEmail() {
  return getStoredItem(LOGIN_EMAIL_STORAGE_KEY)
    ?? getStoredItem(LEGACY_LAST_EMAIL_STORAGE_KEY)
    ?? "";
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

export async function authFetch(input, init) {
  const authState = getAuthState();

  if (!authState?.token) {
    throw new Error("Authentication required.");
  }

  const request = new Request(input, init);
  const headers = new Headers(request.headers);
  headers.set("Authorization", `Bearer ${authState.token}`);

  const response = await fetch(new Request(request, { headers }));

  if (response.status === 401) {
    logout();
  }

  return response;
}

export async function fetchCurrentUser() {
  try {
    const response = await authFetch("/api/auth/me");

    if (response.status === 401 || response.status === 403) {
      return null;
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.message ?? "Failed to load current user.");
    }

    return payload;
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required.") {
      return null;
    }

    throw error;
  }
}
