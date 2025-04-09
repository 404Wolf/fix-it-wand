/** @jsxImportSource https://esm.sh/react@19.0.0 */
import { useState } from "https://esm.sh/react@19.0.0";
import { AudioRecorder } from "./AudioRecorder.tsx";
import { ImageUploader } from "./ImageUploader.tsx";
import { useAuth } from "../../../hooks/useAuth.ts";

type EmailData = {
  subject: string;
  body: string;
};

export function GenerateWorkOrderForm() {
  const { user } = useAuth();

  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<EmailData | null>(null);

  const [imageB64, setImageB64] = useState<string | null>(null);
  const [audioB64, setAudioB64] = useState<string | null>(null);

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

    setIsSubmitting(true);

    try {
      // Submit work order with base64 encoded data
      const response = await fetch("/api/workorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageB64,
          audioB64,
          fromName: `${user.firstName} ${user.lastName}`,
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to generate work order");

      const data = await response.json();
      if (data.success && data.email) {
        setGeneratedEmail(data.email);
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonClass = `w-full px-4 py-2 rounded-md font-medium ${
    isSubmitting || !audioB64 || !imageB64
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-amber-600 hover:bg-amber-700 text-white"
  }`;

  return (
    <div className="bg-stone-50 rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-medium tracking-tight mb-4">
        Try Generating a Work Order
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
                disabled={isSubmitting || !audioB64 || !imageB64}
                className={buttonClass}
              >
                {isSubmitting ? "Generating..." : "Generate Work Order Email"}
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
            </div>
            <button
              type="submit"
              onClick={() => {
                setGeneratedEmail(null);
                setAudioB64(null);
                setImageB64(null);
              }}
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
            >
              Submit Another Work Order
            </button>
          </div>
        )}
    </div>
  );
}
