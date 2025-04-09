import { useCallback, useEffect, useState } from "https://esm.sh/react@19.0.0";
import { User } from "../../backend/db/schemas_http.ts";

const authCache = {
  user: null as User | null,
  isAuthenticated: false,
  lastChecked: 0,
  expiryTime: 30 * 1000, // 30 seconds
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(authCache.user);
  const [isAuthenticated, setIsAuthenticated] = useState(
    authCache.isAuthenticated,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    console.log("Checking auth status");
    // Use cached data if available and not expired
    const now = Date.now();
    if (now - authCache.lastChecked < authCache.expiryTime) {
      setUser(authCache.user);
      setIsAuthenticated(authCache.isAuthenticated);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/auth/me", {
        credentials: "include",
        headers: {
          "Pragma": "no-cache",
          "Cache-Control": "no-cache",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
        authCache.user = data.user;
        authCache.isAuthenticated = true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        authCache.user = null;
        authCache.isAuthenticated = false;
      }
      authCache.lastChecked = now;
    } catch (_err) {
      setError("Failed to verify authentication");
      setIsAuthenticated(false);
      setUser(null);
      authCache.user = null;
      authCache.isAuthenticated = false;
      authCache.lastChecked = now;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Request magic link
  const requestMagicLink = async (email: string, redirectUrl: string = "/") => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/auth/request-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirectUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send magic link");
      }

      return { success: true, message: data.message };
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : "Failed to send magic link";
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        // Fallback client-side logout
        document.cookie =
          "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }

      // In both cases, clear the auth state
      setIsAuthenticated(false);
      setUser(null);
      authCache.user = null;
      authCache.isAuthenticated = false;
      authCache.lastChecked = Date.now();

      // Refresh the page to ensure all states are reset
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
      // Fallback client-side logout
      document.cookie =
        "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      setIsAuthenticated(false);
      setUser(null);
      authCache.user = null;
      authCache.isAuthenticated = false;
      authCache.lastChecked = Date.now();

      // Refresh the page even on error
      window.location.href = "/";
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (
    updates: { firstName?: string; lastName?: string },
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/auth/me", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      setUser(data.user);
      authCache.user = data.user;
      authCache.lastChecked = Date.now();

      return { success: true, user: data.user };
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : "Failed to update profile";
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    // Safety timeout in case auth check gets stuck
    const timeoutId = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 5000);

    // Initial auth check
    checkAuth();

    // Periodic auth check (every 5 minutes)
    const intervalId = setInterval(checkAuth, 5 * 60 * 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    checkAuth,
    requestMagicLink,
    logout,
    updateProfile,
  };
}
