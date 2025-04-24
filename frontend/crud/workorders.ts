import { WorkOrder } from "../../backend/db/schemas_http.ts";

/**
 * Fetches all workorders for the current user
 *
 * @returns Promise with workorders array and any error
 */
export async function fetchWorkorders(): Promise<{
  workorders: WorkOrder[];
  error: string | null;
}> {
  const response = await fetch("/api/workorders/user", {
    credentials: "include",
  });

  if (!response.ok) throw new Error("Failed to fetch workorders");

  const data = await response.json();
  return { workorders: data.workorders, error: null };
}

/**
 * Sends a workorder to the client
 *
 * @param id The ID of the workorder to send
 * @returns Promise with success status and any error
 */
export async function sendWorkorder(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const response = await fetch(`/api/workorders/user/${id}/send`, {
    method: "POST",
    credentials: "include",
  });
  return await response.json();
}

/**
 * Marks a workorder as complete
 *
 * @param id The ID of the workorder to complete
 * @returns Promise with success status and any error
 */
export async function completeWorkorder(id: string): Promise<void> {
  const response = await fetch(`/api/workorders/user/${id}/complete`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) throw new Error("Failed to complete workorder");
}

/**
 * Deletes a workorder
 *
 * @param id The ID of the workorder to delete
 * @returns Promise with success status and any error
 */
export async function deleteWorkorder(id: string): Promise<void> {
  const response = await fetch(`/api/workorders/user/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) throw new Error("Failed to delete workorder");
}
