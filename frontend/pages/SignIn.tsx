/** @jsxImportSource https://esm.sh/react@19.0.0 */
import { useState } from "https://esm.sh/react@19.0.0";
import { useLocation } from "https://esm.sh/react-router-dom@7.4.1?deps=react@19.0.0,react-dom@19.0.0";
import { useAuth } from "../hooks/useAuth.ts";

type SignInState = "idle" | "loading" | "sent";

export function SignIn() {
  const [email, setEmail] = useState<string>("");
  const [state, setState] = useState<SignInState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { requestMagicLink } = useAuth();
  const location = useLocation();
  // Get the redirectUrl from location state
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email) {
      setErrorMessage("Email is required");
      return;
    }

    setState("loading");

    try {
      // Add the redirect URL as a query parameter
      const result = await requestMagicLink(email, from);

      if (result.success) {
        setState("sent");
      } else {
        setErrorMessage(result.message);
        setState("idle");
      }
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(
          "Something went wrong. Please try again. Error: " + err.message,
        );
        setState("idle");
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 rounded-lg shadow-sm border border-gray-200 bg-white">
      <h2 className="mt-0 mb-6 text-center text-xl font-medium tracking-tight">
        Sign in to Fix It Wand
      </h2>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      {state === "sent"
        ? (
          <div className="text-center p-4">
            <p className="mb-4">
              Magic link sent! Check your email to continue signing in
            </p>
            <button
              type="submit"
              onClick={() => setState("idle")}
              className="w-full py-3 bg-amber-700 text-white rounded hover:bg-amber-800 transition-colors"
            >
              Try another email
            </button>
          </div>
        )
        : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block mb-2 font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email || ""}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={state === "loading"}
                className="w-full p-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={state === "loading"}
              className="w-full py-3 bg-amber-700 text-white rounded-md hover:bg-amber-800 disabled:bg-amber-500 disabled:cursor-not-allowed transition-colors font-medium letter-spacing-tight"
            >
              {state === "loading" ? "Sending..." : "Sign in with magic link"}
            </button>

            <p className="text-sm text-gray-500 text-center mt-4">
              Get a magic email sign in link
            </p>
          </form>
        )}
    </div>
  );
}
