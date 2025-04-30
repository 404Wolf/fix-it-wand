/** @jsxImportSource https://esm.sh/react@19.0.0 */
import { useState } from "https://esm.sh/react@19.0.0";
import { AudioRecorder } from "./AudioRecorder.tsx";
import { ImageUploader } from "./ImageUploader.tsx";
import { useAuth } from "../../../hooks/useAuth.ts";
import { client } from "../../../hono.ts";

type EmailData = {
  subject: string;
  body: string;
};

type DemoFormProps = {
  onNew?: () => void;
};

export function GenerateWorkorderForm({ onNew }: DemoFormProps) {
  const { user, checkAuth } = useAuth();

  const [generatedEmail, setGeneratedEmail] = useState<EmailData | null>(null);
  const [savedWorkOrderId, setSavedWorkOrderId] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [audioB64, setAudioB64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateEmail = async () => {
    setIsGenerating(true);
    if (!audioB64 || !imageB64 || !user) return;

    const response = await client.workorders.generate.$post({
      json: {
        imageB64,
        audioB64,
        fromName: `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.email,
      },
    });

    const data = await response.json();
    setGeneratedEmail(data.email);
    setIsGenerating(false);
  };

  const saveWorkorder = async () => {
    setIsSaving(true);
    try {
      if (!generatedEmail) return;
      await checkAuth();
      if (!user) return;

      const response = await client.workorders.$post({
        json: {
          email_subject: generatedEmail.subject,
          email_body: generatedEmail.body,
        },
      });

      const data = await response.json();
      setSavedWorkOrderId(data.workorder.id);
      if (onNew) {
        onNew();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!audioB64 || !imageB64) return;
    if (!user) return;
    await generateEmail();
  };

  const buttonClass = `w-full px-4 py-2 rounded-md font-medium ${
    isGenerating || !audioB64 || !imageB64
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-amber-600 hover:bg-amber-700 text-white"
  }`;

  return (
    <div className="bg-stone-50 rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-medium tracking-tight mb-4">
        Generate a CWRU Work Order!
      </h2>

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
                disabled={isGenerating || !audioB64 || !imageB64}
                className={buttonClass}
              >
                {isGenerating ? "Generating..." : "Generate Work Order Email"}
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
                disabled={isSaving || !!savedWorkOrderId}
                onClick={saveWorkorder}
                className={`flex-1 px-4 py-2 rounded-md font-medium ${
                  isSaving || savedWorkOrderId
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isSaving
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
