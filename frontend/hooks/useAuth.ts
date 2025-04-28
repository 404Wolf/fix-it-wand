import { useCallback, useEffect, useState } from "https://esm.sh/react@19.0.0";
import { User } from "../../backend/db/schemas_http.ts";
import { client } from "../hono.ts";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await client.auth.me.$get({ credentials: "include" });

      if (resp.ok) {
        const data = await resp.json().then((resp) => ({
          ...resp.user,
          createdAt: new Date(resp.user.createdAt!),
        }));
        setUser(data);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestMagicLink = async (email: string, redirectUrl: string = "/") => {
    setIsLoading(true);

    try {
      const resp = await client.auth.magicSignIn.$post({
        json: { email, redirectUrl },
      });
      const data = await resp.json();
      setIsAuthenticated(true);
      setUser({
        ...data.user,
        createdAt: new Date(data.user.createdAt!),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      const response = await client.auth.logout.$post({});

      if (!response.ok) {
        document.cookie =
          "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }

      setIsAuthenticated(false);
      setUser(null);
      window.location.href = "/";
    } catch (_err) {
      document.cookie =
        "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      setIsAuthenticated(false);
      setUser(null);
      window.location.href = "/";
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (
    updates: { firstName?: string; lastName?: string },
  ) => {
    setIsLoading(true);

    try {
      const response = await client.auth.me.$put({
        json: {
          email: user?.email!,
          firstName: updates.firstName,
          lastName: updates.lastName,
        },
      });
      const data = await response.json();

      setUser({
        ...data.user,
        createdAt: new Date(data.user.createdAt!),
      });
      return { success: true, user: data.user };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 5000);

    checkAuth();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [checkAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    checkAuth,
    requestMagicLink,
    logout,
    updateProfile,
  };
}
