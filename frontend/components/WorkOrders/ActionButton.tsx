/** @jsxImportSource https://esm.sh/react@19.0.0 */

export type ActionButtonProps = {
  onClick: () => void;
  disabled: boolean;
  colorClass: string;
  label: string;
  loadingLabel: string;
  isLoading: boolean;
};

export function ActionButton({
  onClick,
  disabled,
  colorClass,
  label,
  loadingLabel,
  isLoading,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 text-sm rounded ${colorClass}`}
    >
      {isLoading ? loadingLabel : label}
    </button>
  );
}
