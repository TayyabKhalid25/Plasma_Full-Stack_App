"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * ProtectedRoute Component
 * @component
 * @param {object} props
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-plasma-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-plasma-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-plasma-text-secondary text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
