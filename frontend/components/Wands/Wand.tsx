/** @jsxImportSource https://esm.sh/react@19.0.0 */

import { useQuery } from "https://esm.sh/@tanstack/react-query@5.74.7?deps=react@19.0.0";
import { client } from "../../hono.ts";
import { Skeleton } from "../Loading.tsx";

export function Wand() {
  const {
    data: wandInfo,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["wand"],
    queryFn: async () => {
      const response = await client.wands.associate.$get();
      return await response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-xl p-5 mb-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-gray-800 mb-2">Your Wand</h3>
        <Skeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 rounded-xl p-5 mb-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-gray-800 mb-2">Your Wand</h3>
        <p className="text-red-500">
          {error instanceof Error ? error.message : "An error occurred"}
        </p>
      </div>
    );
  }

  if (!wandInfo) {
    return (
      <div className="bg-gray-50 rounded-xl p-5 mb-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-gray-800 mb-2">Your Wand</h3>
        <p className="text-gray-600">No wand information available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
      <h3 className="font-bold text-lg text-gray-900 mb-1 tracking-tight">
        Your Wand
      </h3>
      <hr className="my-2 border-gray-200" />

      <div className="mb-1 flex items-center gap-3">
        <span className="font-semibold text-gray-700">Status:</span>
        <span
          className={`flex items-center gap-2 ${
            wandInfo.verified ? "text-green-600" : "text-amber-600"
          }`}
        >
          <span
            className={`inline-block w-3 h-3 rounded-full ${
              wandInfo.verified ? "bg-green-400" : "bg-amber-400"
            }`}
            aria-hidden="true"
          />
          {wandInfo.verified ?  "Verified" : "Pending Verification" }
        </span>
      </div>

      {!wandInfo.verified && wandInfo.verificationCode && (
        <div className="mb-4">
          <span className="font-semibold text-gray-700 mr-2">
            Verification phrase:
          </span>
          <span className="bg-yellow-100 border border-yellow-300 px-2 py-1 rounded font-mono font-semibold text-amber-900 text-sm shadow-sm">
            associate {wandInfo.mnemonic}
          </span>
        </div>
      )}

      {!wandInfo.verified && (
        <div className="text-sm text-gray-600 border-t border-gray-200 pt-3 mt-2">
          <p className="mb-2">To pair your wand with your account:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Hold the button on your wand</li>
            <li>
              While holding, speak{" "}
              <span className="font-semibold text-gray-800">
                "associate {wandInfo.mnemonic}"
              </span>{" "}
              to the wand
            </li>
            <li>Release the button after speaking the command</li>
          </ol>
        </div>
      )}
    </div>
  );
}
