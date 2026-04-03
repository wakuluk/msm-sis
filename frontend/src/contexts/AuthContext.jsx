import { useEffect, useRef, useState } from "react";
import { AuthContext } from "./authContextValue";
import {
  fetchCurrentUser,
  getAuthState,
  login as loginRequest,
  logout as clearStoredAuthState,
  subscribeToAuthStateChanges,
} from "../services/authService";

function buildCurrentUser(authState) {
  if (!authState) {
    return null;
  }

  const roles = Array.isArray(authState.roles)
    ? authState.roles.filter((role) => typeof role === "string" && role.trim() !== "")
    : [];

  return {
    username: authState.email ?? "User",
    roles,
  };
}

export function AuthProvider({ children }) {
  const initialAuthStateRef = useRef(getAuthState());
  const [authState, setAuthState] = useState(initialAuthStateRef.current);
  const [currentUser, setCurrentUser] = useState(() => buildCurrentUser(initialAuthStateRef.current));
  const [isLoadingAuth, setIsLoadingAuth] = useState(Boolean(initialAuthStateRef.current?.token));
  const [authError, setAuthError] = useState("");

  useEffect(() => (
    subscribeToAuthStateChanges((nextAuthState) => {
      setAuthState(nextAuthState);
      setCurrentUser(buildCurrentUser(nextAuthState));
      setAuthError("");
      setIsLoadingAuth(Boolean(nextAuthState?.token));
    })
  ), []);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      if (!authState?.token) {
        if (isMounted) {
          setCurrentUser(null);
          setAuthError("");
          setIsLoadingAuth(false);
        }
        return;
      }

      setIsLoadingAuth(true);

      try {
        const user = await fetchCurrentUser();

        if (!isMounted) {
          return;
        }

        if (!user) {
          setAuthState(null);
          setCurrentUser(null);
          setAuthError("");
          return;
        }

        setCurrentUser(user);
        setAuthError("");
      } catch (error) {
        console.error("Current user lookup error:", error);

        if (isMounted) {
          setAuthError("Could not load account details.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingAuth(false);
        }
      }
    };

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [authState?.token]);

  const login = async (email, password) => {
    const nextAuthState = await loginRequest(email, password);
    setAuthState(nextAuthState);
    setCurrentUser(buildCurrentUser(nextAuthState));
    setAuthError("");
    setIsLoadingAuth(true);
    return nextAuthState;
  };

  const logout = () => {
    clearStoredAuthState();
    setAuthState(null);
    setCurrentUser(null);
    setAuthError("");
    setIsLoadingAuth(false);
  };

  const userRoles = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
  const isAuthenticated = Boolean(authState?.token);

  return (
    <AuthContext.Provider
      value={{
        authState,
        currentUser,
        userRoles,
        isAuthenticated,
        isLoadingAuth,
        authError,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
