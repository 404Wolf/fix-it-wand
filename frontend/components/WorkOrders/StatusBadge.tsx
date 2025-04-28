/** @jsxImportSource https://esm.sh/react@19.0.0 */

import { STYLES } from "../../../shared/consts.ts";

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusBadgeColor = (status: string) => {
    return STYLES[status as keyof typeof STYLES] || STYLES.default;
  };

  const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
        getStatusBadgeColor(status)
      }`}
    >
      {formattedStatus}
    </span>
  );
}
