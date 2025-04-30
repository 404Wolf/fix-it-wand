/** @jsxImportSource https://esm.sh/react@19.0.0 */

import { DEFAULT_SEND_TO_EMAIL } from "../../../shared/consts.ts";
import { WorkOrder } from "../../types.ts";
import { ActionButton } from "./ActionButton.tsx";
import { StatusBadge } from "./StatusBadge.tsx";
import { useState } from "https://esm.sh/react@19.0.0";
import { BsSend } from "https://esm.sh/react-icons@5.5.0/bs";

type WorkOrderItemProps = {
  workorder: WorkOrder;
  onSend: (id: string, email?: string) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  actionInProgress: string | null;
};

export function WorkOrderItem({
  workorder,
  onSend,
  onComplete,
  onDelete,
  actionInProgress,
}: WorkOrderItemProps) {
  const isActionInProgress = actionInProgress === workorder.id;
  const [customEmail, setCustomEmail] = useState("customerservice@case.edu");

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this workorder?")) {
      await onDelete(workorder.id);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div>
          <StatusBadge status={workorder.status} />
          <p className="text-xs text-gray-500 mt-1">
            Created: {new Date(workorder.createdAt!).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ActionButton
            onClick={() => onSend(workorder.id)}
            disabled={isActionInProgress}
            colorClass="bg-blue-500 hover:bg-blue-600 text-white"
            label="Email Self"
            loadingLabel="Sending..."
            isLoading={isActionInProgress}
          />

          <div className="flex items-center border border-gray-300 rounded-md h-8">
            <input
              type="email"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              className="px-2 text-xs h-full min-w-0 border-none"
              placeholder="Email address"
              disabled={isActionInProgress}
            />
            <button
              type="button"
              onClick={() => onSend(workorder.id, customEmail)}
              disabled={isActionInProgress}
              className="flex items-center justify-center h-full px-2 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
              title="Send"
            >
              {isActionInProgress ? "..." : <BsSend />}
            </button>
          </div>

          <ActionButton
            onClick={() => onComplete(workorder.id)}
            disabled={isActionInProgress}
            colorClass="bg-emerald-500 hover:bg-emerald-600 text-white"
            label="Complete"
            loadingLabel="..."
            isLoading={isActionInProgress}
          />

          <ActionButton
            onClick={handleDelete}
            disabled={isActionInProgress}
            colorClass="bg-rose-500 hover:bg-rose-600 text-white"
            label="Delete"
            loadingLabel="..."
            isLoading={isActionInProgress}
          />
        </div>
      </div>

      <div className="mt-2">
        <div className="bg-gray-100 text-gray-800 rounded-md p-2 mt-1 whitespace-pre-line mb-4">
          {workorder.email_subject}
        </div>
        <div className="bg-gray-100 text-gray-800 rounded-md p-2 mt-1 whitespace-pre-line">
          {workorder.email_body}
        </div>
      </div>
    </div>
  );
}
