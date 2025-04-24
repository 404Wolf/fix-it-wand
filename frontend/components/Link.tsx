/** @jsxImportSource https://esm.sh/react@19.0.0 */

import { Link as RouterLink } from "https://esm.sh/react-router-dom@7.4.1?deps=react@19.0.0,react-dom@19.0.0";

interface LinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export function Link({ to, children, className = "" }: LinkProps) {
  return (
    <RouterLink
      to={to}
      className={className}
    >
      {children}
    </RouterLink>
  );
}
