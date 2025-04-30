/** @jsxImportSource https://esm.sh/react@19.0.0 */

import { useState } from "https://esm.sh/react@19.0.0";
import { WorkOrder } from "../../types.ts";
import { ActionButton } from "./ActionButton.tsx";
import { StatusBadge } from "./StatusBadge.tsx";
import { client } from "../../hono.ts";
import { BsSend } from "https://esm.sh/react-icons@5.5.0/bs";

type WorkOrderItemProps = {
  workorder: WorkOrder;
  onChange?: () => void; // Callback for when this workorder changes
};

export function WorkOrderItem({ workorder, onChange }: WorkOrderItemProps) {
  const [customEmail, setCustomEmail] = useState("customerservice@case.edu");
  const [isSending, setIsSending] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isActionInProgress = isSending || isCompleting || isDeleting;

  const sendEmail = async (email?: string) => {
    try {
      setIsSending(true);
      await client.workorders[":id"].send.$post({
        param: { id: workorder.id, email: email || customEmail },
      });
      onChange?.();
    } catch (error) {
      console.error("Failed to send email:", error);
    } finally {
      setIsSending(false);
    }
  };

  const completeWorkOrder = async () => {
    try {
      setIsCompleting(true);
      await client.workorders[":id"].complete.$post({
        param: { id: workorder.id },
      });
      onChange?.();
    } catch (error) {
      console.error("Failed to complete workorder:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const deleteWorkOrder = async () => {
    if (!confirm("Are you sure you want to delete this workorder?")) {
      return;
    }

    try {
      setIsDeleting(true);
      await client.workorders[":id"].$delete({ param: { id: workorder.id } });
      onChange?.();
    } catch (error) {
      console.error("Failed to delete workorder:", error);
    } finally {
      setIsDeleting(false);
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
            onClick={sendEmail}
            disabled={isActionInProgress}
            colorClass="bg-blue-500 hover:bg-blue-600 text-white"
            label="Email Self"
            loadingLabel="Sending..."
            isLoading={isSending}
          />

          <div className="flex items-center border border-gray-300 rounded-md h-8">
            <input
              type="email"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              className="px-2 text-xs h-full min-w-0"
              placeholder="Email address"
              disabled={isActionInProgress}
            />
            <button
              type="button"
              onClick={() => sendEmail(customEmail)}
              disabled={isActionInProgress}
              className="flex items-center justify-center px-2 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
              title="Send"
            >
              {isSending ? "..." : <BsSend />}
            </button>
          </div>

          <ActionButton
            onClick={completeWorkOrder}
            disabled={isActionInProgress}
            colorClass="bg-emerald-500 hover:bg-emerald-600 text-white"
            label="Complete"
            loadingLabel="..."
            isLoading={isCompleting}
          />

          <ActionButton
            onClick={deleteWorkOrder}
            disabled={isActionInProgress}
            colorClass="bg-rose-500 hover:bg-rose-600 text-white"
            label="Delete"
            loadingLabel="..."
            isLoading={isDeleting}
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
