/** @jsxImportSource https://esm.sh/react@19.0.0 */
import { useCallback, useRef, useState } from "https://esm.sh/react@19.0.0";
import { convertToBase64 } from "../../../utils.ts";
import Webcam from "https://esm.sh/react-webcam@7.2.0?deps=react@19.0.0";
import { isMobile } from "https://esm.sh/react-device-detect@2.2.3";

export function ImageUploader({ onImageSelected }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    try {
      // Set preview immediately
      setPreviewUrl(URL.createObjectURL(file));

      // Convert file to base64 - this works because File is a type of Blob
      const base64 = await convertToBase64(file);

      // Call the callback with the base64 string
      if (onImageSelected) {
        onImageSelected(base64);
      }

      // Hide camera if it was showing
      setShowCamera(false);
    } catch (error) {
      console.error("Failed to process image:", error);
      setError("Failed to process image. Please try again.");
    }
  };

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setPreviewUrl(imageSrc);

      if (onImageSelected) {
        onImageSelected(imageSrc);
      }

      setShowCamera(false);
    }
  }, [webcamRef, onImageSelected]);

  // Set video constraints based on device type using react-device-detect
  const videoConstraints = {
    width: 480,
    height: 360,
    facingMode: isMobile ? "environment" : "user",
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Upload image of the issue
      </label>
      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowCamera(!showCamera)}
            className="h-10 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 whitespace-nowrap"
          >
            {showCamera ? "Hide Camera" : "Use Camera"}
          </button>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4
                   file:py-2 file:px-4 file:rounded-md file:border-0
                   file:h-10 file:text-sm file:font-medium file:bg-amber-600
                   file:text-white hover:file:bg-amber-700"
          />
        </div>

        {showCamera && (
          <div className="mt-2">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              width={480}
              height={360}
              className="rounded-md"
            />
            <button
              type="button"
              className="mt-2 h-10 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
              onClick={capture}
            >
              Capture Photo
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Using {isMobile ? "rear" : "front"} camera
            </p>
          </div>
        )}

        {previewUrl && !showCamera && (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-xs max-h-48 rounded-md mt-2"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  onImageSelected(null);
                }}
                className="text-sm text-amber-600 hover:text-amber-800"
              >
                Remove image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
