/** @jsxImportSource https://esm.sh/react@19.0.0 */
import { useState } from "https://esm.sh/react@19.0.0";

type SignInState = "idle" | "loading" | "sent";

export function SignIn() {
  const [email, setEmail] = useState<null | string>(null);
  const [state, setState] = useState<SignInState>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      console.error("Email is required and was not provided");
      return;
    }

    setState("loading");

    try {
      await fetch("/auth/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      setState("sent");
    } catch (_e) {
      setState("idle");
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 rounded-lg shadow-sm border border-gray-200 bg-white">
      <h2 className="mt-0 mb-6 text-center font-medium tracking-tight">
        Sign in to Fix It Wand
      </h2>

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
              className="w-full py-3 bg-amber-700 text-white rounded hover:bg-amber-800 disabled:bg-amber-500 disabled:cursor-not-allowed transition-colors"
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
