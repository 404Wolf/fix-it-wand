/** @jsxImportSource https://esm.sh/react@19.0.0 */
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "https://esm.sh/react-router-dom@7.4.1?deps=react@19.0.0,react-dom@19.0.0";
import { useEffect } from "https://esm.sh/react@19.0.0";

import { SignIn } from "../pages/SignIn.tsx";
import { Profile } from "../pages/Profile.tsx";
import { Home } from "../pages/Home.tsx";
import { useAuth } from "../hooks/useAuth.ts";
import { LoadingSpinner } from "./Loading.tsx";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const location = useLocation();

  // Check auth status on route changes and when component mounts
  useEffect(() => {
    checkAuth();
  }, [location.pathname, checkAuth]);

  // Don't redirect immediately while still loading to prevent flashing
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Keep the original URL in state so we can redirect back after login
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function App() {
  const { isAuthenticated, isLoading, logout, checkAuth } = useAuth();
  const location = useLocation();

  // Check auth state when location changes or component mounts
  useEffect(() => {
    checkAuth();
  }, [location.pathname, checkAuth]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 font-sans">
      <header className="flex justify-between items-center mb-8">
        <Link to="/" className="no-underline">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-800">
            Fix It Wand
          </h1>
        </Link>
        {isAuthenticated && (
          <div className="flex space-x-4 items-center">
            <nav className="flex space-x-2">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md ${
                  location.pathname === "/"
                    ? "bg-stone-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Home
              </Link>

              <Link
                to="/profile"
                className={`px-3 py-2 rounded-md ${
                  location.pathname === "/profile"
                    ? "bg-stone-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Profile
              </Link>
            </nav>
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors font-medium"
            >
              Log out
            </button>
          </div>
        )}
      </header>

      <main className="mt-6">
        <Routes>
          <Route
            path="/signin"
            element={isAuthenticated ? <Navigate to="/" replace /> : <SignIn />}
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          {/* Use replace to prevent history build-up */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
