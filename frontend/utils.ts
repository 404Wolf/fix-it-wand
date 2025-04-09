/**
 * Uploads a file or blob to the server with an automatically generated UUID
 *
 * @param file - The file or blob to upload
 * @returns Promise resolving to the uploaded file URL
 * @throws Error if the upload fails or the server returns an unsuccessful response
 */
export async function uploadFile(file: File | Blob): Promise<string> {
  // Generate a UUID for the file
  const uuid = crypto.randomUUID();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("uuid", uuid);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error(`File upload failed`);

  const data = await response.json();
  if (!data.success || !data.fileUrl) throw new Error(`upload failed`);

  return data.fileUrl;
}

/**
 * Converts a Blob or File to a base64 encoded string.
 *
 * @param file - The Blob or File object to convert
 * @returns A Promise that resolves with the base64 encoded string representation of the file
 * @throws Will reject the promise if the FileReader encounters an error
 */
export function convertToBase64(file: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
