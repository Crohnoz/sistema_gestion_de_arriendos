import React from "react";
import { createRoot } from "react-dom/client";
import RuntimeErrorBoundary from "./RuntimeErrorBoundary.jsx";
import AdminAccessibilityTools from "./AdminAccessibilityTools.jsx";
import "./styles.css";
import "./enhancements.css";
import "./typography.css";
import "./thermalPrint.css";
import "./runtime.css";
import "./authEnhancements.css";
import "./arrendiaLogin.css";
import "./adminAccessibilityTools.css";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

const toolsElement = document.createElement("div");
toolsElement.id = "admin-tools-root";
document.body.appendChild(toolsElement);
const toolsRoot = createRoot(toolsElement);
toolsRoot.render(<AdminAccessibilityTools />);

async function bootApplication() {
  try {
    const [{ default: BootstrapApp }] = await Promise.all([
      import("./BootstrapApp.jsx"),
      import("./thermalPrint.js"),
    ]);

    root.render(
      <RuntimeErrorBoundary>
        <BootstrapApp />
      </RuntimeErrorBoundary>,
    );
  } catch (error) {
    console.error("No fue posible iniciar la aplicación", error);
    root.render(
      <main className="runtime-center">
        <h1>No se pudo abrir el sistema</h1>
        <p>{error?.message || "Error desconocido durante la carga."}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Intentar nuevamente
        </button>
      </main>,
    );
  }
}

bootApplication();
