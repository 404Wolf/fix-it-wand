/** @jsxImportSource https://esm.sh/react@19.0.0 */
import { useState } from "https://esm.sh/react@19.0.0";
import { AudioRecorder } from "./AudioRecorder.tsx";
import { ImageUploader } from "./ImageUploader.tsx";
import { useAuth } from "../../../hooks/useAuth.ts";
import { client } from "../../../hono.ts";
import { useMutation } from "https://esm.sh/@tanstack/react-query@5.74.7?deps=react@19.0.0";

type EmailData = {
  subject: string;
  body: string;
};

type DemoFormProps = {
  onNew?: () => void;
};

export function GenerateWorkorderForm({ onNew }: DemoFormProps) {
  const { user, checkAuth } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<EmailData | null>(null);
  const [savedWorkOrderId, setSavedWorkOrderId] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [audioB64, setAudioB64] = useState<string | null>(null);

  // Generate workorder email mutation
  const generateEmailMutation = useMutation<
    { success: boolean; email?: EmailData; error?: string },
    Error,
    void
  >({
    mutationFn: async () => {
      if (!audioB64 || !imageB64 || !user) {
        throw new Error("Missing required data");
      }

      const response = await client.workorders.generate.$post({
        json: {
          imageB64,
          audioB64,
          fromName: `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email,
        },
      });

      const data = await response.json();
      return {
        success: true,
        email: data.email as EmailData,
        error: undefined,
      };
    },
    onSuccess: (data) => {
      if (data.success && data.email) {
        setGeneratedEmail(data.email);
      } else {
        throw new Error(data.error || "Invalid response");
      }
    },
    onError: (err) => {
      console.error("Error:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    },
  });

  // Save workorder mutation
  const saveWorkorderMutation = useMutation<
    { success: boolean; workorder?: { id: string }; error?: string },
    Error,
    void
  >({
    mutationFn: async () => {
      if (!generatedEmail) {
        throw new Error("No work order generated");
      }

      // Refresh auth state to ensure we have the latest user data
      await checkAuth();

      if (!user) {
        throw new Error("User is not authenticated");
      }

      const response = await client.workorders.$post({
        json: {
          email_subject: generatedEmail.subject,
          email_body: generatedEmail.body,
        },
      });

      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.workorder) {
        setSavedWorkOrderId(data.workorder.id);
        // Call the onNew callback when a work order is successfully created
        if (onNew) {
          onNew();
        }
      } else {
        throw new Error("Invalid response");
      }
    },
    onError: (err) => {
      console.error("Error saving work order:", err);

      // Handle null value in column "owner_id" error specifically
      if (err instanceof Error && err.message.includes("owner_id")) {
        setError("Authentication error: please try logging out and back in");
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to save work order",
        );
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!audioB64 || !imageB64) {
      setError("Please record audio and select an image");
      return;
    }

    if (!user) {
      setError("User is not authenticated");
      return;
    }

    generateEmailMutation.mutate();
  };

  const saveWorkOrder = async () => {
    if (!generatedEmail) {
      setError("No work order generated");
      return;
    }

    setError(null);
    saveWorkorderMutation.mutate();
  };

  const buttonClass = `w-full px-4 py-2 rounded-md font-medium ${
    generateEmailMutation.isPending || !audioB64 ||
      !imageB64
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-amber-600 hover:bg-amber-700 text-white"
  }`;

  return (
    <div className="bg-stone-50 rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-medium tracking-tight mb-4">
        Generate a CWRU Work Order!
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {!generatedEmail
        ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AudioRecorder onRecordingComplete={setAudioB64} />
              <ImageUploader onImageSelected={setImageB64} />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={generateEmailMutation.isPending || !audioB64 ||
                  !imageB64}
                className={buttonClass}
              >
                {generateEmailMutation.isPending
                  ? "Generating..."
                  : "Generate Work Order Email"}
              </button>
            </div>
          </form>
        )
        : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-medium text-green-800 mb-2">
                Work Order Email Generated
              </h3>
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700">
                  Subject:
                </div>
                <div className="text-gray-800">{generatedEmail.subject}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">Body:</div>
                <div className="whitespace-pre-wrap text-gray-800">
                  {generatedEmail.body}
                </div>
              </div>
              {savedWorkOrderId && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                  Work order saved successfully!
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                disabled={saveWorkorderMutation.isPending || !!savedWorkOrderId}
                onClick={saveWorkOrder}
                className={`flex-1 px-4 py-2 rounded-md font-medium ${
                  saveWorkorderMutation.isPending ||
                    savedWorkOrderId
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {saveWorkorderMutation.isPending
                  ? "Saving..."
                  : savedWorkOrderId
                  ? "Saved"
                  : "Save to My Work Orders"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setGeneratedEmail(null);
                  setAudioB64(null);
                  setImageB64(null);
                  setSavedWorkOrderId(null);
                }}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
              >
                Generate Another Work Order
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
