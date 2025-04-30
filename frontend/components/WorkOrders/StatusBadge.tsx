/** @jsxImportSource https://esm.sh/react@19.0.0 */

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "done":
        return "bg-green-100 text-green-800";
      case "unsent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
