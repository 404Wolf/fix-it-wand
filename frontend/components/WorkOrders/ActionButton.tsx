/** @jsxImportSource https://esm.sh/react@19.0.0 */

import { ReactNode } from "https://esm.sh/react@19.0.0";

export type ActionButtonProps = {
  onClick: () => void;
  disabled: boolean;
  colorClass: string;
  label?: string;
  loadingLabel?: string;
  isLoading?: boolean;
  icon?: ReactNode;
  iconOnly?: boolean;
  title?: string;
};

export function ActionButton({
  onClick,
  disabled,
  colorClass,
  label = "",
  loadingLabel = "...",
  isLoading = false,
  icon,
  iconOnly = false,
  title,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      className={`${
        iconOnly ? "w-8 h-8 flex items-center justify-center" : "px-3 py-1"
      } text-sm rounded ${colorClass} flex items-center gap-1`}
    >
      {isLoading ? loadingLabel : (
        <>
          {icon && <span className="flex items-center">{icon}</span>}
          {!iconOnly && label && <span>{label}</span>}
        </>
      )}
    </button>
  );
}
