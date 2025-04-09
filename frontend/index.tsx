/** @jsxImportSource https://esm.sh/react@19.0.0 */
import { createRoot } from "https://esm.sh/react-dom@19.0.0/client";
import { BrowserRouter } from "https://esm.sh/react-router-dom@7.4.1?deps=react@19.0.0,react-dom@19.0.0";
import { App } from "./components/App.tsx";

const root = document.getElementById("root");
if (!root) {
  throw new Error("No root element found");
}

createRoot(root).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
