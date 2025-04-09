/** @jsxImportSource https://esm.sh/react@19.0.0 */
import { useState } from "https://esm.sh/react@19.0.0";
import { WorkOrder } from "../../../backend/db/schemas_http.ts";

type WorkOrdersListProps = {
  workorders: WorkOrder[];
  loading?: boolean;
  error?: string | null;
  onSendWorkorder: (id: string) => Promise<void>;
  onCompleteWorkorder: (id: string) => Promise<void>;
  onDeleteWorkorder: (id: string) => Promise<void>;
};

const COLORS = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50",
  success: "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
  pending: "bg-yellow-100 text-yellow-800",
  unsent: "bg-gray-100 text-gray-800",
  done: "bg-green-100 text-green-800",
  default: "bg-gray-100 text-gray-800",
};

export function WorkOrdersList({
  workorders,
  loading = false,
  error = null,
  onSendWorkorder,
  onCompleteWorkorder,
  onDeleteWorkorder,
}: WorkOrdersListProps) {
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return COLORS.pending;
      case "unsent":
        return COLORS.unsent;
      case "done":
        return COLORS.done;
      default:
        return COLORS.default;
    }
  };

  // Handler functions with loading state management
  const handleSend = async (id: string) => {
    setActionInProgress(id);
    try {
      await onSendWorkorder(id);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleComplete = async (id: string) => {
    setActionInProgress(id);
    try {
      await onCompleteWorkorder(id);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workorder?")) return;

    setActionInProgress(id);
    try {
      await onDeleteWorkorder(id);
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading && workorders.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {workorders.length === 0
        ? (
          <div className="p-6 bg-white rounded-lg shadow text-center">
            <p className="text-gray-500">You don't have any work orders yet.</p>
          </div>
        )
        : (
          <div className="grid gap-4">
            {workorders.map((workorder) => (
              <div
                key={workorder.id}
                className="p-4 bg-white rounded-lg shadow flex flex-col"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        getStatusBadgeColor(workorder.status)
                      }`}
                    >
                      {workorder.status.charAt(0).toUpperCase() +
                        workorder.status.slice(1)}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      Created: {new Date(workorder.createdAt!).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {workorder.status === "unsent" && (
                      <button
                        onClick={() => handleSend(workorder.id)}
                        disabled={actionInProgress === workorder.id}
                        className={`px-3 py-1 text-sm rounded ${COLORS.primary}`}
                      >
                        {actionInProgress === workorder.id
                          ? "Sending..."
                          : "Send"}
                      </button>
                    )}
                    {workorder.status === "pending" && (
                      <button
                        onClick={() => handleComplete(workorder.id)}
                        disabled={actionInProgress === workorder.id}
                        className={`px-3 py-1 text-sm rounded ${COLORS.success}`}
                      >
                        {actionInProgress === workorder.id
                          ? "Updating..."
                          : "Mark Complete"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(workorder.id)}
                      disabled={actionInProgress === workorder.id}
                      className={`px-3 py-1 text-sm rounded ${COLORS.danger}`}
                    >
                      {actionInProgress === workorder.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm">
                    <div className="bg-gray-100 text-gray-800 rounded-md p-2 mt-1 whitespace-pre-line mb-4">
                      {workorder.email_subject}
                    </div>
                    <div className="bg-gray-100 text-gray-800 rounded-md p-2 mt-1 whitespace-pre-line">
                      {workorder.email_body}
                    </div>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

