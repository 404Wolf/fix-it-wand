/** @jsxImportSource https://esm.sh/react@19.0.0 */
import { useReactMediaRecorder } from "https://esm.sh/react-media-recorder@1.7.1?deps=react@19.0.0,react-dom@19.0.0";
import { useEffect, useState } from "https://esm.sh/react@19.0.0";
import { convertToBase64 } from "../../../utils.ts";

export interface AudioRecorderProps {
  onRecordingComplete: (base64Audio: string | null) => void;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } =
    useReactMediaRecorder({ audio: true });
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRecording = status === "recording";
  const hasRecordedAudio = status === "stopped" && mediaBlobUrl;
  const hasAudio = audioBase64 !== null;

  useEffect(() => {
    if (hasRecordedAudio && mediaBlobUrl && !audioBase64) {
      const processRecording = async () => {
        // Fetch the blob from mediaBlobUrl
        const response = await fetch(mediaBlobUrl);
        const audioBlob = await response.blob();

        // Convert blob to base64
        const base64data = await convertToBase64(audioBlob);
        setAudioBase64(base64data);

        // Call the callback with the base64 data
        if (onRecordingComplete) onRecordingComplete(base64data);
      };

      processRecording();
    }
  }, [hasRecordedAudio, mediaBlobUrl, onRecordingComplete, audioBase64]);

  const handleReset = () => {
    clearBlobUrl();
    setAudioBase64(null);
    onRecordingComplete(null);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setError("Please select a valid audio file");
      return;
    }

    try {
      // Convert file to base64
      const base64 = await convertToBase64(file);
      setAudioBase64(base64);

      // Call the callback with the base64 data
      if (onRecordingComplete) onRecordingComplete(base64);
    } catch (error) {
      console.error("Failed to process audio file:", error);
      setError("Failed to process audio file. Please try again.");
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Audio description of the issue
      </label>
      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}

      {!hasAudio
        ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`h-10 px-4 py-2 rounded-md font-medium whitespace-nowrap ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                }`}
              >
                {isRecording ? "Stop Recording" : "Start Recording"}
              </button>

              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="block w-full text-sm text-gray-500 file:mr-4
                    file:py-2 file:px-4 file:rounded-md file:border-0
                    file:h-10 file:text-sm file:font-medium file:bg-amber-600
                    file:text-white hover:file:bg-amber-700"
              />
            </div>

            {isRecording && (
              <div className="text-sm text-red-600 animate-pulse">
                Recording... Click "Stop Recording" when finished.
                <br />
                Make sure to say the location!
              </div>
            )}
          </div>
        )
        : (
          <div className="w-full flex flex-col">
            <audio
              controls
              src={mediaBlobUrl || audioBase64}
              className="w-full"
            />
            <div className="mt-2 flex justify-between">
              <span className="text-sm text-green-600">
                Audio ready
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-amber-600 hover:text-amber-800"
              >
                Replace audio
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
