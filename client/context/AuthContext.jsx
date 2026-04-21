"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext(null);

const API_BASE = "http://localhost:5000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't need auth
  const publicRoutes = ["/", "/login", "/sign-up"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Fetch current user profile using stored token
  const fetchUser = useCallback(async (jwt) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error("Invalid token");
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        return true;
      }
      throw new Error("Failed to fetch user");
    } catch {
      // Token is invalid or server is down
      localStorage.removeItem("plasma_token");
      setToken(null);
      setUser(null);
      return false;
    }
  }, []);

  // On mount: check for existing token
  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem("plasma_token");
      if (stored) {
        setToken(stored);
        await fetchUser(stored);
      }
      setLoading(false);
    };
    init();
  }, [fetchUser]);

  // Route protection
  useEffect(() => {
    if (!loading) {
      const isAuthenticated = !!token && !!user;
      if (!isAuthenticated && !isPublicRoute) {
        router.push("/login");
      }
    }
  }, [loading, token, user, isPublicRoute, router]);

  // Login via traditional credentials
  const login = async (identifier, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: identifier, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Login failed");
    }

    // Store token and user
    localStorage.setItem("plasma_token", data.token);
    setToken(data.token);
    setUser(data.user);

    return data;
  };

  // Register new user
  const register = async (username, email, password, dateOfBirth) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, dateOfBirth }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Registration failed");
    }

    // Store token and user
    localStorage.setItem("plasma_token", data.token);
    setToken(data.token);
    setUser(data.user);

    return data;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("plasma_token");
    setToken(null);
    setUser(null);
    router.push("/");
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { API_BASE };
