/** @jsxImportSource https://esm.sh/react@19.0.0 */

import { STYLES } from "../../../shared/consts.ts";
import { WorkOrder } from "../../types.ts";
import { ActionButton } from "./ActionButton.tsx";
import { StatusBadge } from "./StatusBadge.tsx";

type WorkOrderItemProps = {
  workorder: WorkOrder;
  onSend: (id: string) => Promise<void>;
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

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this workorder?")) {
      await onDelete(workorder.id);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <div>
          <StatusBadge status={workorder.status} />
          <p className="text-sm text-gray-500 mt-1">
            Created: {new Date(workorder.createdAt!).toLocaleString()}
          </p>
        </div>

        <div className="flex space-x-2">
          {workorder.status === "unsent" && (
            <ActionButton
              onClick={() => onSend(workorder.id)}
              disabled={isActionInProgress}
              colorClass={STYLES.primary}
              label="Email to Self"
              loadingLabel="Sending..."
              isLoading={isActionInProgress}
            />
          )}

          {workorder.status === "pending" && (
            <ActionButton
              onClick={() => onComplete(workorder.id)}
              disabled={isActionInProgress}
              colorClass={STYLES.success}
              label="Mark Complete"
              loadingLabel="Updating..."
              isLoading={isActionInProgress}
            />
          )}

          <ActionButton
            onClick={handleDelete}
            disabled={isActionInProgress}
            colorClass={STYLES.danger}
            label="Delete"
            loadingLabel="Deleting..."
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
