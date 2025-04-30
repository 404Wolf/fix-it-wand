/** @jsxImportSource https://esm.sh/react@19.0.0 */

import { useEffect, useRef, useState } from "https://esm.sh/react@19.0.0";
import { WorkOrder } from "../../types.ts";
import { ActionButton } from "./ActionButton.tsx";
import { StatusBadge } from "./StatusBadge.tsx";
import { client } from "../../hono.ts";
import {
  BsCheck,
  BsCheckCircle,
  BsPencil,
  BsSend,
  BsTrash,
} from "https://esm.sh/react-icons@5.5.0/bs";

type WorkOrderItemProps = {
  workorder: WorkOrder;
  onChange?: () => void;
};

export function WorkOrderItem({ workorder, onChange }: WorkOrderItemProps) {
  const [customEmail, setCustomEmail] = useState("customerservice@case.edu");
  const [isSending, setIsSending] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [emailSubject, setEmailSubject] = useState(workorder.email_subject);
  const [emailBody, setEmailBody] = useState(workorder.email_body);
  const saveTimeoutRef = useRef<number | null>(null);

  const isActionInProgress = isSending || isCompleting || isDeleting ||
    isSaving;

  const sendEmail = async (email?: string) => {
    setIsSending(true);
    await client.workorders[":id"].send.$post({
      param: { id: workorder.id, email: email || customEmail },
    });
    onChange?.();
    setIsSending(false);
  };

  const completeWorkOrder = async () => {
    setIsCompleting(true);
    await client.workorders[":id"].complete.$post({
      param: { id: workorder.id },
    });
    onChange?.();
    setIsCompleting(false);
  };

  const deleteWorkOrder = async () => {
    if (!confirm("Are you sure you want to delete this workorder?")) {
      return;
    }

    setIsDeleting(true);
    await client.workorders[":id"].$delete({ param: { id: workorder.id } });
    onChange?.();
    setIsDeleting(false);
  };

  const togglePending = async () => {
    setIsCompleting(true);
    const currentStatus = workorder.status;
    let newStatus = "pending" as "pending" | "done" | "unsent";

    if (currentStatus === "pending" || currentStatus === "done") {
      newStatus = "unsent";
    }

    await client.workorders[":id"].status.$post({
      param: { id: workorder.id },
      json: { status: newStatus },
    });
    onChange?.();
    setIsCompleting(false);
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      await client.workorders[":id"].$put({
        param: { id: workorder.id },
        json: {
          email_subject: emailSubject,
          email_body: emailBody,
        },
      });
      onChange?.();
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save changes as user types with debounce
  useEffect(() => {
    if (
      isEditing &&
      (emailSubject !== workorder.email_subject ||
        emailBody !== workorder.email_body)
    ) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveChanges();
      }, 1000) as unknown as number;
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [emailSubject, emailBody, isEditing]);

  return (
    <div className="p-4 bg-white rounded-lg shadow flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
        <div>
          <button
            type="button"
            onClick={togglePending}
          >
            <StatusBadge status={workorder.status} />
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Created: {new Date(workorder.createdAt!).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <ActionButton
            onClick={() => setIsEditing(!isEditing)}
            disabled={isActionInProgress}
            colorClass={`${
              isEditing
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-500 hover:bg-gray-600"
            } text-white`}
            icon={isEditing ? <BsCheck /> : <BsPencil />}
            iconOnly
            title={isEditing ? "Done Editing" : "Edit Email"}
          />

          <ActionButton
            onClick={sendEmail}
            disabled={isActionInProgress}
            colorClass="bg-blue-500 hover:bg-blue-600 text-white"
            icon={<BsSend />}
            label="Email Self"
            title="Email Self"
            isLoading={isSending}
            loadingLabel="..."
          />

          <div className="flex items-center border border-gray-300 rounded-md h-8">
            <input
              type="email"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              className="px-2 text-xs h-full w-28 sm:w-32"
              placeholder="Email address"
              disabled={isActionInProgress}
            />
            <button
              type="button"
              onClick={() => sendEmail(customEmail)}
              disabled={isActionInProgress}
              className="flex items-center justify-center w-8 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 h-full"
              title="Send to Email"
            >
              {isSending ? "..." : <BsSend />}
            </button>
          </div>

          <ActionButton
            onClick={completeWorkOrder}
            disabled={isActionInProgress}
            colorClass="bg-emerald-500 hover:bg-emerald-600 text-white"
            icon={<BsCheckCircle />}
            iconOnly
            title="Mark as Complete"
            isLoading={isCompleting}
            loadingLabel="..."
          />

          <ActionButton
            onClick={deleteWorkOrder}
            disabled={isActionInProgress}
            colorClass="bg-rose-500 hover:bg-rose-600 text-white"
            icon={<BsTrash />}
            iconOnly
            title="Delete"
            isLoading={isDeleting}
            loadingLabel="..."
          />
        </div>
      </div>

      <div className="mt-2">
        {isEditing
          ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSaving}
                />
              </div>
              <div>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[200px]"
                  disabled={isSaving}
                />
              </div>
            </>
          )
          : (
            <>
              <div className="bg-gray-100 text-gray-800 rounded-md p-2 mt-1 whitespace-pre-line mb-4">
                {emailSubject}
              </div>
              <div className="bg-gray-100 text-gray-800 rounded-md p-2 mt-1 whitespace-pre-line">
                {emailBody}
              </div>
            </>
          )}
      </div>
    </div>
  );
}
