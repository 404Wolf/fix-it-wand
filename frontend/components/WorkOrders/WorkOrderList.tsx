/** @jsxImportSource https://esm.sh/react@19.0.0 */

import { Skeleton } from "../Loading.tsx";
import { WorkOrder } from "../../types.ts";
import { WorkOrderItem } from "./WorkOrderItem.tsx";

type WorkOrdersListProps = {
  workorders: WorkOrder[];
  loading?: boolean;
  error?: string | null;
  onChange?: () => void; // Callback for when any workorder changes
};

export function WorkOrdersList({
  workorders,
  loading = false,
  error = null,
  onChange,
}: WorkOrdersListProps) {
  if (loading && workorders.length === 0) {
    return <Skeleton />;
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
              <WorkOrderItem
                key={workorder.id}
                workorder={workorder}
                onChange={onChange}
              />
            ))}
          </div>
        )}
    </div>
  );
}
